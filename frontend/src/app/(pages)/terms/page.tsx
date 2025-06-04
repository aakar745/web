import React from 'react'
import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import TermsPageClient from './TermsPageClient'

// Generate metadata server-side for Terms page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/terms')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/terms')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function TermsPage() {
  return <TermsPageClient />
} 