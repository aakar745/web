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

// Function to fetch SEO data server-side (safe for builds)
export async function fetchSeoData(pagePath: string): Promise<SeoData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // If API URL is available, try to fetch dynamic SEO data first
  if (apiUrl) {
    try {
      const fullUrl = `${apiUrl}/seo/page/${encodeURIComponent(pagePath)}`
      console.log(`🔄 Fetching server-side SEO data from: ${fullUrl}`)
      
      const response = await fetch(fullUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'NextJS-SSR-SEO-Fetch'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Server-side SEO data loaded for ${pagePath}:`, data.data.metaTitle)
        return data.data
      } else {
        console.log(`❌ Server-side SEO API returned ${response.status} for ${pagePath}, falling back to static data`)
      }
    } catch (error) {
      console.log(`❌ Failed to fetch server-side SEO for ${pagePath}:`, error instanceof Error ? error.message : 'Unknown error', ', falling back to static data')
    }
  }
  
  // Fallback to static SEO data for build-time or when API is unavailable
  console.log(`Using static SEO data for ${pagePath} (fallback)`)
  return getFallbackSeoData(pagePath)
}

// Function to fetch dynamic SEO data at runtime (client-side)
export async function fetchDynamicSeoData(pagePath: string): Promise<SeoData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  
  if (!apiUrl) {
    console.log('No API URL configured for dynamic SEO')
    return null
  }
  
  try {
    const fullUrl = `${apiUrl}/seo/page/${encodeURIComponent(pagePath)}`
    console.log('🔄 Fetching dynamic SEO data from:', fullUrl)
    
    const response = await fetch(fullUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Dynamic SEO data loaded for ${pagePath}:`, data.data.metaTitle)
      return data.data
    } else {
      console.log(`❌ Dynamic SEO API returned ${response.status} for ${pagePath}`)
      return null
    }
  } catch (error) {
    console.log(`❌ Failed to fetch dynamic SEO for ${pagePath}:`, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Function to update page SEO dynamically after page load
export function updatePageSeo(seoData: SeoData) {
  if (typeof window === 'undefined') return // Only run in browser
  
  try {
    // Update document title
    document.title = seoData.metaTitle
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', seoData.metaDescription)
    } else {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      metaDesc.setAttribute('content', seoData.metaDescription)
      document.head.appendChild(metaDesc)
    }
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute('content', seoData.metaKeywords.join(', '))
    } else {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      metaKeywords.setAttribute('content', seoData.metaKeywords.join(', '))
      document.head.appendChild(metaKeywords)
    }
    
    // Update Open Graph tags
    updateMetaProperty('og:title', seoData.metaTitle)
    updateMetaProperty('og:description', seoData.metaDescription)
    updateMetaProperty('og:type', seoData.ogType)
    
    if (seoData.ogImage) {
      updateMetaProperty('og:image', seoData.ogImage)
    }
    
    if (seoData.canonicalUrl) {
      updateMetaProperty('og:url', seoData.canonicalUrl)
      
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]')
      if (canonical) {
        canonical.setAttribute('href', seoData.canonicalUrl)
      } else {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        canonical.setAttribute('href', seoData.canonicalUrl)
        document.head.appendChild(canonical)
      }
    }
    
    // Update Twitter Card tags
    updateMetaProperty('twitter:card', seoData.twitterCard)
    updateMetaProperty('twitter:title', seoData.metaTitle)
    updateMetaProperty('twitter:description', seoData.metaDescription)
    
    if (seoData.ogImage) {
      updateMetaProperty('twitter:image', seoData.ogImage)
    }
    
    console.log('✅ Page SEO updated successfully')
  } catch (error) {
    console.error('❌ Error updating page SEO:', error)
  }
}

// Helper function to update meta property tags
function updateMetaProperty(property: string, content: string) {
  if (typeof window === 'undefined') return
  
  let meta = document.querySelector(`meta[property="${property}"]`)
  if (meta) {
    meta.setAttribute('content', content)
  } else {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}

// Fallback SEO data based on page path
export function getFallbackSeoData(pagePath: string): SeoData {
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