import type { Metadata } from 'next'

interface SeoData {
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType: string
  twitterCard: string
}

// Function to fetch SEO data server-side
export async function fetchSeoData(pagePath: string): Promise<SeoData> {
  // During build time, always use fallback data (no API calls during static generation)
  // Simple detection: if we're on server-side and no runtime environment detected
  const isBuildTime = typeof window === 'undefined' && !process.env.VERCEL && !process.env.RENDER && !process.env.RAILWAY
  
  if (isBuildTime) {
    console.log(`📋 Using fallback SEO data for ${pagePath} (build time)`)
    return getFallbackSeoData(pagePath)
  }
  
  // Use the same API URL logic as other parts of the app
  const getServerApiUrl = () => {
    // In production runtime, use the environment variable
    if (process.env.NODE_ENV === 'production') {
      return process.env.NEXT_PUBLIC_API_URL || 'https://toolscandy.com/api'
    }
    
    // In development, try the configured URL or localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  }
  
  try {
    const baseUrl = getServerApiUrl()
    
    const response = await fetch(`${baseUrl}/seo/page/${encodeURIComponent(pagePath)}`, {
      cache: 'no-store', // Always fetch fresh data
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(8000)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Successfully fetched real SEO data for ${pagePath}`)
      return data.data
    } else {
      console.log(`❌ API returned ${response.status} for ${pagePath}, using fallback`)
    }
  } catch (error) {
    console.log(`❌ Failed to fetch SEO data for ${pagePath}:`, error instanceof Error ? error.message : 'Unknown error')
  }
  
  // Return fallback SEO data as last resort
  console.log(`📋 Using fallback SEO data for ${pagePath}`)
  return getFallbackSeoData(pagePath)
}

// Fallback SEO data based on page path
function getFallbackSeoData(pagePath: string): SeoData {
  switch (pagePath) {
    case '/':
      return {
        metaTitle: 'ToolsCandy - Free Image Processing Tools for Everyone',
        metaDescription: 'Free, powerful image processing tools that work right in your browser. Compress, resize, convert, and crop images with complete privacy. No uploads required.',
        metaKeywords: ['ToolsCandy', 'image tools', 'image optimization', 'image compression', 'image resize', 'browser tools', 'privacy'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/about':
      return {
        metaTitle: 'About ToolsCandy - Making Image Processing Sweet & Simple',
        metaDescription: 'Learn about ToolsCandy\'s mission to provide free, fast, and privacy-focused image processing tools. Discover our story, values, and commitment to accessible technology.',
        metaKeywords: ['ToolsCandy', 'about us', 'image processing', 'privacy first', 'free tools', 'company story', 'mission', 'values'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/contact':
      return {
        metaTitle: 'Contact ToolsCandy - Get in Touch with Our Team',
        metaDescription: 'Have questions or feedback about ToolsCandy? Contact our team for support, partnerships, or general inquiries. We respond within 24 hours.',
        metaKeywords: ['ToolsCandy', 'contact', 'support', 'help', 'feedback', 'business inquiries', 'partnerships', 'customer service'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/privacy':
      return {
        metaTitle: 'Privacy Policy - ToolsCandy\'s Commitment to Your Privacy',
        metaDescription: 'ToolsCandy\'s privacy policy explains how we protect your data. All image processing happens locally in your browser - we never access or store your files.',
        metaKeywords: ['ToolsCandy', 'privacy policy', 'data protection', 'privacy first', 'local processing', 'no data collection', 'browser-based', 'GDPR'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/terms':
      return {
        metaTitle: 'Terms of Service - ToolsCandy Usage Guidelines',
        metaDescription: 'ToolsCandy\'s terms of service outline fair usage guidelines for our free image processing tools. Clear, simple terms that protect everyone.',
        metaKeywords: ['ToolsCandy', 'terms of service', 'usage guidelines', 'terms and conditions', 'legal terms', 'service agreement', 'user rights'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/disclaimer':
      return {
        metaTitle: 'Disclaimer - Important Information About ToolsCandy',
        metaDescription: 'Important disclaimer and limitations for ToolsCandy image processing tools. Learn about service limitations, user responsibilities, and best practices.',
        metaKeywords: ['ToolsCandy', 'disclaimer', 'service limitations', 'user responsibility', 'legal disclaimer', 'terms of use', 'liability'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/blog':
      return {
        metaTitle: 'ToolsCandy Blog - Web Performance & Image Optimization Tips',
        metaDescription: 'Expert tips, tutorials, and insights about web performance, image optimization, and modern web development. Learn how to make your website faster and more efficient.',
        metaKeywords: ['ToolsCandy blog', 'web performance', 'image optimization', 'web development', 'tutorials', 'tips', 'best practices', 'performance optimization', 'web tools'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/image/compress':
      return {
        metaTitle: 'Free Image Compression Tool - Reduce File Size Online | ToolsCandy',
        metaDescription: 'Compress JPG, PNG, SVG, and GIF images while maintaining quality. Free online image compression tool that works directly in your browser. No upload required.',
        metaKeywords: ['image compression', 'reduce file size', 'compress images', 'optimize images', 'JPG compression', 'PNG compression', 'online image compressor', 'ToolsCandy'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/image/resize':
      return {
        metaTitle: 'Free Image Resize Tool - Change Image Dimensions Online | ToolsCandy',
        metaDescription: 'Resize images by pixels, percentage, or preset dimensions. Free online image resizing tool with aspect ratio lock. Works directly in your browser.',
        metaKeywords: ['image resize', 'resize images', 'change image size', 'image dimensions', 'scale images', 'image resizer', 'online resize tool', 'ToolsCandy'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/image/crop':
      return {
        metaTitle: 'Free Image Crop Tool - Crop Images Online | ToolsCandy',
        metaDescription: 'Crop images to exact dimensions or custom aspect ratios. Free online image cropping tool with visual preview. Perfect for thumbnails and profile pictures.',
        metaKeywords: ['image crop', 'crop images', 'image cropping', 'trim images', 'cut images', 'image editor', 'online crop tool', 'ToolsCandy'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    case '/image/convert':
      return {
        metaTitle: 'Free Image Format Converter - Convert Images Online | ToolsCandy',
        metaDescription: 'Convert images between JPG, PNG, GIF, WebP, and other formats. Free online image converter that preserves quality. Works directly in your browser.',
        metaKeywords: ['image converter', 'convert images', 'image format conversion', 'JPG to PNG', 'PNG to WebP', 'image format changer', 'online converter', 'ToolsCandy'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
    
    default:
      // Generic fallback
      return {
        metaTitle: 'ToolsCandy - Free Image Processing Tools',
        metaDescription: 'Free, powerful image processing tools that work right in your browser with complete privacy.',
        metaKeywords: ['ToolsCandy', 'image tools', 'image processing', 'free tools'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        canonicalUrl: '',
        ogImage: ''
      }
  }
}

// Generate Next.js metadata from SEO data
export function generateMetadataFromSeo(seoData: SeoData): Metadata {
  return {
    title: seoData.metaTitle,
    description: seoData.metaDescription,
    keywords: seoData.metaKeywords.join(', '),
    openGraph: {
      title: seoData.metaTitle,
      description: seoData.metaDescription,
      type: seoData.ogType as 'website',
      images: seoData.ogImage ? [{ url: seoData.ogImage }] : [],
      url: seoData.canonicalUrl || undefined,
    },
    twitter: {
      card: seoData.twitterCard as 'summary_large_image',
      title: seoData.metaTitle,
      description: seoData.metaDescription,
      images: seoData.ogImage ? [seoData.ogImage] : [],
    },
    alternates: {
      canonical: seoData.canonicalUrl || undefined,
    },
  }
} 