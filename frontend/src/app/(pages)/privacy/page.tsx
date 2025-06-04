'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Eye, 
  Lock, 
  Server, 
  Cookie,
  FileText,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { DynamicSeoLoader } from '@/components/seo/DynamicSeoLoader'

export default function PrivacyPage() {
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
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen">
      <DynamicSeoLoader pagePath="/privacy" />
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-600 dark:text-green-400 font-medium text-sm">
              Privacy Policy
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Privacy is 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600"> Our Priority</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Learn how ToolsCandy protects your privacy and what data we collect (spoiler: almost none).
            </p>
            
            <div className="flex justify-center">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto"
          >
            <Alert className="mb-12 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                <strong>Privacy First:</strong> All image processing happens locally in your browser. 
                We never upload, store, or have access to your files.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <motion.div variants={itemVariants}>
                <Card className="text-center h-full border-2 border-green-100 dark:border-green-900/30">
                  <CardContent className="p-6">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-4 inline-block">
                      <Lock className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">No Data Collection</h3>
                    <p className="text-muted-foreground">
                      Your images never leave your device. Zero upload, zero storage, zero access.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="text-center h-full border-2 border-blue-100 dark:border-blue-900/30">
                  <CardContent className="p-6">
                    <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-4 inline-block">
                      <Eye className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">No Tracking</h3>
                    <p className="text-muted-foreground">
                      We don't use invasive analytics or tracking cookies to monitor your behavior.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="text-center h-full border-2 border-purple-100 dark:border-purple-900/30">
                  <CardContent className="p-6">
                    <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-4 rounded-xl mb-4 inline-block">
                      <Shield className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Complete Control</h3>
                    <p className="text-muted-foreground">
                      You maintain full control over your data at all times. Nothing leaves your browser.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Detailed Privacy Policy */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    At ToolsCandy, we believe privacy is a fundamental right. This Privacy Policy explains 
                    how we approach data collection, usage, and protection when you use our image processing tools.
                  </p>
                  <p>
                    <strong>The short version:</strong> We designed our tools to work entirely in your browser, 
                    which means your files and personal data stay with you, always.
                  </p>
                </CardContent>
              </Card>

              {/* Data We Don't Collect */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Data We Don't Collect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Your Images</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Personal Information</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">File Contents</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Location Data</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Device Information</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Browsing History</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How Our Tools Work */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    How Our Tools Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    All image processing on ToolsCandy happens <strong>locally in your browser</strong> using modern 
                    web technologies:
                  </p>
                  <ul>
                    <li><strong>Client-side Processing:</strong> Your images are processed using JavaScript and Web APIs directly in your browser</li>
                    <li><strong>No Server Upload:</strong> Images never leave your device or get uploaded to our servers</li>
                    <li><strong>Instant Results:</strong> Processing happens immediately without network requests</li>
                    <li><strong>Complete Privacy:</strong> We literally cannot see your images because they never reach our servers</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Limited Data Collection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Eye className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    Limited Data We May Collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    While we don't collect your images or personal data, we may collect minimal, anonymous usage data:
                  </p>
                  <ul>
                    <li><strong>Basic Analytics:</strong> Page views and general usage patterns (via privacy-focused analytics)</li>
                    <li><strong>Error Logs:</strong> Technical errors to help us improve the tools (no personal data included)</li>
                    <li><strong>Performance Metrics:</strong> Loading times and tool performance (anonymous)</li>
                  </ul>
                  <p>
                    This data is aggregated, anonymized, and used solely to improve our services.
                  </p>
                </CardContent>
              </Card>

              {/* Cookies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Cookie className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Cookies and Local Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>We use minimal cookies and local storage for:</p>
                  <ul>
                    <li><strong>Theme Preferences:</strong> Remembering your dark/light mode preference</li>
                    <li><strong>Tool Settings:</strong> Saving your preferred compression levels or output formats</li>
                    <li><strong>Essential Functions:</strong> Basic website functionality and user experience</li>
                  </ul>
                  <p>
                    You can clear these at any time through your browser settings. Our tools will continue 
                    to work without them, though you may need to reset your preferences.
                  </p>
                </CardContent>
              </Card>

              {/* Third-Party Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    Third-Party Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>We may use privacy-focused third-party services:</p>
                  <ul>
                    <li><strong>Analytics:</strong> Privacy-focused analytics that don't track individual users</li>
                    <li><strong>Content Delivery:</strong> CDNs to serve our application faster (no personal data shared)</li>
                    <li><strong>Hosting:</strong> Cloud hosting providers for our website (not your files)</li>
                  </ul>
                  <p>
                    These services are carefully selected for their privacy practices and do not have access 
                    to your images or personal data.
                  </p>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Your Rights
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>You have the right to:</p>
                  <ul>
                    <li><strong>Complete Control:</strong> Your data remains on your device at all times</li>
                    <li><strong>Data Deletion:</strong> Clear your browser data to remove any locally stored preferences</li>
                    <li><strong>Opt-out:</strong> Disable analytics or cookies through your browser settings</li>
                    <li><strong>Questions:</strong> Contact us about our privacy practices at any time</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                  </p>
                  <ul>
                    <li><strong>Email:</strong> privacy@toolscandy.com</li>
                    <li><strong>Contact Form:</strong> <a href="/contact" className="text-primary hover:underline">Contact Page</a></li>
                  </ul>
                </CardContent>
              </Card>

              {/* Updates */}
              <Card>
                <CardHeader>
                  <CardTitle>Policy Updates</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    We may update this Privacy Policy occasionally to reflect changes in our practices or legal requirements. 
                    Any significant changes will be prominently displayed on our website.
                  </p>
                  <p>
                    <strong>Current version:</strong> 1.0<br />
                    <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
} 