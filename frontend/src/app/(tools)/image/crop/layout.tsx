import { Metadata } from 'next'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/image/crop')
  return generateMetadataFromSeo(seoData)
}

export default function CropLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 