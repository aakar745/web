'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { apiRequest } from '@/lib/apiClient'

// Extend Window interface to include tracking scripts
declare global {
  interface Window {
    dataLayer?: any[]      // Google Tag Manager
    fbq?: any             // Facebook Pixel
    gtag?: any            // Google Analytics
    _gaq?: any            // Legacy Google Analytics
  }
}

interface ScriptData {
  _id: string
  content: string
  placement: 'head' | 'body' | 'footer'
  priority: number
  platform: string
}

interface DynamicScriptsProps {
  placement: 'head' | 'body' | 'footer'
}

// Script loading status tracking
const scriptLoadStatus = new Map<string, 'loading' | 'loaded' | 'error'>()

export default function DynamicScripts({ placement }: DynamicScriptsProps) {
  const [scripts, setScripts] = useState<ScriptData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  // Enhanced content processing function for any HTML content
  const processContent = (content: string): { type: 'script' | 'noscript' | 'html', processedContent: string } => {
    try {
      // Handle noscript content
      if (content.includes('<noscript>')) {
        const noscriptMatch = content.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/i)
        return {
          type: 'noscript',
          processedContent: noscriptMatch ? noscriptMatch[1] : content
        }
      }

      // Handle script tags (extract JavaScript)
      if (content.includes('<script')) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
        let extractedContent = ''
        let match
        
        while ((match = scriptRegex.exec(content)) !== null) {
          const scriptContent = match[1]
          if (scriptContent && scriptContent.trim()) {
            extractedContent += scriptContent.trim() + '\n'
          }
        }
        
        const cleanedScript = extractedContent
          .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
          .replace(/&lt;/g, '<')           // Decode HTML entities
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()

        return {
          type: 'script',
          processedContent: cleanedScript
        }
      }

      // Handle any other HTML content (meta, link, style, etc.)
      // Clean up and decode entities but preserve HTML structure
      const cleanedHTML = content
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()

      return {
        type: 'html',
        processedContent: cleanedHTML
      }

    } catch (error) {
      console.error('Error processing content:', error)
      return {
        type: 'html',
        processedContent: content.trim()
      }
    }
  }

  // Script load handlers
  const handleScriptLoad = useCallback((scriptId: string, platform: string) => {
    scriptLoadStatus.set(scriptId, 'loaded')
    
    // Platform-specific success logging and validation
    if (platform === 'Google Tag Manager') {
      console.log('✅ GTM script loaded successfully:', scriptId)
      
      // Check if dataLayer exists after GTM loads
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.dataLayer) {
          console.log('✅ GTM dataLayer initialized:', window.dataLayer.length, 'events')
        }
      }, 100)
    } else if (platform === 'Facebook Pixel') {
      console.log('✅ Facebook Pixel script loaded successfully:', scriptId)
      
      // Check if fbq function exists after Facebook Pixel loads
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          console.log('✅ Facebook Pixel fbq function initialized')
        }
      }, 100)
    } else if (platform === 'Google Analytics') {
      console.log('✅ Google Analytics script loaded successfully:', scriptId)
      
      // Check if gtag function exists after GA loads
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          console.log('✅ Google Analytics gtag function initialized')
        }
      }, 100)
    } else {
      console.log(`✅ ${platform} script loaded successfully:`, scriptId)
    }
  }, [])

  const handleScriptError = useCallback((scriptId: string, platform: string) => {
    scriptLoadStatus.set(scriptId, 'error')
    console.error('❌ Script failed to load:', scriptId, platform)
  }, [])

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setError(null)
        
        // Security check - never load scripts on admin pages
        if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
          setScripts([])
          setLoading(false)
          return
        }

        console.log(`🔄 Fetching ${placement} scripts for:`, pathname)

        const response = await apiRequest<{status: string; data: ScriptData[]}>(
          `/scripts/public?pathname=${encodeURIComponent(pathname)}&placement=${placement}`,
          {
            requireAuth: false,
            retry: 2, // Retry failed requests
            noRedirect: true // Don't redirect on errors
          }
        )

        if (response.status === 'success') {
          // Sort by priority to ensure correct loading order
          const sortedScripts = (response.data || []).sort((a, b) => a.priority - b.priority)
          setScripts(sortedScripts)
          
          if (sortedScripts.length > 0) {
            console.log(`📜 Loaded ${sortedScripts.length} ${placement} scripts:`, 
              sortedScripts.map(s => `${s.platform} (priority: ${s.priority})`))
          }
        }
      } catch (error) {
        console.error('Error fetching scripts:', error)
        setError(error instanceof Error ? error.message : 'Failed to load scripts')
        // Set empty array on error to prevent blocking page load
        setScripts([])
      } finally {
        setLoading(false)
      }
    }

    fetchScripts()
  }, [pathname, placement])

  // Don't render anything while loading
  if (loading) {
    return null
  }

  // Don't render anything if no scripts
  if (scripts.length === 0) {
    return null
  }

  // Log error but don't block rendering
  if (error) {
    console.warn(`Dynamic scripts error for ${placement}:`, error)
  }

  return (
    <>
      {scripts.map((script, index) => {
        const scriptId = `${script._id}-${index}`
        
        // Mark script as loading
        scriptLoadStatus.set(scriptId, 'loading')

        // Extract and clean script content
        const { type, processedContent } = processContent(script.content)
        
        // Validate that we have actual JavaScript content
        if (type === 'script' && (!processedContent || processedContent.trim().length === 0)) {
          console.warn(`⚠️ Empty script content for ${script.platform}:`, scriptId)
          return null
        }

        // Detect the platform for better logging
        const isGTMScript = script.content.match(/GTM-[A-Z0-9]+/) && script.platform === 'Google Tag Manager'
        const isFacebookPixel = script.content.includes('fbq') || script.platform === 'Facebook Pixel'
        const isGoogleAnalytics = script.content.includes('gtag') || script.platform === 'Google Analytics'
        
        // Render based on content type
        if (type === 'noscript') {
          console.log(`📄 Rendering noscript content for ${script.platform} in ${placement}`)
          return (
            <noscript 
              key={scriptId}
              dangerouslySetInnerHTML={{
                __html: processedContent
              }}
            />
          )
        }

        if (type === 'script') {
          // Log the script being loaded
          if (isGTMScript) {
            const gtmId = script.content.match(/GTM-[A-Z0-9]+/)?.[0]
            console.log(`🏷️  Loading GTM script in ${placement}:`, gtmId)
            // DEBUG: Log the actual script content being executed
            console.log('🔍 GTM Script Content Preview:', processedContent.substring(0, 200) + '...')
            console.log('🔍 Original Content Preview:', script.content.substring(0, 200) + '...')
            console.log('🔍 Script Length - Original:', script.content.length, 'Cleaned:', processedContent.length)
            console.log('🔍 Full Cleaned Script:', processedContent)
          } else if (isFacebookPixel) {
            console.log(`📘 Loading Facebook Pixel script in ${placement}`)
          } else if (isGoogleAnalytics) {
            console.log(`📊 Loading Google Analytics script in ${placement}`)
          } else {
            console.log(`📜 Loading ${script.platform} script in ${placement}`)
          }

          // Use Next.js Script component for JavaScript
          return (
            <Script
              key={scriptId}
              id={`dynamic-script-${script._id}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: processedContent
              }}
              onLoad={() => handleScriptLoad(scriptId, script.platform)}
              onError={() => handleScriptError(scriptId, script.platform)}
            />
          )
        }

        if (type === 'html') {
          // Handle other HTML content (meta, link, style tags, etc.)
          console.log(`🏗️  Rendering HTML content for ${script.platform} in ${placement}`)
          
          // For head placement, render directly as HTML
          if (placement === 'head') {
            return (
              <div
                key={scriptId}
                dangerouslySetInnerHTML={{
                  __html: processedContent
                }}
                style={{ display: 'none' }} // Hide the wrapper div
              />
            )
          }

          // For body/footer placement, render as regular HTML
          return (
            <div
              key={scriptId}
              dangerouslySetInnerHTML={{
                __html: processedContent
              }}
            />
          )
        }

        return null
      })}
    </>
  )
}

// Export named components for each placement
export function HeadScripts() {
  return <DynamicScripts placement="head" />
}

export function BodyScripts() {
  return <DynamicScripts placement="body" />
}

export function FooterScripts() {
  return <DynamicScripts placement="footer" />
}