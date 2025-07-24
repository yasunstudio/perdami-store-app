import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string(),
  accountId: z.string(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
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
    const { id, accountId } = paramsSchema.parse(resolvedParams)

    // Check if user can access this data (admin or own account)
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if account exists and belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: id,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Check if this is the only way to sign in
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent disconnecting if it's the only authentication method and no password is set
    const hasPassword = user.password !== null
    const accountCount = user.accounts.length

    if (!hasPassword && accountCount <= 1) {
      return NextResponse.json(
        { 
          error: 'Cannot disconnect the only authentication method. Please set a password first.' 
        },
        { status: 400 }
      )
    }

    // Delete the account
    await prisma.account.delete({
      where: {
        id: accountId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}