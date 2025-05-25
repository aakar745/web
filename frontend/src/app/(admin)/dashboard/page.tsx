'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Eye, 
  FileText, 
  FilePlus2, 
  Users, 
  TrendingUp,
  Image,
  Zap
} from 'lucide-react'
import { withAdminAuth } from '@/middleware/authCheck'

function AdminDashboard() {
  // Mock data for the dashboard
  const stats = [
    {
      title: "Total Blog Posts",
      value: "24",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      change: "+12% from last month",
      trend: "up"
    },
    {
      title: "Total Users",
      value: "842",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      change: "+5.3% from last month",
      trend: "up"
    },
    {
      title: "Image Processings",
      value: "4,721",
      icon: <Image className="h-5 w-5 text-muted-foreground" />,
      change: "+24% from last month",
      trend: "up"
    },
    {
      title: "Page Views",
      value: "25.3K",
      icon: <Eye className="h-5 w-5 text-muted-foreground" />,
      change: "+18% from last month",
      trend: "up"
    }
  ]
  
  const recentPosts = [
    {
      id: 1,
      title: "How to Optimize Your Web Images for Speed",
      date: "May 15, 2023",
      status: "published",
      views: 1452
    },
    {
      id: 2,
      title: "10 Essential Image Optimization Tips for Web Developers",
      date: "May 12, 2023",
      status: "published",
      views: 892
    },
    {
      id: 3,
      title: "The Ultimate Guide to SVG: Why, When, and How",
      date: "May 8, 2023",
      status: "draft",
      views: 0
    },
    {
      id: 4,
      title: "Web Performance: How Image Optimization Makes a Difference",
      date: "May 5, 2023",
      status: "published",
      views: 2341
    },
    {
      id: 5,
      title: "JPEG vs PNG vs WebP: Which Format to Use and When",
      date: "May 1, 2023",
      status: "published",
      views: 1876
    }
  ]
  
  const popularTools = [
    {
      id: 1,
      name: "Image Compression",
      usageCount: 2341,
      trend: "+15%"
    },
    {
      id: 2,
      name: "Image Resize",
      usageCount: 1876,
      trend: "+8%"
    },
    {
      id: 3,
      name: "Image Converter",
      usageCount: 1542,
      trend: "+23%"
    },
    {
      id: 4,
      name: "Image Cropper",
      usageCount: 982,
      trend: "+5%"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview and statistics for your website.
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm">{stat.title}</span>
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-xs ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Dashboard Tabs */}
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
            <button className="flex items-center text-sm text-primary hover:underline">
              <FilePlus2 className="h-4 w-4 mr-1" />
              New Post
            </button>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="grid grid-cols-12 text-sm text-muted-foreground">
                <div className="col-span-6">Title</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Views</div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-0">
              <div className="divide-y">
                {recentPosts.map((post) => (
                  <div key={post.id} className="grid grid-cols-12 py-3 items-center">
                    <div className="col-span-6 font-medium truncate">{post.title}</div>
                    <div className="col-span-2 text-sm text-muted-foreground">{post.date}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === "published" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm">
                      {post.views > 0 ? post.views.toLocaleString() : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tools Usage Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Popular Tools</h2>
            <button className="flex items-center text-sm text-primary hover:underline">
              <TrendingUp className="h-4 w-4 mr-1" />
              View Details
            </button>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="grid grid-cols-12 text-sm text-muted-foreground">
                <div className="col-span-6">Tool</div>
                <div className="col-span-3">Usage</div>
                <div className="col-span-3 text-right">Trend</div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-0">
              <div className="divide-y">
                {popularTools.map((tool) => (
                  <div key={tool.id} className="grid grid-cols-12 py-3 items-center">
                    <div className="col-span-6 font-medium">{tool.name}</div>
                    <div className="col-span-3">{tool.usageCount.toLocaleString()}</div>
                    <div className="col-span-3 text-right text-green-500 font-medium">
                      {tool.trend}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>
                Website traffic analytics for the past 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart */}
              <div className="h-[300px] flex items-center justify-center bg-accent/10 rounded-md">
                <div className="text-center">
                  <BarChart className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    Chart visualization would go here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default withAdminAuth(AdminDashboard); 