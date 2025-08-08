import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database for user stats query')

    // Get total users
    const totalUsersResult = await client.query('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(totalUsersResult.rows[0].count)

    // Get total admins
    const totalAdminsResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['ADMIN'])
    const totalAdmins = parseInt(totalAdminsResult.rows[0].count)

    // Get total customers
    const totalCustomersResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['CUSTOMER'])
    const totalCustomers = parseInt(totalCustomersResult.rows[0].count)

    // Get new users this month
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const newUsersResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE "createdAt" >= $1',
      [startOfMonth]
    )
    const newUsersThisMonth = parseInt(newUsersResult.rows[0].count)

    const stats = {
      totalUsers,
      totalAdmins,
      totalCustomers,
      newUsersThisMonth
    }

    console.log('User stats:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ User stats API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
