import React from 'react'
import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import ContactPageClient from './ContactPageClient'

// Generate metadata server-side for Contact page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/contact')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/contact')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function ContactPage() {
  return <ContactPageClient />
} 