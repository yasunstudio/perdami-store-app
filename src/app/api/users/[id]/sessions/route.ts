import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { headers } from 'next/headers'

const paramsSchema = z.object({
  id: z.string(),
})

export async function GET(
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

    // Get current session token from headers or cookies
    const headersList = await headers()
    const currentSessionToken = session.user?.id // Use user ID as fallback

    const sessions = await prisma.session.findMany({
      where: {
        userId: id,
        expires: {
          gt: new Date(), // Only active sessions
        },
      },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
      },
      orderBy: {
        expires: 'desc',
      },
    })

    // Add additional info and mark current session
    const sessionsWithInfo = sessions.map(sess => ({
      ...sess,
      isCurrent: sess.sessionToken === currentSessionToken,
      userAgent: headersList.get('user-agent') || undefined,
      ipAddress: headersList.get('x-forwarded-for') || 
                headersList.get('x-real-ip') || 
                undefined,
    }))

    return NextResponse.json(sessionsWithInfo)
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}