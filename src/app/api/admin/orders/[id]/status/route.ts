import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[STATUS UPDATE] Endpoint hit with order ID:', params.id)
  
  try {
    // Try to parse JSON
    const body = await request.json()
    console.log('[STATUS UPDATE] Body parsed successfully:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'Endpoint working correctly',
      receivedOrderId: params.id,
      receivedBody: body,
      timestamp: new Date().toISOString()
    })
    
  } catch (parseError) {
    console.error('[STATUS UPDATE] JSON parse error:', parseError)
    return NextResponse.json(
      { 
        error: 'Failed to parse request body',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      },
      { status: 400 }
    )
  }
}
