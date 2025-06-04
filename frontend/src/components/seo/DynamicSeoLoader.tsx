'use client'

import { useEffect } from 'react'
import { fetchDynamicSeoData, updatePageSeo } from '@/lib/seoUtils'

interface DynamicSeoLoaderProps {
  pagePath: string
}

export function DynamicSeoLoader({ pagePath }: DynamicSeoLoaderProps) {
  useEffect(() => {
    // Check if server-rendered meta tags already exist
    // If they do, skip entirely to prevent head→body movement
    const hasServerRenderedMeta = document.querySelector('meta[name="description"]')?.getAttribute('content') && 
                                  document.title && 
                                  document.querySelector('meta[property="og:title"]')?.getAttribute('content')
    
    if (hasServerRenderedMeta) {
      console.log(`🔄 Server-rendered SEO detected for ${pagePath}, skipping DynamicSeoLoader entirely`)
      return
    }

    // Only run on client-side after hydration for pages without server-rendered SEO
    const loadDynamicSeo = async () => {
      try {
        console.log(`🔄 Loading dynamic SEO for: ${pagePath}`)
        
        const seoData = await fetchDynamicSeoData(pagePath)
        
        if (seoData) {
          updatePageSeo(seoData)
          console.log(`✅ Dynamic SEO applied for: ${pagePath}`)
        } else {
          console.log(`ℹ️ No dynamic SEO data found for: ${pagePath}, keeping fallback`)
        }
      } catch (error) {
        console.error('❌ Error loading dynamic SEO:', error)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadDynamicSeo, 100)
    
    return () => clearTimeout(timer)
  }, [pagePath])

  // This component renders nothing visible
  return null
} 