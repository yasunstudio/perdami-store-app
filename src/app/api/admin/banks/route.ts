import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'


// Request validation schemas
const createBankSchema = z.object({
  name: z.string().min(1, 'Nama bank wajib diisi'),
  code: z.string().min(1, 'Kode bank wajib diisi'),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi'),
  accountName: z.string().min(1, 'Nama rekening wajib diisi'),
  logo: z.string().url().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  isActive: z.boolean().default(true)
})

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/admin/banks - List banks with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const {
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    } = querySchema.parse(Object.fromEntries(searchParams))

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: Record<string, any> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Build orderBy clause
     
    const orderBy: Record<string, any> = {}
    orderBy[sortBy] = sortOrder

    // Execute queries
    const [banks, totalCount] = await Promise.all([
      prisma.bank.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.bank.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limitNum)

    return NextResponse.json({
      banks: banks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/banks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}

// POST /api/admin/banks - Create new bank
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createBankSchema.parse(body)

    // Check if bank code already exists
    const existingBank = await prisma.bank.findUnique({
      where: { code: validatedData.code }
    })

    if (existingBank) {
      return NextResponse.json(
        { error: 'Bank dengan kode ini sudah ada' },
        { status: 400 }
      )
    }

    const bank = await prisma.bank.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    // Log activity
    await auditLog.createBank(session.user.id, bank.id, validatedData)
    
    console.log('Bank created successfully');

    return NextResponse.json({
      message: 'Bank berhasil ditambahkan',
      bank
    })
  } catch (error) {
    console.error('Error creating bank:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create bank' },
      { status: 500 }
    )
  }
}