'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Scale, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Gavel,
  Info
} from 'lucide-react'

export default function TermsPage() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-blue-500/10 text-amber-600 dark:text-amber-400 font-medium text-sm">
              Terms of Service
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Fair Terms for 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-blue-600"> Everyone</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Clear, simple terms that protect both you and ToolsCandy while ensuring the best possible experience.
            </p>
            
            <div className="flex justify-center">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Alert className="mb-12 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200 font-medium">
                <strong>Quick Summary:</strong> Use our tools responsibly, respect others, and we'll provide 
                you with free, high-quality image processing services.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="text-center h-full border-2 border-green-100 dark:border-green-900/30">
                  <CardContent className="p-6">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-4 inline-block">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Free to Use</h3>
                    <p className="text-muted-foreground">
                      All our image processing tools are completely free with no hidden fees or limitations.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="text-center h-full border-2 border-blue-100 dark:border-blue-900/30">
                  <CardContent className="p-6">
                    <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-4 inline-block">
                      <Shield className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Your Rights Protected</h3>
                    <p className="text-muted-foreground">
                      We respect your privacy and intellectual property. Your content remains yours.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="text-center h-full border-2 border-purple-100 dark:border-purple-900/30">
                  <CardContent className="p-6">
                    <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-4 rounded-xl mb-4 inline-block">
                      <Scale className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Fair Usage</h3>
                    <p className="text-muted-foreground">
                      Use our tools responsibly and respect the rights of others and our service.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Terms */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Acceptance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Acceptance of Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    By accessing and using ToolsCandy, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                  <p>
                    These terms apply to all visitors, users, and others who access or use our service.
                  </p>
                </CardContent>
              </Card>

              {/* Description of Service */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Description of Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    ToolsCandy provides free, browser-based image processing tools including:
                  </p>
                  <ul>
                    <li>Image compression and optimization</li>
                    <li>Image resizing and scaling</li>
                    <li>Format conversion between image types</li>
                    <li>Image cropping and editing</li>
                    <li>Related educational content and tutorials</li>
                  </ul>
                  <p>
                    All processing occurs locally in your browser. We do not store, access, or retain your images.
                  </p>
                </CardContent>
              </Card>

              {/* User Responsibilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Scale className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    User Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>You agree to:</p>
                  <ul>
                    <li><strong>Use Legally:</strong> Only process images you own or have permission to modify</li>
                    <li><strong>Respect Others:</strong> Not use our tools for illegal, harmful, or offensive content</li>
                    <li><strong>No Abuse:</strong> Not attempt to overload, hack, or damage our services</li>
                    <li><strong>Follow Laws:</strong> Comply with all applicable local, state, and federal laws</li>
                    <li><strong>Respect Copyright:</strong> Only process content you have rights to</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Prohibited Uses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    Prohibited Uses
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>You may not use ToolsCandy to:</p>
                  <ul>
                    <li>Process illegal, harmful, threatening, abusive, or offensive content</li>
                    <li>Violate intellectual property rights of others</li>
                    <li>Attempt to reverse engineer, hack, or compromise our services</li>
                    <li>Use automated systems to overload our servers</li>
                    <li>Distribute malware or harmful code</li>
                    <li>Impersonate others or provide false information</li>
                    <li>Engage in any activity that interferes with others' use of the service</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Intellectual Property */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Intellectual Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p><strong>Your Content:</strong></p>
                  <ul>
                    <li>You retain all rights to images you process using our tools</li>
                    <li>We do not claim any ownership of your content</li>
                    <li>You are responsible for ensuring you have rights to process any images</li>
                  </ul>
                  <p><strong>Our Service:</strong></p>
                  <ul>
                    <li>ToolsCandy and its original content are owned by us and protected by copyright</li>
                    <li>Our tools and algorithms are proprietary</li>
                    <li>You may not copy, modify, or distribute our service without permission</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Privacy and Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Privacy and Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Your privacy is important to us. Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to understand how we handle data.
                  </p>
                  <p>Key points:</p>
                  <ul>
                    <li>Images are processed locally in your browser</li>
                    <li>We do not store, access, or retain your images</li>
                    <li>Minimal, anonymous usage data may be collected for service improvement</li>
                    <li>No personal information is required to use our tools</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Service Availability */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Availability</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    We strive to provide reliable service, but cannot guarantee 100% uptime. Our service may be 
                    temporarily unavailable due to:
                  </p>
                  <ul>
                    <li>Maintenance and updates</li>
                    <li>Technical difficulties</li>
                    <li>Circumstances beyond our control</li>
                  </ul>
                  <p>
                    We reserve the right to modify, suspend, or discontinue any part of our service with or without notice.
                  </p>
                </CardContent>
              </Card>

              {/* Disclaimers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    Disclaimers
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    <strong>AS IS BASIS:</strong> Our service is provided "as is" without warranties of any kind, 
                    either express or implied.
                  </p>
                  <ul>
                    <li>We do not guarantee the accuracy, reliability, or suitability of our tools</li>
                    <li>You use our service at your own risk</li>
                    <li>We are not responsible for any damage to your files or devices</li>
                    <li>Results may vary depending on your browser and device capabilities</li>
                  </ul>
                  <p>
                    <strong>BACKUP YOUR FILES:</strong> Always keep backups of important images before processing.
                  </p>
                </CardContent>
              </Card>

              {/* Limitation of Liability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Gavel className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Limitation of Liability
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    To the fullest extent permitted by law, ToolsCandy shall not be liable for:
                  </p>
                  <ul>
                    <li>Any indirect, incidental, special, or consequential damages</li>
                    <li>Loss of data, profits, or business opportunities</li>
                    <li>Damages arising from use or inability to use our service</li>
                    <li>Damages from third-party content or services</li>
                  </ul>
                  <p>
                    Our total liability shall not exceed the amount you paid us for the service 
                    (which is zero, as our service is free).
                  </p>
                </CardContent>
              </Card>

              {/* Changes to Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    We may update these Terms of Service from time to time. Changes will be posted on this page 
                    with an updated "Last Modified" date.
                  </p>
                  <p>
                    Continued use of our service after changes constitutes acceptance of the new terms. 
                    If you disagree with any changes, please discontinue using our service.
                  </p>
                </CardContent>
              </Card>

              {/* Governing Law */}
              <Card>
                <CardHeader>
                  <CardTitle>Governing Law</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    These Terms of Service are governed by and construed in accordance with applicable laws. 
                    Any disputes shall be resolved through appropriate legal channels.
                  </p>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <ul>
                    <li><strong>Email:</strong> legal@toolscandy.com</li>
                    <li><strong>Contact Form:</strong> <a href="/contact" className="text-primary hover:underline">Contact Page</a></li>
                  </ul>
                  <p>
                    <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
                    <strong>Version:</strong> 1.0
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