import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL to prevent SSRF attacks
    try {
      const url = new URL(imageUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PerdamiBot/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
      }
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Create response with proper headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename="payment-proof.jpg"',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Proxy download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
