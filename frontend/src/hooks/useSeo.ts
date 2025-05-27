import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'

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
      } catch (error: any) {
        console.error('Error fetching SEO data:', error)
        setError('Failed to load SEO data')
      } finally {
        setLoading(false)
      }
    }

    if (pagePath) {
      fetchSeoData()
    }
  }, [pagePath])

  // Apply SEO data to the document head
  useEffect(() => {
    if (seoData && typeof window !== 'undefined') {
      // Update title
      if (seoData.metaTitle) {
        document.title = seoData.metaTitle
      }

      // Helper function to update or create meta tags
      const updateMetaTag = (name: string, content: string, property?: string) => {
        if (!content) return

        const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`
        let element = document.querySelector(selector) as HTMLMetaElement
        
        if (element) {
          element.content = content
        } else {
          element = document.createElement('meta')
          if (property) {
            element.setAttribute('property', property)
          } else {
            element.setAttribute('name', name)
          }
          element.content = content
          document.head.appendChild(element)
        }
      }

      // Update meta description
      updateMetaTag('description', seoData.metaDescription)

      // Update keywords
      if (seoData.metaKeywords && seoData.metaKeywords.length > 0) {
        updateMetaTag('keywords', seoData.metaKeywords.join(', '))
      }

      // Update canonical URL
      if (seoData.canonicalUrl) {
        let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
        if (canonicalElement) {
          canonicalElement.href = seoData.canonicalUrl
        } else {
          canonicalElement = document.createElement('link')
          canonicalElement.rel = 'canonical'
          canonicalElement.href = seoData.canonicalUrl
          document.head.appendChild(canonicalElement)
        }
      }

      // Update Open Graph tags
      updateMetaTag('', seoData.metaTitle, 'og:title')
      updateMetaTag('', seoData.metaDescription, 'og:description')
      updateMetaTag('', seoData.ogType || 'website', 'og:type')
      
      if (seoData.ogImage) {
        updateMetaTag('', seoData.ogImage, 'og:image')
      }

      // Update Twitter Card tags
      updateMetaTag('twitter:card', seoData.twitterCard || 'summary_large_image')
      updateMetaTag('twitter:title', seoData.metaTitle)
      updateMetaTag('twitter:description', seoData.metaDescription)
      
      if (seoData.ogImage) {
        updateMetaTag('twitter:image', seoData.ogImage)
      }
    }
  }, [seoData])

  return {
    seoData,
    loading,
    error
  }
} 