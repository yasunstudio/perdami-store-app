import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/features/users/services/user.service'
import { CreateUserSchema } from '@/features/users/types/user.types'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current user session for logging
    const session = await auth()
    const actorUserId = session?.user?.id
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim())
    const expectedHeaders = ['name', 'email', 'role']
    
    // Validate headers
    const hasValidHeaders = expectedHeaders.every(header => 
      headers.some(h => h.toLowerCase() === header)
    )
    
    if (!hasValidHeaders) {
      return NextResponse.json(
        { error: `Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name')
    const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email')
    const roleIndex = headers.findIndex(h => h.toLowerCase() === 'role')

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      try {
        const userData = {
          name: values[nameIndex] || '',
          email: values[emailIndex] || '',
          role: (values[roleIndex] || 'CUSTOMER').toUpperCase() as 'ADMIN' | 'CUSTOMER'
        }

        // Validate data
        const validatedData = CreateUserSchema.parse(userData)
        
        // Create user
        const result = await UserService.createUser(validatedData, actorUserId)
        
        if (result.success) {
          imported++
        } else {
          skipped++
          errors.push(`Row ${i + 1}: ${result.error}`)
        }
      } catch (error: unknown) {
        skipped++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Row ${i + 1}: Validation failed - ${errorMessage}`)
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit errors to first 10
      message: `Import completed. ${imported} users imported, ${skipped} skipped.`
    })
  } catch (error) {
    console.error('Error importing users:', error)
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    )
  }
}
