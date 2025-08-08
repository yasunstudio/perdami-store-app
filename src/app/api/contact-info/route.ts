import { NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'

export async function GET() {
  try {
    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      const contactInfo = await prisma.contactInfo.findMany({
        orderBy: { id: 'asc' }
      })
      
      return NextResponse.json(contactInfo)
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error fetching contact info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      const data = await request.json()
      const { id, ...updateData } = data
      
      const updatedContactInfo = await prisma.contactInfo.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })
      
      return NextResponse.json(updatedContactInfo)
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error updating contact info:', error)
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    )
  }
}
