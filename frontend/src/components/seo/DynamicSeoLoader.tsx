'use client'

import { useEffect } from 'react'
import { fetchDynamicSeoData, updatePageSeo } from '@/lib/seoUtils'

interface DynamicSeoLoaderProps {
  pagePath: string
}

export function DynamicSeoLoader({ pagePath }: DynamicSeoLoaderProps) {
  useEffect(() => {
    // Only run on client-side after hydration
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