import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import HomeContent from './(home)/page'
import { fetchSeoData, generateMetadataFromSeo } from '@/lib/seoUtils'
import { DynamicSeoLoader } from '@/components/seo/DynamicSeoLoader'

// Enable ISR - regenerate page every hour with fresh SEO data
export const revalidate = 3600 // 1 hour

// Generate metadata server-side for SEO
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSeoData('/')
  return generateMetadataFromSeo(seoData)
}

export default function Home() {
  return (
    <MainLayout>
      <DynamicSeoLoader pagePath="/" />
      <HomeContent />
    </MainLayout>
  )
} 