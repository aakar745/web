'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Info, 
  Shield, 
  FileText, 
  Scale,
  Lightbulb,
  CheckCircle
} from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

export default function DisclaimerPage() {
  useSeo('/disclaimer')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-purple-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 font-medium text-sm">
              Disclaimer
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Important 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600"> Information</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Please read this disclaimer carefully before using ToolsCandy's services. 
              It contains important information about the use of our tools.
            </p>
            
            <div className="flex justify-center">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Alert className="mb-12 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200 font-medium">
                <strong>Important:</strong> Always backup your original files before processing. 
                Use our tools responsibly and ensure you have rights to any images you process.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="text-center h-full border-2 border-red-100 dark:border-red-900/30">
                  <CardContent className="p-6">
                    <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 inline-block">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Use at Own Risk</h3>
                    <p className="text-muted-foreground">
                      Our tools are provided "as is" without warranties. Users assume all risks.
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
                    <h3 className="text-xl font-bold mb-3">Your Responsibility</h3>
                    <p className="text-muted-foreground">
                      Ensure you have rights to process images and comply with applicable laws.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="text-center h-full border-2 border-green-100 dark:border-green-900/30">
                  <CardContent className="p-6">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-4 inline-block">
                      <Lightbulb className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Best Practices</h3>
                    <p className="text-muted-foreground">
                      Follow our recommendations for optimal results and safe usage.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Disclaimer */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* General Disclaimer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    General Disclaimer
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    The information and tools provided by ToolsCandy are for general informational and 
                    utility purposes only. While we strive to provide accurate and reliable image processing 
                    tools, we make no representations or warranties of any kind about the completeness, 
                    accuracy, reliability, suitability, or availability of our services.
                  </p>
                  <p>
                    Any reliance you place on our tools and services is strictly at your own risk. 
                    We will not be liable for any loss or damage arising from your use of our services.
                  </p>
                </CardContent>
              </Card>

              {/* Service Limitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    Service Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Our image processing tools have certain limitations:
                  </p>
                  <ul>
                    <li><strong>Browser Dependency:</strong> Performance depends on your browser capabilities and device specifications</li>
                    <li><strong>File Size Limits:</strong> Very large files may not process efficiently or may cause browser issues</li>
                    <li><strong>Format Support:</strong> While we support many formats, some specialized or proprietary formats may not work</li>
                    <li><strong>Quality Variations:</strong> Results may vary based on input image quality and processing settings</li>
                    <li><strong>Device Performance:</strong> Processing speed and capability depend on your device's hardware</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Accuracy and Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Accuracy and Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    <strong>No Guarantee of Results:</strong> We do not guarantee that our tools will meet your 
                    specific requirements or that the results will be error-free.
                  </p>
                  <ul>
                    <li>Processing results may vary depending on input image characteristics</li>
                    <li>Quality loss may occur during compression or format conversion</li>
                    <li>Color accuracy may be affected by your device's display capabilities</li>
                    <li>Processing algorithms are constantly improved but may produce unexpected results</li>
                  </ul>
                  <p>
                    <strong>User Responsibility:</strong> It is your responsibility to verify that the processed 
                    images meet your requirements before using them for any purpose.
                  </p>
                </CardContent>
              </Card>

              {/* Copyright and Legal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Copyright and Legal Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    <strong>Copyright Responsibility:</strong> You are solely responsible for ensuring that 
                    you have the legal right to process any images using our tools.
                  </p>
                  <ul>
                    <li>Only process images you own or have explicit permission to modify</li>
                    <li>Respect copyrights, trademarks, and other intellectual property rights</li>
                    <li>Do not use our tools to infringe on others' rights</li>
                    <li>Comply with all applicable local, national, and international laws</li>
                  </ul>
                  <p>
                    <strong>Legal Compliance:</strong> Users must ensure their use of our tools complies with 
                    all applicable laws and regulations in their jurisdiction.
                  </p>
                </CardContent>
              </Card>

              {/* Technical Disclaimers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Technical Disclaimers
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    <strong>Browser-Based Processing:</strong> Our tools work entirely in your browser using 
                    modern web technologies. This means:
                  </p>
                  <ul>
                    <li>Processing capability is limited by your device and browser</li>
                    <li>Very large files may cause performance issues or browser crashes</li>
                    <li>Different browsers may produce slightly different results</li>
                    <li>Some older browsers may not support all features</li>
                  </ul>
                  <p>
                    <strong>Data Loss Prevention:</strong> While our tools work locally and don't upload your 
                    files, we strongly recommend maintaining backups of your original images.
                  </p>
                </CardContent>
              </Card>

              {/* Liability Limitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    Limitation of Liability
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    <strong>No Liability:</strong> To the fullest extent permitted by law, ToolsCandy and its 
                    operators shall not be liable for:
                  </p>
                  <ul>
                    <li>Any direct, indirect, incidental, special, or consequential damages</li>
                    <li>Loss of data, files, or image quality</li>
                    <li>Business interruption or loss of profits</li>
                    <li>Damages arising from technical failures or browser limitations</li>
                    <li>Any claims by third parties regarding copyright infringement</li>
                  </ul>
                  <p>
                    <strong>Maximum Liability:</strong> Our total liability for any claims shall not exceed the 
                    amount you paid to use our services (which is zero, as our service is free).
                  </p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Recommendations for Safe Use
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>To ensure the best experience with our tools:</p>
                  <ul>
                    <li><strong>Backup Originals:</strong> Always keep copies of your original images</li>
                    <li><strong>Test First:</strong> Try our tools with non-critical images first</li>
                    <li><strong>Check Results:</strong> Carefully review processed images before use</li>
                    <li><strong>Use Modern Browsers:</strong> Ensure your browser is up-to-date for best performance</li>
                    <li><strong>Respect Rights:</strong> Only process images you have rights to modify</li>
                    <li><strong>Read Guidelines:</strong> Follow any specific instructions provided for each tool</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Questions About This Disclaimer</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    If you have questions about this disclaimer or need clarification about our services, 
                    please contact us:
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