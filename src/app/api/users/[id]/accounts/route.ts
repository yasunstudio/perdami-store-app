import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    const accounts = await prisma.account.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        type: true,
      },
      orderBy: {
        provider: 'asc',
      },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching user accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}