import React from 'react'
import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import AboutPageClient from './AboutPageClient'

// Generate metadata server-side for About page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/about')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/about')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function AboutPage() {
  return <AboutPageClient />
} 