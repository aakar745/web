'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, User, Tag, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { getProxiedImageUrl } from '@/lib/imageProxy'

export default function BlogPreviewPage() {
  const [blog, setBlog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Get preview data from localStorage
    try {
      const previewData = localStorage.getItem('blogPreview')
      
      if (previewData) {
        try {
          const parsedData = JSON.parse(previewData)
          setBlog(parsedData)
        } catch (parseError) {
          console.error('Error parsing preview data:', parseError)
          toast({
            title: 'Preview error',
            description: 'There was an error loading the preview data.',
            variant: 'destructive'
          })
        }
      }
    } catch (storageError) {
      console.error('Error accessing localStorage:', storageError)
      toast({
        title: 'Storage error',
        description: 'Could not access browser storage. Preview may not work correctly.',
        variant: 'destructive'
      })
    }
    
    setLoading(false)
  }, [])
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <p className="text-center">Loading preview...</p>
      </div>
    )
  }
  
  if (!blog) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">No Preview Data</h1>
        <p className="text-muted-foreground mb-8">No blog post preview data found.</p>
        <Button asChild>
          <Link href="/dashboard/blogs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog Management
          </Link>
        </Button>
      </div>
    )
  }
  
  // Function to process blog content and replace backend URLs with proxied ones
  const processContentImages = (htmlContent: string): string => {
    if (!htmlContent) return htmlContent
    
    // Replace backend image URLs in the HTML content with proxied URLs
    return htmlContent.replace(
      /src="([^"]*\/api\/media\/file\/[^"]*)"/g,
      (match, url) => {
        const proxiedUrl = getProxiedImageUrl(url)
        return `src="${proxiedUrl || url}"`
      }
    ).replace(
      /src='([^']*\/api\/media\/file\/[^']*)'/g,
      (match, url) => {
        const proxiedUrl = getProxiedImageUrl(url)
        return `src='${proxiedUrl || url}'`
      }
    )
  }

  // Helper function to get proxied featured image URL
  const getProxiedFeaturedImage = (imageUrl: string): string => {
    if (!imageUrl) return imageUrl
    return getProxiedImageUrl(imageUrl) || imageUrl
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/blogs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Management
            </Link>
          </Button>
          
          <div className="mt-6 text-center">
            <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{blog.excerpt}</p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(blog.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
              
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Preview Author
              </div>
              
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {blog.category}
              </div>
              
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {blog.views || 0} views
              </div>
            </div>
          </div>
        </div>
        
        {blog.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getProxiedFeaturedImage(blog.featuredImage)} 
              alt={blog.title} 
              className="w-full h-auto object-cover aspect-video"
            />
          </div>
        )}
        
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert prose-img:rounded-lg prose-img:mx-auto prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: processContentImages(blog.content) }}
            />
            
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(blog.tags) 
                    ? blog.tags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))
                    : typeof blog.tags === 'string' && blog.tags.split(',').map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">This is a preview of your blog post. It will not be visible to others until published.</p>
        </div>
      </div>
    </div>
  )
} 