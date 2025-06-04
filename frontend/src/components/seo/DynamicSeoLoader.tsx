'use client'

import { useEffect } from 'react'
import { fetchDynamicSeoData, updatePageSeo, getFallbackSeoData } from '@/lib/seoUtils'

interface DynamicSeoLoaderProps {
  pagePath: string
}

export function DynamicSeoLoader({ pagePath }: DynamicSeoLoaderProps) {
  useEffect(() => {
    // Only run on client-side after hydration
    const loadDynamicSeo = async () => {
      try {
        // Check if we already have dynamic SEO data (server-side fetch succeeded)
        const currentTitle = document.title
        const fallbackData = getFallbackSeoData(pagePath)
        
        // If the current title matches the fallback, server-side fetch likely failed
        // and we should try client-side fetch
        if (currentTitle === fallbackData.metaTitle) {
          console.log(`🔄 Server-side SEO appears to have failed for ${pagePath}, trying client-side fetch`)
          
          const seoData = await fetchDynamicSeoData(pagePath)
          
          if (seoData) {
            updatePageSeo(seoData)
            console.log(`✅ Client-side dynamic SEO applied for: ${pagePath}`)
          } else {
            console.log(`ℹ️ No dynamic SEO data available for: ${pagePath}, keeping fallback`)
          }
        } else {
          console.log(`✅ Server-side SEO data already loaded for: ${pagePath}`)
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