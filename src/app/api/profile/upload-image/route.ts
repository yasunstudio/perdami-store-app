import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { message: 'Tidak ada file yang diupload' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.id}-${timestamp}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/profiles/${fileName}`

    // Update user's image in database
    await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        image: imageUrl,
        updatedAt: new Date()
      }
    })

    // Log activity
    try {
      await auditLog.uploadProfileImage(session.user.id, fileName, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageUrl
      });
    } catch (logError) {
      console.error('Failed to log profile image upload:', logError);
    }

    return NextResponse.json({
      message: 'Foto profil berhasil diupload',
      imageUrl
    })

  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { message: 'Gagal mengupload gambar' },
      { status: 500 }
    )
  }
}