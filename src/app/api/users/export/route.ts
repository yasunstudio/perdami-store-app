import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/features/users/services/user.service'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIds = searchParams.get('userIds')
    
    let users
    
    if (userIds) {
      // Export specific users
      const userIdArray = userIds.split(',')
      const results = await Promise.all(
        userIdArray.map(id => UserService.getUserById(id))
      )
      users = results
        .filter(result => result.success && result.user)
        .map(result => result.user)
    } else {
      // Export all users
      const result = await UserService.getUsers(1, 10000) // Get all users
      users = result.users
    }

    // Convert to Excel format
    const excelData = users.map(user => ({
      'ID': user?.id || '',
      'Name': user?.name || '',
      'Email': user?.email || '',
      'Role': user?.role || '',
      'Email Verified': user?.emailVerified ? 'Yes' : 'No',
      'Created At': user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '',
      'Updated At': user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('id-ID') : ''
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // Auto-fit columns
    const colWidths = [
      { wch: 30 }, // ID
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 12 }, // Role
      { wch: 15 }, // Email Verified
      { wch: 15 }, // Created At
      { wch: 15 }  // Updated At
    ]
    ws['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(wb, ws, 'Users')
    
    // Convert to buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    )
  }
}
