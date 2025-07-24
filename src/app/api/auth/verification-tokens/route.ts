import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  email: z.string().email(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const validation = querySchema.safeParse({ email })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user can access this data (admin or own email)
    if (session.user.role !== 'ADMIN' && session.user.email !== email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const tokens = await prisma.verificationToken.findMany({
      where: {
        identifier: email,
      },
      select: {
        identifier: true,
        token: true,
        expires: true,
      },
      orderBy: {
        expires: 'desc',
      },
    })

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Error fetching verification tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}