import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("📊 Database schema check")
  
  try {
    // Check table structure with raw query
    const orderItemsColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position;
    `
    
    console.log('📊 Order items columns:', orderItemsColumns)
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    return NextResponse.json({
      orderItemsColumns,
      tables,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Schema check error:', error)
    
    return NextResponse.json({
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
