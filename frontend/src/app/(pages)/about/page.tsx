import React from 'react'
import type { Metadata } from 'next'
import { fetchDynamicSeoData, generateMetadataFromSeo, fetchSeoData } from '@/lib/seoUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Target, 
  Heart, 
  Lightbulb, 
  Shield, 
  Zap, 
  Globe, 
  Award,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react'

// Generate metadata server-side for About page
export async function generateMetadata(): Promise<Metadata> {
  // Try to fetch dynamic SEO data from admin settings
  const dynamicSeoData = await fetchDynamicSeoData('/about')
  
  if (dynamicSeoData) {
    return generateMetadataFromSeo(dynamicSeoData)
  }
  
  // Fallback to static data if admin settings not available
  const fallbackSeoData = await fetchSeoData('/about')
  return generateMetadataFromSeo(fallbackSeoData)
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 font-medium text-sm">
              About ToolsCandy
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Making Image Processing 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"> Sweet & Simple</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              We believe powerful image processing tools should be free, fast, and respect your privacy. 
              That's why we built ToolsCandy.
            </p>
            
            <div className="flex justify-center">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Trusted by thousands worldwide
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="p-8 border-2 border-blue-100 dark:border-blue-900/30">
                <CardHeader className="pb-4">
                  <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-xl mb-4 inline-block">
                    <Target className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To democratize image processing by providing powerful, free tools that work entirely in your browser. 
                    We believe everyone should have access to professional-grade image optimization without compromising their privacy.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 border-2 border-purple-100 dark:border-purple-900/30">
                <CardHeader className="pb-4">
                  <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-3 rounded-xl mb-4 inline-block">
                    <Lightbulb className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    A world where anyone can optimize, edit, and transform their images instantly without uploads, 
                    subscriptions, or privacy concerns. Technology should empower users, not exploit them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-xl text-muted-foreground">The principles that guide everything we do</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-4 inline-block">
                    <Shield className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                  <p className="text-muted-foreground">
                    Your images never leave your device. All processing happens locally in your browser, 
                    ensuring complete privacy and security.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-4 inline-block">
                    <Heart className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Always Free</h3>
                  <p className="text-muted-foreground">
                    No subscriptions, no premium tiers, no hidden costs. We believe powerful tools should be 
                    accessible to everyone, regardless of budget.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-4 rounded-xl mb-4 inline-block">
                    <Zap className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                  <p className="text-muted-foreground">
                    No uploads, no waiting. Process images instantly with cutting-edge browser technology 
                    for immediate results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              <p className="text-xl text-muted-foreground">How ToolsCandy came to be</p>
            </div>

            <div className="space-y-8">
              <Card className="p-8">
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    ToolsCandy was born from frustration. Tired of uploading sensitive images to unknown servers, 
                    dealing with file size limits, and paying for basic image processing features, we decided to build something better.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    We realized that modern browsers are incredibly powerful. They can handle complex image processing 
                    without needing external servers. So we built tools that work entirely in your browser, giving you 
                    professional results while keeping your files completely private.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Today, ToolsCandy serves thousands of users worldwide who value privacy, speed, and simplicity. 
                    We're constantly improving our tools and adding new features based on community feedback.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ToolsCandy by the Numbers</h2>
              <p className="text-xl text-muted-foreground">The impact we're making together</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-4 inline-block">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold mb-2">50,000+</div>
                <div className="text-muted-foreground">Happy Users</div>
              </div>

              <div className="text-center">
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-4 inline-block">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold mb-2">1M+</div>
                <div className="text-muted-foreground">Images Processed</div>
              </div>

              <div className="text-center">
                <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-4 rounded-xl mb-4 inline-block">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold mb-2">150+</div>
                <div className="text-muted-foreground">Countries Served</div>
              </div>

              <div className="text-center">
                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-4 rounded-xl mb-4 inline-block">
                  <Award className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 