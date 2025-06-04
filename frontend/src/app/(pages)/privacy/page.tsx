import React from 'react'
import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import PrivacyPageClient from './PrivacyPageClient'

// Generate metadata server-side for Privacy page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/privacy')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/privacy')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function PrivacyPage() {
  return <PrivacyPageClient />
} 