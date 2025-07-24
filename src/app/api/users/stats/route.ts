import { NextResponse } from 'next/server'
import { UserService } from '@/features/users/services/user.service'

export async function GET() {
  try {
    const stats = await UserService.getUserStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
