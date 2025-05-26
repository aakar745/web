'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { apiRequest, getApiUrl } from '@/lib/apiClient'

interface ConnectionStatus {
  status: 'checking' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  timestamp: string
}

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'checking',
    message: 'Initializing...',
    timestamp: new Date().toISOString()
  })
  const [isVisible, setIsVisible] = useState(false)

  const testConnection = async () => {
    setConnectionStatus({
      status: 'checking',
      message: 'Testing connection...',
      timestamp: new Date().toISOString()
    })

    try {
      // Test basic connectivity
      const apiUrl = getApiUrl()
      console.log('Testing API URL:', apiUrl)

      // Try health check endpoint
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus({
          status: 'success',
          message: 'Backend connection successful!',
          details: `API URL: ${apiUrl} | Status: ${data.status || 'OK'}`,
          timestamp: new Date().toISOString()
        })
      } else {
        setConnectionStatus({
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: `API URL: ${apiUrl} | Failed to connect`,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionStatus({
        status: 'error',
        message: 'Connection failed',
        details: `API URL: ${getApiUrl()} | Error: ${errorMessage}`,
        timestamp: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    // Only show in production or when there are connection issues
    if (process.env.NODE_ENV === 'production') {
      setIsVisible(true)
      testConnection()
    }
  }, [])

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'success':
        return 'bg-green-500/10 text-green-600 border-green-200'
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-200'
    }
  }

  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {getStatusIcon()}
          API Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className={`${getStatusColor()} text-xs`}>
          {connectionStatus.message}
        </Badge>
        
        {connectionStatus.details && (
          <p className="text-xs text-muted-foreground break-all">
            {connectionStatus.details}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(connectionStatus.timestamp).toLocaleTimeString()}
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testConnection}
              disabled={connectionStatus.status === 'checking'}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Test
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 