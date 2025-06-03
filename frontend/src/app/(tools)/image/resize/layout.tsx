import { Metadata } from 'next'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/image/resize')
  return generateMetadataFromSeo(seoData)
}

export default function ResizeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 