import { NextRequest, NextResponse } from 'next/server'

// Add GET method for basic testing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[STATUS GET] Test endpoint hit for order:', params.id)
  return NextResponse.json({ 
    success: true,
    message: 'GET endpoint working',
    orderId: params.id,
    timestamp: new Date().toISOString()
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[STATUS PATCH] Endpoint hit with order ID:', params.id)
  
  try {
    // Try to parse JSON
    const body = await request.json()
    console.log('[STATUS PATCH] Body parsed successfully:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'PATCH endpoint working correctly',
      receivedOrderId: params.id,
      receivedBody: body,
      timestamp: new Date().toISOString()
    })
    
  } catch (parseError) {
    console.error('[STATUS PATCH] JSON parse error:', parseError)
    return NextResponse.json(
      { 
        error: 'Failed to parse request body',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      },
      { status: 400 }
    )
  }
}
