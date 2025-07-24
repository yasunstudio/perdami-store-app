import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'

// DELETE /api/admin/app-settings/[id] - Delete app settings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params

    // Verify the settings exist before deletion
    const existingSettings = await prisma.appSettings.findUnique({
      where: { id }
    })
    
    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Pengaturan aplikasi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete the settings
    await prisma.appSettings.delete({
      where: { id }
    })

    // Audit logging
    try {
      await auditLog.updateSettings(session.user.id, { 
        action: 'DELETE_APP_SETTINGS',
        deletedSettings: { id, appName: existingSettings.appName }
      })
    } catch (error) {
      console.error('Failed to log settings deletion:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan aplikasi berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting app settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
