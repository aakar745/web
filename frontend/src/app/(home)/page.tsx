'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSeo } from '@/hooks/useSeo'
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
  Check,
  MoveRight,
  CalendarIcon,
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

export default function Home() {
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load SEO data for homepage
  const { seoData, loading: seoLoading } = useSeo('/')
  
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

            <Link href="/image/convert" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-teal-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Format Conversion
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Convert between JPG, PNG, GIF, WebP and other formats. Support for transparent backgrounds.
                  </p>
                  <div className="flex items-center font-medium text-xs sm:text-sm text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/image/crop" className="group">
              <motion.div variants={item}>
                <div className="h-full rounded-xl border-2 border-transparent bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/20 hover:-translate-y-1">
                  <div className="mb-4 sm:mb-5 inline-flex p-2.5 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Crop size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Image Crop
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                    Crop your images to exact dimensions or aspect ratios. Perfect for creating thumbnails and focused images.
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
      
      {/* Features Section */}
      <section className="w-full mb-20 sm:mb-24 md:mb-32 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -left-[10%] sm:-left-[5%] w-[55%] sm:w-[45%] h-[80%] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
          <div className="absolute -right-[10%] sm:-right-[5%] w-[55%] sm:w-[45%] h-[80%] bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm">
              WHY CHOOSE TOOLSCANDY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Designed with Your Needs in Mind</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">Built with privacy and simplicity as core principles. Process files directly in your browser.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 hover:shadow-lg transition-all hover:border-blue-500/20"
            >
              <div className="absolute top-0 right-0 h-16 w-16 sm:h-20 sm:w-20 -mt-3 sm:-mt-5 -mr-3 sm:-mr-5 text-blue-500/10">
                <Shield className="w-full h-full" strokeWidth={1} />
              </div>
              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2.5 sm:p-3 rounded-xl mb-4 sm:mb-6 inline-block">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">No Registration Required</h3>
              <p className="text-muted-foreground text-sm sm:text-base">No account needed. Just upload and edit your images instantly, without any hassle or barriers.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 hover:shadow-lg transition-all hover:border-purple-500/20"
            >
              <div className="absolute top-0 right-0 h-16 w-16 sm:h-20 sm:w-20 -mt-3 sm:-mt-5 -mr-3 sm:-mr-5 text-purple-500/10">
                <Shield className="w-full h-full" strokeWidth={1} />
              </div>
              <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-2.5 sm:p-3 rounded-xl mb-4 sm:mb-6 inline-block">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Privacy First Approach</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Your images are processed locally in your browser. We don't store your files or upload them to servers.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 hover:shadow-lg transition-all hover:border-green-500/20 md:col-span-3 lg:col-span-1"
            >
              <div className="absolute top-0 right-0 h-16 w-16 sm:h-20 sm:w-20 -mt-3 sm:-mt-5 -mr-3 sm:-mr-5 text-green-500/10">
                <CreditCard className="w-full h-full" strokeWidth={1} />
              </div>
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-2.5 sm:p-3 rounded-xl mb-4 sm:mb-6 inline-block">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">100% Free to Use</h3>
              <p className="text-muted-foreground text-sm sm:text-base">All tools are completely free with no hidden costs or limitations. No credit card required.</p>
            </motion.div>
          </div>
          
          {/* Stats section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-16 sm:mt-20 md:mt-24 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1 sm:mb-2">100K+</p>
              <p className="text-muted-foreground text-sm sm:text-base">Images Processed</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1 sm:mb-2">50TB+</p>
              <p className="text-muted-foreground text-sm sm:text-base">Storage Saved</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1 sm:mb-2">10K+</p>
              <p className="text-muted-foreground text-sm sm:text-base">Happy Users</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1 sm:mb-2">4+</p>
              <p className="text-muted-foreground text-sm sm:text-base">Powerful Tools</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Latest News Section */}
      <section className="w-full mb-20 sm:mb-24 md:mb-32">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm">
              LATEST FROM OUR BLOG
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Stay Updated</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">Discover tips, tutorials, and news about image optimization</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {loading ? (
              // Loading skeletons
              Array(3).fill(null).map((_, index) => (
                <div key={`skeleton-${index}`} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group">
                  <Skeleton className="h-40 sm:h-48 w-full" />
                  <div className="p-4 sm:p-6 space-y-3">
                    <Skeleton className="h-4 sm:h-5 w-2/3" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-3/4" />
                    <div className="flex items-center pt-3">
                      <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                      <div className="ml-3 space-y-1">
                        <Skeleton className="h-3 w-20 sm:w-24" />
                        <Skeleton className="h-3 w-12 sm:w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : latestPosts.length > 0 ? (
              // Actual blog posts
              latestPosts.map((post) => (
                <motion.div 
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (latestPosts.indexOf(post) * 0.1) }}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-all hover:border-blue-500/20"
                >
                  <Link href={`/blog/${post.slug || post._id}`} className="block">
                    <div className="h-40 sm:h-48 overflow-hidden bg-muted/50">
                      {post.featuredImage ? (
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                          <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center mb-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary text-xs">
                          {post.category}
                        </Badge>
                        <div className="ml-auto flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readingTime || '5 min read'}
                        </div>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-2">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getAuthorInitials(post.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            <p className="font-medium">{getAuthorName(post.author)}</p>
                            <p className="text-muted-foreground">
                              {new Date(post.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-6 w-6 sm:h-8 sm:w-8 text-primary">
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              // Empty state
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No articles yet</h3>
                <p className="text-muted-foreground text-sm sm:text-base">Check back soon for new content</p>
              </div>
            )}
          </div>
          
          {latestPosts.length > 0 && (
            <div className="text-center mt-8 sm:mt-12">
              <Link href="/blog">
                <Button variant="outline" size="lg" className="rounded-full px-6 sm:px-8 border-2 group">
                  View All Articles
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Call to action */}
      <section className="w-full mb-12 sm:mb-16 md:mb-20">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-8 sm:p-12 md:p-16 text-center text-white shadow-xl shadow-blue-600/20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Start Optimizing Your Images Today</h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Join thousands of users who trust our tools for their image optimization needs.
              No sign up required - start for free right now!
            </p>
            
            <Link href="/image/compress">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 bg-white text-blue-600 hover:bg-white/90 shadow-lg shadow-blue-700/20 flex items-center justify-center gap-2 h-12 sm:h-14 text-sm sm:text-base">
                Get Started <MoveRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 