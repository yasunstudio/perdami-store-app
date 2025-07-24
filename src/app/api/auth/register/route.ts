import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auditLog } from '@/lib/audit'
import { notificationService } from '@/lib/notification'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Data tidak valid', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name, phone } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: 'CUSTOMER', // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    // Audit logging for user registration
    try {
      await auditLog.createUser(user.id, user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        registrationMethod: 'self-registration'
      })
    } catch (error) {
      console.error('Failed to log user registration:', error)
    }

    // Send welcome notifications
    try {
      // await notificationService.notifyNewUserRegistered(user.id)
      console.log('User registration notification skipped for now:', user.id)
    } catch (error) {
      console.error('Failed to send welcome notifications:', error)
    }

    return NextResponse.json(
      { 
        message: 'Akun berhasil dibuat',
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
