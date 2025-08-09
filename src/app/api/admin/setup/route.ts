import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  console.log("🔐 Admin setup API called")
  
  try {
    const body = await request.json()
    const { email, password, name, setupKey } = body

    // Simple setup key protection (you should set this in environment variables)
    const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "perdami-admin-setup-2025"
    
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 })
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Admin user already exists',
        adminExists: true 
      }, { status: 400 })
    }

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters' 
      }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(), // Auto-verify admin
      }
    })

    console.log("✅ Admin user created:", { id: adminUser.id, email: adminUser.email })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}

// GET method to check if admin exists
export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    return NextResponse.json({
      adminExists: adminCount > 0,
      adminCount
    })
  } catch (error) {
    console.error('❌ Error checking admin status:', error)
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    )
  }
}
