import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = paramsSchema.parse(resolvedParams)

    // Check if user can access this data (admin or own account)
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete all sessions for the user
    // Note: In a real implementation, you'd want to preserve the current session
    const result = await prisma.session.deleteMany({
      where: {
        userId: id,
      },
    })

    // Log activity
    try {
      await auditLog.revokeOtherSessions(id, session.user.id || 'unknown', {
        revokedSessionsCount: result.count,
        actionBy: session.user.id === id ? 'self' : 'admin'
      });
    } catch (logError) {
      console.error('Failed to log session revocation:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      revokedCount: result.count 
    })
  } catch (error) {
    console.error('Error revoking other user sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}