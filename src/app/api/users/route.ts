import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/features/users/services/user.service'
import { CreateUserSchema, UpdateUserSchema, UpdateRoleSchema } from '@/features/users/types/user.types'
import { auditLog } from '@/lib/audit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role') as 'ADMIN' | 'CUSTOMER' | 'ALL' | null
    const search = searchParams.get('search')
    const verified = searchParams.get('verified')

    const filters = {
      role: role || undefined,
      search: search || undefined,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined
    }

    const result = await UserService.getUsers(page, limit, filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user session for logging
    const session = await auth()
    const actorUserId = session?.user?.id
    
    const body = await request.json()
    
    // Validate input
    const validatedData = CreateUserSchema.parse(body)
    
    const result = await UserService.createUser(validatedData, actorUserId)
    
    if (result.success) {
      return NextResponse.json(result.user, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user session for logging
    const session = await auth()
    const actorUserId = session?.user?.id
    
    const body = await request.json()
    
    // Check if it's a role update or full user update
    if (body.userId && body.role && Object.keys(body).length === 2) {
      // Role update
      const validatedData = UpdateRoleSchema.parse(body)
      const result = await UserService.updateUserRole(validatedData.userId, validatedData.role, actorUserId)
      
      if (result.success) {
        return NextResponse.json(result.user)
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }
    } else {
      // Full user update
      const validatedData = UpdateUserSchema.parse(body)
      const result = await UserService.updateUser(validatedData, actorUserId)
      
      if (result.success) {
        return NextResponse.json(result.user)
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user session for logging
    const session = await auth()
    const actorUserId = session?.user?.id
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await UserService.deleteUser(userId, actorUserId)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
