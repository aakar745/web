'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getProxiedImageUrl } from '@/lib/imageProxy'
import { 
  ArrowRight, 
  Image, 
  Crop, 
  RefreshCw, 
  ZoomIn, 
  Shield, 
  Zap, 
  Clock, 
  Award,
  CreditCard,
  CalendarIcon,
  Check,
  MoveRight,
  FileText,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiRequest } from '@/lib/apiClient'

// Define blog post interface
interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  status: string;
  author: { name: string; email: string } | string | null;
  category: string;
  tags: string[];
  featuredImage?: string;
  views: number;
  readingTime?: string;
  slug: string;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function HomeContent() {
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch latest blog posts
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true)
        const response = await apiRequest<{
          status: string;
          data: BlogPost[];
        }>('/blogs?limit=3', { noRedirect: true })
        
        if (response.data) {
          setLatestPosts(response.data)
        }
      } catch (error) {
        console.error('Error fetching latest posts:', error)
        // Fallback data if API fails
        setLatestPosts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLatestPosts()
  }, [])
  
  // Format author name function
  const getAuthorName = (author: { name: string; email: string } | string | null): string => {
    if (!author || typeof author === 'string') {
      return 'Anonymous'
    }
    return author.name || 'Anonymous'
  }
  
  // Format author initials
  const getAuthorInitials = (author: { name: string; email: string } | string | null): string => {
    if (!author || typeof author === 'string') {
      return 'A'
    }
    if (!author.name) {
      return 'A'
    }
    return author.name.split(' ').map(n => n[0]).join('')
  }

  // Helper function to get proxied featured image URL
  const getProxiedFeaturedImage = (imageUrl: string): string => {
    if (!imageUrl) return imageUrl
    return getProxiedImageUrl(imageUrl) || imageUrl
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 mb-12 sm:mb-16 md:mb-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-[30%] -left-[20%] sm:-left-[10%] w-[60%] sm:w-[50%] h-[50%] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/30 blur-3xl"></div>
          <div className="absolute top-[20%] -right-[20%] sm:-right-[10%] w-[50%] sm:w-[40%] h-[40%] rounded-full bg-gradient-to-l from-blue-500/20 to-cyan-500/30 blur-3xl"></div>
          <div className="absolute -bottom-[10%] left-[10%] sm:left-[20%] w-[70%] sm:w-[60%] h-[30%] rounded-full bg-gradient-to-tr from-green-500/20 to-teal-500/30 blur-3xl"></div>
        </div>
        
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs sm:text-sm">
              Simple • Fast • Powerful
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                ToolsCandy
              </span> for Everyone
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0">
              Fast, free, and easy-to-use online tools for all your image editing needs.
              No login required. Process files directly in your browser.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link href="/image/compress">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 h-12 sm:h-14 text-sm sm:text-base">
                  Get Started <MoveRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 border-2 h-12 sm:h-14 text-sm sm:text-base">
                  Browse Tutorials
                </Button>
              </Link>
            </div>
            
            {/* Featured brands/stats */}
            <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm font-medium px-4 sm:px-0">TRUSTED BY THOUSANDS OF USERS WORLDWIDE</p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 items-center px-4 sm:px-0">
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded-full">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="ml-2 font-semibold text-xs sm:text-sm">100% Free</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-full">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="ml-2 font-semibold text-xs sm:text-sm">Privacy First</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-full">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="ml-2 font-semibold text-xs sm:text-sm">High Quality</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-2 rounded-full">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="ml-2 font-semibold text-xs sm:text-sm">Lightning Fast</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Tools Section with color cards */}
      <section className="w-full mb-20 sm:mb-24 md:mb-32">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Powerful Image Tools</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Everything you need to optimize and transform your images in one place
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto"
          >
            <Link href="/image/compress" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Image size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Image Compression
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Compress JPG, PNG, SVG, and GIFs while maintaining quality. Save bandwidth and storage space.
                  </p>
                  <div className="flex items-center font-medium text-xs sm:text-sm text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/image/resize" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ZoomIn size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Image Resize
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Resize your images by dimensions or percentage. Perfect for social media, websites, and print.
                  </p>
                  <div className="flex items-center font-medium text-xs sm:text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/image/crop" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-green-500/10 via-green-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:border-green-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                    <Crop size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Image Cropping
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Crop images with precision to exact dimensions or aspect ratios. Focus on what matters.
                  </p>
                  <div className="flex items-center font-medium text-xs sm:text-sm text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/image/convert" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Format Conversion
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Convert between PNG, JPG, WEBP, and more. Choose the best format for your needs.
                  </p>
                  <div className="flex items-center font-medium text-xs sm:text-sm text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* How it works section */}
      <section className="w-full py-20 sm:py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
            <Badge variant="outline" className="mb-4 px-3 py-1.5 text-xs font-medium bg-primary/5 border-primary/20">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Simple Process, Powerful Results</h2>
            <p className="text-lg text-muted-foreground">
              Our tools work directly in your browser. No account needed, no data harvesting - just powerful functionality without the hassle.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            <div className="bg-background rounded-xl p-6 shadow-sm border border-muted">
              <div className="bg-primary/10 text-primary rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Your Image</h3>
              <p className="text-muted-foreground mb-4">
                Drag & drop your files directly into the browser or use the file picker. Your files never leave your device.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm border border-muted">
              <div className="bg-primary/10 text-primary rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Customize Settings</h3>
              <p className="text-muted-foreground mb-4">
                Adjust the quality, resize dimensions, format options, or other settings specific to your chosen tool.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm border border-muted">
              <div className="bg-primary/10 text-primary rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Download Result</h3>
              <p className="text-muted-foreground mb-4">
                Process your image and download the result directly to your device. Then use it however you need.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Latest Blog Posts */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
            <div>
              <Badge variant="outline" className="mb-4 px-3 py-1.5 text-xs font-medium bg-primary/5 border-primary/20">
                Resources
              </Badge>
              <h2 className="text-3xl font-bold">Latest From the Blog</h2>
            </div>
            <Link href="/blog" className="flex items-center gap-2 text-primary hover:underline">
              View all posts <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Show skeletons while loading
              Array(3).fill(0).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex flex-col bg-card rounded-xl overflow-hidden border shadow-sm">
                  <div className="bg-muted h-48 animate-pulse"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
                    <div className="h-6 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="w-20 h-4" />
                      </div>
                      <Skeleton className="w-16 h-4" />
                    </div>
                  </div>
                </div>
              ))
            ) : latestPosts.length > 0 ? (
              // Show actual posts if available
              latestPosts.map((post) => (
                <Link href={`/blog/${post.slug || post._id}`} key={post._id} className="group">
                  <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="h-48 overflow-hidden bg-muted">
                      {post.featuredImage ? (
                        <img 
                          src={getProxiedFeaturedImage(post.featuredImage)}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300 ease-in-out"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg'
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                          <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div>
                        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5 mb-3 inline-block">
                          {post.category}
                        </span>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getAuthorInitials(post.author)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{getAuthorName(post.author)}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Fallback when no posts are available
              <div className="col-span-3 py-12 text-center">
                <p className="text-muted-foreground">No blog posts available at the moment.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/blog">Check blog section</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
} 