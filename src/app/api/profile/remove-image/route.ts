import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to check if they have an image
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        image: true
      }
    })

    if (!user || !user.image) {
      return NextResponse.json(
        { message: 'Tidak ada foto profil untuk dihapus' },
        { status: 400 }
      )
    }

    // Extract filename from image URL
    const imagePath = user.image
    if (imagePath.startsWith('/uploads/profiles/')) {
      const fileName = imagePath.replace('/uploads/profiles/', '')
      const filePath = join(process.cwd(), 'public', 'uploads', 'profiles', fileName)
      
      // Delete file if it exists
      if (existsSync(filePath)) {
        try {
          await unlink(filePath)
        } catch (error) {
          console.warn('Could not delete file:', filePath, error)
          // Continue even if file deletion fails
        }
      }
    }

    // Remove image reference from database
    await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        image: null,
        updatedAt: new Date()
      }
    })

    // Log activity
    try {
      await auditLog.removeProfileImage(session.user.id, {
        previousImagePath: user.image
      });
    } catch (logError) {
      console.error('Failed to log profile image removal:', logError);
    }

    return NextResponse.json({
      message: 'Foto profil berhasil dihapus'
    })

  } catch (error: any) {
    console.error('Error removing image:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus foto profil' },
      { status: 500 }
    )
  }
}