import { Metadata } from 'next'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'

// Force dynamic rendering to ensure SEO data is fetched at runtime
export const dynamic = 'force-dynamic'

// Generate metadata server-side for SEO
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/about')
  return generateMetadataFromSeo(seoData)
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 