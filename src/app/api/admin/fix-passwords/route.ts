import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  console.log("🔐 Fix User Passwords API called")
  
  try {
    const body = await request.json()
    const { setupKey } = body

    // Simple setup key protection
    const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "perdami-admin-setup-2025"
    
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 })
    }

    // Find users without passwords
    const usersWithoutPassword = await prisma.user.findMany({
      where: {
        OR: [
          { password: null },
          { password: "" }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log(`Found ${usersWithoutPassword.length} users without passwords`)

    const defaultPasswords = {
      'ADMIN': 'perdami123',
      'CUSTOMER': 'customer123'
    }

    const updateResults = []

    for (const user of usersWithoutPassword) {
      try {
        const defaultPassword = defaultPasswords[user.role as keyof typeof defaultPasswords] || 'defaultpassword123'
        const hashedPassword = await bcrypt.hash(defaultPassword, 12)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        updateResults.push({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          defaultPassword: defaultPassword,
          status: 'updated'
        })

        console.log(`✅ Updated password for user: ${user.email} (${user.role})`)
      } catch (error) {
        console.error(`❌ Failed to update password for user: ${user.email}`, error)
        updateResults.push({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get final count of users with and without passwords
    const [usersWithPassword, usersStillWithoutPassword] = await Promise.all([
      prisma.user.count({
        where: {
          AND: [
            { password: { not: null } },
            { password: { not: "" } }
          ]
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { password: null },
            { password: "" }
          ]
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Password update completed',
      stats: {
        usersProcessed: usersWithoutPassword.length,
        usersUpdated: updateResults.filter(r => r.status === 'updated').length,
        usersFailed: updateResults.filter(r => r.status === 'failed').length,
        usersWithPassword,
        usersStillWithoutPassword
      },
      results: updateResults,
      defaultPasswords: {
        admin: 'perdami123',
        customer: 'customer123'
      }
    })

  } catch (error) {
    console.error('❌ Error fixing user passwords:', error)
    return NextResponse.json(
      { error: 'Failed to fix user passwords' },
      { status: 500 }
    )
  }
}

// GET method to check password status
export async function GET() {
  try {
    const [usersWithPassword, usersWithoutPassword, totalUsers] = await Promise.all([
      prisma.user.count({
        where: {
          AND: [
            { password: { not: null } },
            { password: { not: "" } }
          ]
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { password: null },
            { password: "" }
          ]
        }
      }),
      prisma.user.count()
    ])

    const usersWithoutPasswordList = await prisma.user.findMany({
      where: {
        OR: [
          { password: null },
          { password: "" }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        usersWithPassword,
        usersWithoutPassword,
        percentageWithPassword: Math.round((usersWithPassword / totalUsers) * 100)
      },
      usersWithoutPassword: usersWithoutPasswordList
    })
  } catch (error) {
    console.error('❌ Error checking password status:', error)
    return NextResponse.json(
      { error: 'Failed to check password status' },
      { status: 500 }
    )
  }
}
