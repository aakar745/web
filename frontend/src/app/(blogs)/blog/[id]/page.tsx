import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProxiedImageUrl } from '@/lib/imageProxy'
import { BlogPostClient } from './BlogPostClient'

// Server-side blog data fetching
async function getBlogPost(id: string) {
  // Use the same API URL logic as the client-side apiClient
  const getServerApiUrl = () => {
    // In production, use the environment variable or fallback to production URL
    if (process.env.NODE_ENV === 'production') {
      return process.env.NEXT_PUBLIC_API_URL || 'https://toolscandy.com/api'
    }
    
    // In development, try multiple local URLs
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  }
  
  const urlsToTry: string[] = []
  
  // In production, use the configured API URL
  if (process.env.NODE_ENV === 'production') {
    urlsToTry.push(getServerApiUrl())
  } else {
    // In development, try multiple URLs in order
    const primaryUrl = getServerApiUrl()
    urlsToTry.push(primaryUrl)
    
    // Add fallback development URLs if not already included
    const fallbackUrls = [
      'http://localhost:5000/api',
      'http://backend:5000/api', 
      'http://127.0.0.1:5000/api'
    ]
    
    fallbackUrls.forEach(url => {
      if (!urlsToTry.includes(url)) {
        urlsToTry.push(url)
      }
    })
  }
  
  for (const baseUrl of urlsToTry) {
    try {
      // First try to fetch by slug (if it doesn't look like a MongoDB ID)
      const isSlug = !id.match(/^[0-9a-fA-F]{24}$/)
      
      if (isSlug) {
        try {
          const slugResponse = await fetch(`${baseUrl}/blogs/by-slug/${encodeURIComponent(id)}`, {
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // Increased timeout for production
          })
          
          if (slugResponse.ok) {
            const slugData = await slugResponse.json()
            return slugData.status === 'success' ? slugData.data : null
          }
        } catch (slugError) {
          // Continue to try by ID if slug fails
        }
      }
      
      // If not found by slug or it's a MongoDB ID, try to fetch by ID
      const response = await fetch(`${baseUrl}/blogs/${id}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // Increased timeout for production
      })

      if (response.ok) {
        const data = await response.json()
        return data.status === 'success' ? data.data : null
      }
      
    } catch (error) {
      // Log error in development, continue trying other URLs
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to fetch from ${baseUrl}:`, error)
      }
      continue // Try next URL
    }
  }
  
  return null
}

// Generate dynamic metadata for SEO (this appears in View Page Source)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await getBlogPost(id)
  
  if (!post) {
    return {
      title: 'Post Not Found | Web Tools Blog',
      description: 'The blog post you are looking for could not be found.',
    }
  }

  // Use proxied image URLs for public meta tags
  const ogImageUrl = post.ogImage 
    ? getProxiedImageUrl(post.ogImage) 
    : post.featuredImage 
      ? getProxiedImageUrl(post.featuredImage)
      : null

  const canonicalUrl = post.canonicalUrl || (post.slug ? `https://toolscandy.com/blog/${post.slug}` : undefined)

  return {
    title: post.metaTitle || `${post.title} | Web Tools Blog`,
    description: post.metaDescription || post.excerpt,
    keywords: post.metaKeywords ? post.metaKeywords.join(', ') : post.tags.join(', '),
    authors: [{ name: typeof post.author === 'string' ? post.author : post.author?.name || 'Web Tools Team' }],
    category: post.category,
    
    // Open Graph tags
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      url: canonicalUrl,
      images: ogImageUrl ? [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: post.title,
      }] : [],
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: [typeof post.author === 'string' ? post.author : post.author?.name || 'Web Tools Team'],
      section: post.category,
      tags: post.tags,
    },
    
    // Twitter Card tags
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
    
    // Additional meta tags
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Article-specific meta
    other: {
      'article:published_time': post.date,
      'article:modified_time': post.updatedAt,
      'article:author': typeof post.author === 'string' ? post.author : post.author?.name || 'Web Tools Team',
      'article:section': post.category,
      'article:tag': post.tags.join(', '),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getBlogPost(id)

  if (!post) {
    notFound()
  }

  return (
    <>
      {/* Client component handles all UI - server component just provides SEO */}
      <BlogPostClient post={post} />
    </>
  )
} 