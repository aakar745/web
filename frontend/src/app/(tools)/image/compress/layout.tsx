import { Metadata } from 'next'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'

// Force dynamic rendering to ensure SEO data is fetched at runtime
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/image/compress')
  return generateMetadataFromSeo(seoData)
}

export default function CompressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 