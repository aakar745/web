import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { getProxiedImageUrl } from '@/lib/imageProxy'

interface SeoData {
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType: string
  twitterCard: string
}

export function useSeo(pagePath: string) {
  const [seoData, setSeoData] = useState<SeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch SEO data for the page
  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Encode the page path for URL safety
        const encodedPath = encodeURIComponent(pagePath)
        const response = await apiRequest<{ status: string; data: SeoData }>(`/seo/page/${encodedPath}`)
        
        if (response.data) {
          setSeoData(response.data)
        }
      } catch (err) {
        console.error('Error fetching SEO data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch SEO data')
        setSeoData(null)
      } finally {
        setLoading(false)
      }
    }

    if (pagePath) {
      fetchSeoData()
    }
  }, [pagePath])

  // Apply SEO data to the document head when data changes
  useEffect(() => {
    if (seoData && typeof window !== 'undefined') {
      // Update document title
      document.title = seoData.metaTitle

      // Helper function to update or create meta tags
      const updateMetaTag = (property: string, content: string, attributeName = 'name') => {
        if (!content) return
        
        let selector = attributeName === 'property' 
          ? `meta[property="${property}"]`
          : `meta[name="${property}"]`
        
        let metaTag = document.head.querySelector(selector)
        
        if (metaTag) {
          metaTag.setAttribute('content', content)
        } else {
          metaTag = document.createElement('meta')
          metaTag.setAttribute(attributeName, property)
          metaTag.setAttribute('content', content)
          document.head.appendChild(metaTag)
        }
      }

      // Update basic meta tags
      updateMetaTag('description', seoData.metaDescription)
      updateMetaTag('keywords', seoData.metaKeywords.join(', '))

      // Update canonical URL
      if (seoData.canonicalUrl) {
        let linkTag = document.head.querySelector('link[rel="canonical"]')
        if (linkTag) {
          linkTag.setAttribute('href', seoData.canonicalUrl)
        } else {
          linkTag = document.createElement('link')
          linkTag.setAttribute('rel', 'canonical')
          linkTag.setAttribute('href', seoData.canonicalUrl)
          document.head.appendChild(linkTag)
        }
      }

      // Update Open Graph tags with proxied image URL
      updateMetaTag('og:title', seoData.metaTitle, 'property')
      updateMetaTag('og:description', seoData.metaDescription, 'property')
      updateMetaTag('og:type', seoData.ogType, 'property')
      
      // Convert backend image URL to proxied URL for public meta tags
      if (seoData.ogImage) {
        const proxiedImageUrl = getProxiedImageUrl(seoData.ogImage)
        if (proxiedImageUrl) {
          updateMetaTag('og:image', proxiedImageUrl, 'property')
          console.log(`[SEO] Using proxied og:image: ${proxiedImageUrl}`)
        }
      }

      // Update Twitter Card tags with proxied image URL
      updateMetaTag('twitter:card', seoData.twitterCard || 'summary_large_image')
      updateMetaTag('twitter:title', seoData.metaTitle)
      updateMetaTag('twitter:description', seoData.metaDescription)
      
      // Convert backend image URL to proxied URL for Twitter meta tags
      if (seoData.ogImage) {
        const proxiedImageUrl = getProxiedImageUrl(seoData.ogImage)
        if (proxiedImageUrl) {
          updateMetaTag('twitter:image', proxiedImageUrl)
          console.log(`[SEO] Using proxied twitter:image: ${proxiedImageUrl}`)
        }
      }
    }
  }, [seoData])

  return {
    seoData,
    loading,
    error
  }
} 