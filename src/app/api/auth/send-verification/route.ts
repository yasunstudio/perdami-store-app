import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = requestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Check if user can send verification for this email (admin or own email)
    if (session.user.role !== 'ADMIN' && session.user.email !== email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Check for existing active tokens (not expired)
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: {
          gt: new Date(),
        },
      },
    })

    if (existingToken) {
      return NextResponse.json(
        { error: 'Verification email already sent. Please check your inbox or wait before requesting a new one.' },
        { status: 429 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    
    console.log('Verification email would be sent to:', email)
    console.log('Verification URL:', verificationUrl)
    
    // TODO: Implement actual email sending
    // await sendVerificationEmail(email, verificationUrl)

    // Log activity
    try {
      await auditLog.sendVerificationEmail(user.id, email, {
        tokenGenerated: true,
        expiresAt: expires
      });
    } catch (logError) {
      console.error('Failed to log verification email sending:', logError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully',
      // Remove this in production:
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}