import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'


// Request validation schema
const updateBankSchema = z.object({
  name: z.string().min(1, 'Nama bank wajib diisi').optional(),
  code: z.string().min(1, 'Kode bank wajib diisi').optional(),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi').optional(),
  accountName: z.string().min(1, 'Nama rekening wajib diisi').optional(),
  logo: z.string().url().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/banks/[id] - Get single bank
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const bank = await prisma.bank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!bank) {
      return NextResponse.json(
        { error: 'Bank tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(bank)
  } catch (error) {
    console.error('Error fetching bank:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data bank' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/banks/[id] - Update bank
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateBankSchema.parse(body)

    // Check if bank exists
    const existingBank = await prisma.bank.findUnique({
      where: { id }
    })

    if (!existingBank) {
      return NextResponse.json(
        { error: 'Bank tidak ditemukan' },
        { status: 404 }
      )
    }

    // If updating code, check for duplicates
    if (validatedData.code) {
      const duplicateBank = await prisma.bank.findFirst({
        where: {
          code: validatedData.code,
          id: { not: id }
        }
      })

      if (duplicateBank) {
        return NextResponse.json(
          { error: 'Bank dengan kode ini sudah ada' },
          { status: 400 }
        )
      }
    }

    const updatedBank = await prisma.bank.update({
      where: { id },
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
    await auditLog.updateBank(session.user.id, id, existingBank, validatedData)
    
    console.log('Bank updated successfully');

    return NextResponse.json({
      message: 'Bank berhasil diperbarui',
      bank: updatedBank
    })
  } catch (error) {
    console.error('Error updating bank:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui bank' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/banks/[id] - Delete bank
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Check if bank exists
    const existingBank = await prisma.bank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!existingBank) {
      return NextResponse.json(
        { error: 'Bank tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if bank has associated orders
    if (existingBank._count.orders > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus bank yang memiliki transaksi' },
        { status: 400 }
      )
    }

    await prisma.bank.delete({
      where: { id }
    })

    // Get current user session for audit logging
    const session = await auth()
    if (session?.user?.id) {
      // Log activity
      await auditLog.deleteBank(session.user.id, id, existingBank)
      
      console.log('Bank deleted successfully');
    }

    return NextResponse.json({
      message: 'Bank berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting bank:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus bank' },
      { status: 500 }
    )
  }
}