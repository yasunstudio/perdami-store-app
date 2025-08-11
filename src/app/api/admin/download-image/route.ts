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
    const filename = searchParams.get('filename') || 'payment-proof.jpg'
    
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

    console.log('Downloading image from:', imageUrl)

    // Fetch the image with better headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    })

    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    let contentType = imageResponse.headers.get('content-type') || 'application/octet-stream'
    
    // If content type is generic, try to determine from filename
    if (contentType === 'application/octet-stream' || contentType === 'text/plain') {
      if (filename.toLowerCase().endsWith('.png')) contentType = 'image/png'
      else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) contentType = 'image/jpeg'
      else if (filename.toLowerCase().endsWith('.gif')) contentType = 'image/gif'
      else if (filename.toLowerCase().endsWith('.webp')) contentType = 'image/webp'
      else contentType = 'image/jpeg' // default
    }

    console.log('Downloaded successfully. Size:', imageBuffer.byteLength, 'bytes, Type:', contentType)

    // Create response with proper headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
