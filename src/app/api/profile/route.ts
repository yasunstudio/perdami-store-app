import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditLog } from '@/lib/audit'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi').optional(),
  phone: z.string().optional()
})

// GET - Fetch user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    console.log('📍 Profile API - Session data:', {
      exists: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionData: session
    })
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID found')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 Searching for user with ID:', session.user.id)

    // First try to find user by ID
    let user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // If user not found by ID, try to find by email (session mismatch fix)
    if (!user && session.user.email) {
      console.log('⚠️ User not found by ID, trying email:', session.user.email)
      user = await prisma.user.findUnique({
        where: {
          email: session.user.email
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    }

    console.log('👤 User found in database:', {
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      method: session.user.id === user?.id ? 'ID' : 'email'
    })

    if (!user) {
      console.log('❌ User not found in database with ID:', session.user.id, 'or email:', session.user.email)
      return NextResponse.json(
        { 
          message: 'User tidak ditemukan', 
          error: 'SESSION_USER_MISMATCH',
          suggestion: 'Silakan logout dan login kembali'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: user
    })

  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data profil' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Session user ID:', session.user.id)
    console.log('Session user:', session.user)

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    console.log('Existing user found:', !!existingUser)

    if (!existingUser) {
      return NextResponse.json(
        { message: `User dengan ID ${session.user.id} tidak ditemukan` },
        { status: 404 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name: validatedData.name || null,
        phone: validatedData.phone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      }
    })

    // Audit logging for profile update
    try {
      await auditLog.updateProfile(session.user.id, {
        name: validatedData.name,
        phone: validatedData.phone,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log profile update:', error)
    }

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('Error updating profile:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          message: 'Data tidak valid',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Gagal memperbarui profil' },
      { status: 500 }
    )
  }
}
