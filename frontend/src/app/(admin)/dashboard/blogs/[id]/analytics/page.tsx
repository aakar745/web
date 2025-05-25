'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { withAdminAuth } from '@/middleware/authCheck'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Eye, Clock, Users, RefreshCw, Calendar } from 'lucide-react'
import Link from 'next/link'
import { apiRequest } from '@/lib/apiClient'

interface Analytics {
  totalViews: number
  uniqueVisitors: number
  averageTimeOnPage: number
  bounceRate: number
  dailyViews: Record<string, number>
  dailyViewsArray: { date: string; views: number }[]
}

function BlogAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const blogId = params.id as string
  
  const [blog, setBlog] = useState<any>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Fetch blog and analytics data
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch blog details
      const blogData = await apiRequest<{ status: string; data: any }>(`/blogs/${blogId}`, {
        requireAuth: true
      })
      
      setBlog(blogData.data)
      
      // Fetch analytics data
      const analyticsData = await apiRequest<{ status: string; data: Analytics }>(`/blogs/${blogId}/analytics`, {
        requireAuth: true
      })
      
      setAnalytics(analyticsData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Refresh analytics data
  const refreshAnalytics = async () => {
    try {
      setRefreshing(true)
      
      const analyticsData = await apiRequest<{ status: string; data: Analytics }>(`/blogs/${blogId}/analytics`, {
        requireAuth: true
      })
      
      setAnalytics(analyticsData.data)
      
      toast({
        title: 'Analytics updated',
        description: 'The latest analytics data has been loaded'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data',
        variant: 'destructive'
      })
    } finally {
      setRefreshing(false)
    }
  }
  
  // Load data on component mount
  useEffect(() => {
    if (blogId) {
      fetchData()
    }
  }, [blogId])
  
  // Format time for display
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`
    }
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }
  
  if (!blog) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The blog post you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/dashboard/blogs">Back to Blog Management</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="mb-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/blogs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog Management
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{blog.title}</h1>
          <p className="text-muted-foreground">
            Analytics for {formatDate(blog.date)} • {blog.status === 'published' ? 'Published' : 'Draft'}
          </p>
        </div>
        
        <Button size="sm" onClick={refreshAnalytics} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analytics
            </>
          )}
        </Button>
      </div>
      
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Views */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {analytics ? analytics.totalViews.toLocaleString() : '0'}
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        {/* Unique Visitors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {analytics ? analytics.uniqueVisitors.toLocaleString() : '0'}
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        {/* Average Time on Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Time on Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {analytics ? formatTime(analytics.averageTimeOnPage) : '0s'}
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        {/* Bounce Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {analytics ? `${analytics.bounceRate}%` : '0%'}
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Views</CardTitle>
        </CardHeader>
        <CardContent>
          {(!analytics || analytics.dailyViewsArray.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Eye className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">No view data available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Views will be tracked when visitors read this blog post</p>
            </div>
          ) : (
            <div className="h-64">
              <div className="flex h-full items-end">
                {analytics.dailyViewsArray.map((day, index) => {
                  // Get max value for scaling
                  const maxViews = Math.max(...analytics.dailyViewsArray.map(d => d.views))
                  // Calculate height percentage (min 5% even if 0 views)
                  const heightPercent = maxViews > 0 
                    ? Math.max(5, (day.views / maxViews) * 100) 
                    : 5
                  
                  // Format date for tooltip
                  const date = new Date(day.date)
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                  
                  return (
                    <div 
                      key={day.date}
                      className="relative flex-1 flex flex-col items-center group"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                        {formattedDate}: {day.views} views
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full max-w-[30px] bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Only show values inside bar for larger numbers */}
                        {heightPercent > 15 && (
                          <div className="text-xs font-medium text-center p-1 text-primary">
                            {day.views}
                          </div>
                        )}
                      </div>
                      
                      {/* Date label (only show for some bars to avoid crowding) */}
                      {(index === 0 || index === analytics.dailyViewsArray.length - 1 || index % 3 === 0) && (
                        <div className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                          {formattedDate}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button asChild variant="outline">
          <Link href={`/dashboard/blogs/edit/${blogId}`}>
            Edit Blog Post
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/blog/${blog.slug}`} target="_blank">
            View Blog Post
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default withAdminAuth(BlogAnalyticsPage); 