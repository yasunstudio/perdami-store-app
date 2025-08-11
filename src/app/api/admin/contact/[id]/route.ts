import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const contactInfo = await prisma.contactInfo.findUnique({
      where: { id }
    })

    if (!contactInfo) {
      return NextResponse.json(
        { error: 'Contact info not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ contactInfo })
  } catch (error) {
    console.error('Error fetching contact info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    const { type, title, value, icon, color } = data

    // Validate required fields
    if (!type || !title || !value || !icon || !color) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate contact type
    const validTypes = ['EMAIL', 'PHONE', 'WHATSAPP', 'ADDRESS', 'SOCIAL_MEDIA']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contact type' },
        { status: 400 }
      )
    }

    const contactInfo = await prisma.contactInfo.update({
      where: { id },
      data: {
        type,
        title,
        value,
        icon,
        color,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ contactInfo })
  } catch (error) {
    console.error('Error updating contact info:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Contact info not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.contactInfo.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Contact info deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact info:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Contact info not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete contact info' },
      { status: 500 }
    )
  }
}
