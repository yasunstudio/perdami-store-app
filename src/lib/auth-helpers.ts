import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function checkAdminAuth() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
      user: null
    }
  }

  return { error: null, user }
}

export async function checkAdminOnlyAuth() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
      user: null
    }
  }

  return { error: null, user }
}

export async function requireAdmin() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return {
      success: false,
      error: 'Unauthorized - Please log in',
      user: null
    }
  }

  // Check user exists in database by email and is admin
  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
      role: 'ADMIN'
    },
    select: { id: true, email: true, role: true }
  })

  if (!user) {
    return {
      success: false,
      error: 'Forbidden - Admin access required',
      user: null
    }
  }

  return { success: true, error: null, user }
}

export async function requireAdminOnly() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized - Please log in',
      user: null
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Forbidden - Admin access required',
      user: null
    }
  }

  return { success: true, error: null, user }
}
