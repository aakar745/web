import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import HomeContent from './(home)/page'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'

// Force dynamic rendering to ensure SEO data is fetched at runtime
export const dynamic = 'force-dynamic'

// Generate metadata server-side for SEO
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/')
  return generateMetadataFromSeo(seoData)
}

export default function Home() {
  return (
    <MainLayout>
      <HomeContent />
    </MainLayout>
  )
} 