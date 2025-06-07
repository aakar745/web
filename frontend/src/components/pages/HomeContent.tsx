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
  ArrowUpRight,
  Star,
  Users,
  Download,
  Globe,
  Sparkles,
  Info
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

const sparkleVariants = {
  animate: {
    scale: [0, 1, 0],
    rotate: [0, 180, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
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
      <section className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40 mb-16 sm:mb-20 md:mb-24 overflow-hidden">
        {/* Animated Background with Logo Colors */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          {/* Main gradient background matching logo colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-violet-950/20"></div>
          
          {/* Floating candy-colored orbs */}
          <motion.div 
            className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-pink-400/30 to-rose-500/30 blur-2xl"
            animate={{ 
              y: [-20, 20, -20],
              x: [-10, 10, -10]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400/30 to-violet-500/30 blur-2xl"
            animate={{ 
              y: [20, -20, 20],
              x: [10, -10, 10]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-400/20 blur-xl"
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          />
          
          {/* Floating sparkles */}
          <motion.div 
            className="absolute top-32 left-1/3 text-2xl"
            variants={sparkleVariants}
            animate="animate"
          >
            ✨
          </motion.div>
          <motion.div 
            className="absolute top-64 right-1/4 text-xl"
            variants={sparkleVariants}
            animate="animate"
            transition={{ delay: 0.5 }}
          >
            ⭐
          </motion.div>
          <motion.div 
            className="absolute bottom-40 right-1/3 text-lg"
            variants={sparkleVariants}
            animate="animate"
            transition={{ delay: 1 }}
          >
            💫
          </motion.div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Brand Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-violet-500/10 border border-pink-200/50 dark:border-pink-800/50 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Sweet • Simple • Powerful
              </span>
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </motion.div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 sm:mb-10 leading-tight">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Tools
              </span>
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Candy
              </span>
              <br />
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-normal text-muted-foreground">
                for Everyone
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-10 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4 sm:px-0">
              Sweeten your workflow with our deliciously simple image tools.
              <br className="hidden sm:block" />
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">
                Free, fast, and privacy-focused – no registration required.
              </span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 sm:px-0 mb-12 sm:mb-16">
              <Link href="/image/compress">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full px-8 py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 hover:from-pink-700 hover:via-purple-700 hover:to-violet-700 text-white shadow-2xl shadow-purple-600/25 flex items-center justify-center gap-3 h-14 sm:h-16 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                >
                  <Sparkles className="h-5 w-5" />
                  Start Creating 
                  <MoveRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full px-8 py-4 border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 h-14 sm:h-16 text-base sm:text-lg font-semibold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-pink-50 dark:hover:bg-pink-950/50 transition-all duration-300"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Explore Guides
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-8 sm:pt-12 border-t border-pink-100 dark:border-pink-900/50">
              <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base font-medium">
                TRUSTED BY THOUSANDS OF CREATORS WORLDWIDE
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 items-center">
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 p-3 rounded-full border border-green-200/50 dark:border-green-800/50">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">100% Free</span>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">Privacy First</span>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400 p-3 rounded-full border border-purple-200/50 dark:border-purple-800/50">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">Lightning Fast</span>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 text-orange-600 dark:text-orange-400 p-3 rounded-full border border-orange-200/50 dark:border-orange-800/50">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">Pro Quality</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Tools Section */}
      <section className="w-full mb-24 sm:mb-28 md:mb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Sweet Image Tools
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Transform your images with our delightfully simple tools – each one crafted for perfection
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8"
          >
            {/* Image Compression Tool */}
            <Link href="/image/compress" className="group">
              <motion.div variants={item}>
                <div className="relative h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-pink-900/30 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/20 hover:border-pink-300/50 hover:-translate-y-2 hover:scale-105 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Icon */}
                  <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg group-hover:shadow-xl group-hover:shadow-pink-500/30 transition-all duration-300">
                    <Image size={28} />
                    <motion.div 
                      className="absolute -top-1 -right-1 text-yellow-300"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      ✨
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Compress
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    Reduce file sizes without compromising quality. Perfect for web optimization and faster loading.
                  </p>
                  <div className="flex items-center font-semibold text-sm text-pink-600 dark:text-pink-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Try it now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Image Resize Tool */}
            <Link href="/image/resize" className="group">
              <motion.div variants={item}>
                <div className="relative h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-purple-950/30 dark:via-violet-950/30 dark:to-purple-900/30 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-300/50 hover:-translate-y-2 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
                    <ZoomIn size={28} />
                    <motion.div 
                      className="absolute -top-1 -right-1 text-pink-300"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, -180, -360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    >
                      💫
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Resize
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    Scale images to any dimension or percentage. Ideal for social media, websites, and presentations.
                  </p>
                  <div className="flex items-center font-semibold text-sm text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Resize now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Image Convert Tool */}
            <Link href="/image/convert" className="group">
              <motion.div variants={item}>
                <div className="relative h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-orange-900/30 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-300/50 hover:-translate-y-2 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all duration-300">
                    <RefreshCw size={28} />
                    <motion.div 
                      className="absolute -top-1 -right-1 text-purple-300"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1
                      }}
                    >
                      ⭐
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Convert
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    Transform between formats like JPG, PNG, WebP, and more. Optimize for any platform or use case.
                  </p>
                  <div className="flex items-center font-semibold text-sm text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Convert now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Image Crop Tool */}
            <Link href="/image/crop" className="group">
              <motion.div variants={item}>
                <div className="relative h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-900/30 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-300/50 hover:-translate-y-2 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-300">
                    <Crop size={28} />
                    <motion.div 
                      className="absolute -top-1 -right-1 text-yellow-300"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, -180, -360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                    >
                      ✨
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Crop
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    Trim and focus on what matters. Precise cropping tools for perfect composition every time.
                  </p>
                  <div className="flex items-center font-semibold text-sm text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Crop now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Image Metadata Tool */}
            <Link href="/image/metadata" className="group">
              <motion.div variants={item}>
                <div className="relative h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-900/30 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-300/50 hover:-translate-y-2 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                    <Info size={28} />
                    <motion.div 
                      className="absolute -top-1 -right-1 text-cyan-300"
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 2
                      }}
                    >
                      💎
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Metadata
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    Analyze EXIF data, colors, and image properties. Extract camera settings and technical details.
                  </p>
                  <div className="flex items-center font-semibold text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Analyze now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="w-full mb-24 sm:mb-28 md:mb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Why Choose ToolsCandy?
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              We make image editing as sweet and simple as candy
            </p>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
          >
            <motion.div variants={item} className="text-center group">
              <div className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:shadow-pink-500/30 transition-all duration-300 group-hover:scale-110">
                <Globe size={32} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Browser-Based
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                No downloads or installations required. Works directly in your browser with complete privacy protection.
              </p>
            </motion.div>

            <motion.div variants={item} className="text-center group">
              <div className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:scale-110">
                <Zap size={32} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Lightning Speed
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Optimized processing algorithms ensure your images are ready in seconds, not minutes.
              </p>
            </motion.div>

            <motion.div variants={item} className="text-center group">
              <div className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all duration-300 group-hover:scale-110">
                <Users size={32} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                User-Friendly
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Intuitive interface designed for everyone – from beginners to professionals.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      {latestPosts.length > 0 && (
        <section className="w-full mb-24 sm:mb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-16 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Latest Sweet Tips
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Fresh tutorials and insights to sweeten your creative workflow
              </p>
            </motion.div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {latestPosts.map((post, index) => (
                <motion.div key={post._id} variants={item}>
                  <Link href={`/blog/${post.slug}`}>
                    <div className="group h-full rounded-2xl border-2 border-transparent bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-300/30 hover:-translate-y-2">
                      {post.featuredImage && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={getProxiedFeaturedImage(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                              {getAuthorInitials(post.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm text-muted-foreground">
                            <div className="font-medium">{getAuthorName(post.author)}</div>
                            <div>{new Date(post.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 border-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            Read more <ArrowUpRight size={14} className="ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-12"
            >
              <Link href="/blog">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 py-4 border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-pink-50 dark:hover:bg-pink-950/50 transition-all duration-300"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View All Articles
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Loading state for blog posts */}
      {loading && (
        <section className="w-full mb-24 sm:mb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Latest Sweet Tips
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="w-full mb-16 sm:mb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 p-12 sm:p-16 text-center text-white overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
            
            {/* Floating Sparkles */}
            <motion.div 
              className="absolute top-8 right-20 text-2xl"
              animate={{ 
                y: [-10, 10, -10],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              ✨
            </motion.div>
            <motion.div 
              className="absolute bottom-8 left-20 text-xl"
              animate={{ 
                y: [10, -10, 10],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            >
              🍭
            </motion.div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Sweeten Your Workflow?
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Join thousands of creators who trust ToolsCandy for their image editing needs
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/image/compress">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto rounded-full px-8 py-4 bg-white text-purple-600 hover:bg-gray-100 shadow-xl flex items-center justify-center gap-3 h-14 sm:h-16 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <Download className="h-5 w-5" />
                    Start Now - It's Free!
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto rounded-full px-8 py-4 border-2 border-white/30 hover:border-white/50 bg-white/10 backdrop-blur-sm hover:bg-white/20 h-14 sm:h-16 text-base sm:text-lg font-semibold transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 