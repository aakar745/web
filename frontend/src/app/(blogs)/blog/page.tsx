import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import BlogPageClient from './BlogPageClient'

// Generate metadata server-side for blog listing page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/blog')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/blog')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function BlogPage() {
  return <BlogPageClient />
} 