import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama terlalu panjang'),
  phone: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name: validatedData.name,
        phone: validatedData.phone || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        updatedAt: true
      }
    })

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