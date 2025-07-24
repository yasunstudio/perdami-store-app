import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/banks - Get active banks for public use (checkout)
export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        accountNumber: true,
        accountName: true,
        logo: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ banks })
  } catch (error) {
    console.error('Error fetching banks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}