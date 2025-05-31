import { NextRequest, NextResponse } from 'next/server'

// Get backend API URL
function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct the backend image URL
    const imagePath = params.path.join('/')
    const backendUrl = getBackendUrl().replace('/api', '')
    const imageUrl = `${backendUrl}/api/media/file/${imagePath}`
    
    console.log(`[Image Proxy] Requesting: ${imageUrl}`)
    
    // Fetch the image from backend
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'NextJS-Image-Proxy/1.0',
      },
      // Add timeout for better performance
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    
    if (!response.ok) {
      console.error(`[Image Proxy] Backend error: ${response.status} ${response.statusText}`)
      
      // Return 404 for missing images
      if (response.status === 404) {
        return new NextResponse('Image not found', { status: 404 })
      }
      
      // Return 500 for other errors
      return new NextResponse('Image proxy error', { status: 500 })
    }
    
    // Get the image data and content type
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Create response with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': imageBuffer.byteLength.toString(),
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    })
    
  } catch (error) {
    console.error('[Image Proxy] Error:', error)
    
    // Handle timeout or network errors
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse('Image proxy timeout', { status: 504 })
    }
    
    return new NextResponse('Image proxy error', { status: 500 })
  }
}

// Also handle HEAD requests for efficiency
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const imagePath = params.path.join('/')
    const backendUrl = getBackendUrl().replace('/api', '')
    const imageUrl = `${backendUrl}/api/media/file/${imagePath}`
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout for HEAD
    })
    
    if (!response.ok) {
      return new NextResponse(null, { status: response.status })
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const contentLength = response.headers.get('content-length')
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(contentLength && { 'Content-Length': contentLength }),
      },
    })
    
  } catch (error) {
    console.error('[Image Proxy] HEAD Error:', error)
    return new NextResponse(null, { status: 500 })
  }
} 