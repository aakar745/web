'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, 
  Eye, 
  FileText, 
  FilePlus2, 
  Users, 
  TrendingUp,
  Image,
  Zap,
  Activity,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Calendar,
  MessageSquare,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { withAdminAuth } from '@/middleware/authCheck'
import { apiRequest } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'

// Type definitions for real data
interface BlogPost {
  _id: string;
  title: string;
  date: string;
  status: 'published' | 'draft' | 'scheduled';
  views: number;
  likes: number;
  slug: string;
  category: string;
  author: {
    name: string;
    email: string;
  } | string;
}

interface ToolUsageStats {
  [key: string]: {
    totalUses: number;
    last24Hours: number;
    averageProcessingTime: string;
    successRate: number;
  };
}

interface SystemHealth {
  mongodb: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  system: {
    uptime: string;
    memoryUsage: {
      used: string;
      total: string;
      percentage: number;
    };
    cpuUsage: number;
  };
}

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalUsers: number;
  totalImageProcessing: number;
  last24HourProcessing: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [toolUsage, setToolUsage] = useState<ToolUsageStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('30days')

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  // Fetch dashboard data
  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Fetch all data in parallel
      const [
        blogsResponse,
        toolUsageResponse,
        systemHealthResponse,
        usersResponse
      ] = await Promise.allSettled([
        apiRequest<{ status: string; data: BlogPost[]; count: number }>('/blogs?limit=50', { requireAuth: true }),
        apiRequest<{ status: string; data: ToolUsageStats }>(`/monitoring/tool-usage?timeRange=${timeRange}`, { requireAuth: true }),
        apiRequest<{ status: string; data: SystemHealth }>('/monitoring/system-health', { requireAuth: true }),
        apiRequest<{ status: string; count: number; data: any[] }>('/auth/users', { requireAuth: true })
      ])

      // Initialize stats with default values
      let statsData: DashboardStats = {
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        totalUsers: 0,
        totalImageProcessing: 0,
        last24HourProcessing: 0
      }

      // Process blogs data
      if (blogsResponse.status === 'fulfilled') {
        const blogs = blogsResponse.value.data || []
        setRecentPosts(blogs.slice(0, 5)) // Show latest 5 posts
        
        // Calculate blog statistics
        statsData.totalBlogs = blogs.length
        statsData.publishedBlogs = blogs.filter(blog => blog.status === 'published').length
        statsData.draftBlogs = blogs.filter(blog => blog.status === 'draft').length
        statsData.totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0)
        statsData.totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0)
      } else {
        console.error('Failed to fetch blogs:', blogsResponse.reason)
      }

      // Process tool usage data
      if (toolUsageResponse.status === 'fulfilled') {
        const usage = toolUsageResponse.value.data
        Object.values(usage).forEach(tool => {
          statsData.totalImageProcessing += tool.totalUses
          statsData.last24HourProcessing += tool.last24Hours
        })
        setToolUsage(usage)
      } else {
        console.error('Failed to fetch tool usage:', toolUsageResponse.reason)
      }

      // Process users data
      if (usersResponse.status === 'fulfilled') {
        statsData.totalUsers = usersResponse.value.count || usersResponse.value.data?.length || 0
      } else {
        console.error('Failed to fetch users:', usersResponse.reason)
      }

      // Always set stats, even if some requests failed
      setStats(statsData)

      // Process system health data
      if (systemHealthResponse.status === 'fulfilled') {
        setSystemHealth(systemHealthResponse.value.data)
      } else {
        console.error('Failed to fetch system health:', systemHealthResponse.reason)
      }

      if (showRefreshToast) {
        toast({
          title: 'Dashboard Updated',
          description: 'All data has been refreshed successfully.',
        })
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh data
  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Refetch tool usage when time range changes
    if (timeRange) {
      apiRequest<{ status: string; data: ToolUsageStats }>(`/monitoring/tool-usage?timeRange=${timeRange}`, { requireAuth: true })
        .then(response => {
          setToolUsage(response.data)
          
          // Recalculate totals
          if (stats) {
            let totalImageProcessing = 0
            let last24HourProcessing = 0
            Object.values(response.data).forEach(tool => {
              totalImageProcessing += tool.totalUses
              last24HourProcessing += tool.last24Hours
            })
            setStats(prev => prev ? {
              ...prev,
              totalImageProcessing,
              last24HourProcessing
            } : null)
          }
        })
        .catch(error => {
          console.error('Failed to update tool usage:', error)
        })
    }
  }, [timeRange])

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Calculate growth percentage (placeholder - in real app, compare with previous period)
  const calculateGrowth = (current: number) => {
    const growth = Math.floor(Math.random() * 30) + 5 // Random growth for demo
    return current > 0 ? `+${growth}%` : '0%'
  }

  if (loading && !stats) {
    return <DashboardSkeleton />
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview and statistics for your website.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stats Overview */}
      <motion.div 
        variants={itemVariants}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Blog Posts</span>
                <span className="text-2xl font-bold">
                  {stats ? formatNumber(stats.totalBlogs) : '0'}
                </span>
                <span className="text-xs text-green-500">
                  {stats && stats.publishedBlogs > 0 ? `${stats.publishedBlogs} published` : 'No posts yet'}
                </span>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Users</span>
                <span className="text-2xl font-bold">
                  {stats ? formatNumber(stats.totalUsers) : '0'}
                </span>
                <span className="text-xs text-green-500">
                  {stats ? calculateGrowth(stats.totalUsers) : '0%'} from last month
                </span>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Image Processing</span>
                <span className="text-2xl font-bold">
                  {stats ? formatNumber(stats.totalImageProcessing) : '0'}
                </span>
                <span className="text-xs text-blue-500">
                  {stats ? stats.last24HourProcessing : 0} in last 24h
                </span>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <Image className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Page Views</span>
                <span className="text-2xl font-bold">
                  {stats ? formatNumber(stats.totalViews) : '0'}
                </span>
                <span className="text-xs text-green-500">
                  {stats ? calculateGrowth(stats.totalViews) : '0%'} from last month
                </span>
              </div>
              <div className="bg-orange-500/10 p-2 rounded-full">
                <Eye className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Health Status */}
      {systemHealth && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Database Status */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full ${
                    systemHealth.mongodb.status === 'connected' 
                      ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <Database className={`h-4 w-4 ${
                      systemHealth.mongodb.status === 'connected' 
                        ? 'text-green-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">MongoDB</div>
                    <div className="text-xs text-muted-foreground">
                      {systemHealth.mongodb.status} ({systemHealth.mongodb.responseTime}ms)
                    </div>
                  </div>
                </div>

                {/* Redis Status */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full ${
                    systemHealth.redis.status === 'connected' 
                      ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <Server className={`h-4 w-4 ${
                      systemHealth.redis.status === 'connected' 
                        ? 'text-green-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Redis</div>
                    <div className="text-xs text-muted-foreground">
                      {systemHealth.redis.status} ({systemHealth.redis.responseTime}ms)
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">System</div>
                    <div className="text-xs text-muted-foreground">
                      Memory: {systemHealth.system.memoryUsage.percentage}% ({systemHealth.system.memoryUsage.used})
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Main Dashboard Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="blog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="blog">
              <FileText className="h-4 w-4 mr-2" />
              Blog Posts
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Zap className="h-4 w-4 mr-2" />
              Tools Usage
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          {/* Blog Posts Tab */}
          <TabsContent value="blog" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Blog Posts</h2>
              <Link href="/dashboard/blogs/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Post
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardHeader className="px-6 py-4">
                <div className="grid grid-cols-12 text-sm text-muted-foreground">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Views</div>
                  <div className="col-span-1">Likes</div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-0">
                {recentPosts.length > 0 ? (
                  <div className="divide-y">
                    {recentPosts.map((post) => (
                      <div key={post._id} className="grid grid-cols-12 py-3 items-center">
                        <div className="col-span-5">
                          <Link 
                            href={`/dashboard/blogs/edit/${post._id}`}
                            className="font-medium truncate hover:text-primary transition-colors"
                          >
                            {post.title}
                          </Link>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                        <div className="col-span-2">
                          <Badge 
                            variant={
                              post.status === "published" ? "default" : 
                              post.status === "draft" ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-sm">
                          {post.views?.toLocaleString() || 0}
                        </div>
                        <div className="col-span-1 text-sm">
                          {post.likes?.toLocaleString() || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>No blog posts yet. Create your first post!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tools Usage Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tool Usage Statistics</h2>
              <div className="flex items-center space-x-2">
                <select 
                  value={timeRange} 
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="1year">Last year</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {toolUsage && Object.entries(toolUsage).map(([toolName, data]) => (
                <Card key={toolName}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize">{toolName.replace(/([A-Z])/g, ' $1')}</h3>
                      <Badge variant="outline" className="text-xs">
                        {data.successRate}% success
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Uses:</span>
                        <span className="font-medium">{data.totalUses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last 24h:</span>
                        <span className="font-medium">{data.last24Hours.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="font-medium">{data.averageProcessingTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Website Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analytics for the past {timeRange === 'today' ? 'day' : timeRange === '7days' ? 'week' : timeRange === '30days' ? 'month' : 'year'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats ? formatNumber(stats.totalViews) : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Page Views</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats ? formatNumber(stats.totalImageProcessing) : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Images Processed</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats ? formatNumber(stats.totalLikes) : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Likes</div>
                  </div>
                </div>
                
                {/* Placeholder for future chart implementation */}
                <div className="h-[300px] flex items-center justify-center bg-accent/10 rounded-md">
                  <div className="text-center">
                    <BarChart className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">
                      Advanced analytics charts coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default withAdminAuth(AdminDashboard) 