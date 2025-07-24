import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { id, sessionId } = paramsSchema.parse(resolvedParams)

    // Check if user can access this data (admin or own account)
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if session exists and belongs to the user
    const userSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: id,
      },
    })

    if (!userSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Prevent deleting current session (check if it's the same user's session)
    // Note: We can't easily identify current session without additional context
    // This is a simplified check - in production you might want to store session info differently

    // Delete the session
    await prisma.session.delete({
      where: {
        id: sessionId,
      },
    })

    // Log activity
    try {
      await auditLog.revokeSession(id, sessionId, {
        sessionExpiry: userSession.expires,
        actionBy: session.user.id === id ? 'self' : 'admin',
        actionById: session.user.id
      });
    } catch (logError) {
      console.error('Failed to log session deletion:', logError);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}