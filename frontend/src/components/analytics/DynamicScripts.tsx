'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { apiRequest } from '@/lib/apiClient'

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

export default function DynamicScripts({ placement }: DynamicScriptsProps) {
  const [scripts, setScripts] = useState<ScriptData[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        // Security check - never load scripts on admin pages
        if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
          setScripts([])
          setLoading(false)
          return
        }

        const response = await apiRequest<{status: string; data: ScriptData[]}>(
          `/scripts/public?pathname=${encodeURIComponent(pathname)}&placement=${placement}`,
          {
            requireAuth: false
          }
        )

        if (response.status === 'success') {
          setScripts(response.data || [])
        }
      } catch (error) {
        console.error('Error fetching scripts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScripts()
  }, [pathname, placement])

  if (loading || scripts.length === 0) {
    return null
  }

  return (
    <>
      {scripts.map((script, index) => {
        // Check if content contains script tags
        if (script.content.includes('<script')) {
          // HTML script tags - inject as dangerouslySetInnerHTML
          return (
            <div
              key={`${script._id}-${index}`}
              dangerouslySetInnerHTML={{ __html: script.content }}
            />
          )
        } else {
          // Pure JavaScript - use Next.js Script component
          return (
            <Script
              key={`${script._id}-${index}`}
              id={`dynamic-script-${script._id}`}
              strategy={placement === 'head' ? 'beforeInteractive' : 'afterInteractive'}
            >
              {script.content}
            </Script>
          )
        }
      })}
    </>
  )
}

// Specialized components for different placements
export function HeadScripts() {
  return <DynamicScripts placement="head" />
}

export function BodyScripts() {
  return <DynamicScripts placement="body" />
}

export function FooterScripts() {
  return <DynamicScripts placement="footer" />
} 