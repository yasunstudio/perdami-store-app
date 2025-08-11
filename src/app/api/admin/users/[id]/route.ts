import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return Response.json(
      { error: 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, emailVerified } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return Response.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        emailVerified: emailVerified ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return Response.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json(
      { error: 'Gagal memperbarui user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return Response.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return Response.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return Response.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}
