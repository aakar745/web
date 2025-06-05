'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/apiClient'

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function BackupTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const updateTestResult = (endpoint: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.data = data
        return [...prev]
      } else {
        return [...prev, { endpoint, status, message, data }]
      }
    })
  }

  const testBackupEndpoints = async () => {
    setTesting(true)
    setTestResults([])

    // Test 1: Get backup status
    try {
      updateTestResult('/backup/status', 'pending', 'Testing...')
      const statusResponse = await apiRequest<any>('/backup/status', { requireAuth: true })
      updateTestResult('/backup/status', 'success', 'Status endpoint working', statusResponse.data)
    } catch (error: any) {
      updateTestResult('/backup/status', 'error', error.message || 'Failed to get status')
    }

    // Test 2: Get backup history
    try {
      updateTestResult('/backup/history', 'pending', 'Testing...')
      const historyResponse = await apiRequest<any>('/backup/history', { requireAuth: true })
      updateTestResult('/backup/history', 'success', `Found ${historyResponse.data?.backups?.length || 0} backups`, historyResponse.data)
    } catch (error: any) {
      updateTestResult('/backup/history', 'error', error.message || 'Failed to get history')
    }

    // Test 3: Create a test backup
    try {
      updateTestResult('/backup/create', 'pending', 'Creating test backup...')
      const createResponse = await apiRequest<any>('/backup/create', {
        method: 'POST',
        body: {
          type: 'selective',
          collections: ['systemsettings'],
          compress: true,
          description: 'Test backup from frontend'
        },
        requireAuth: true
      })
      updateTestResult('/backup/create', 'success', 'Test backup created successfully', createResponse.data)
    } catch (error: any) {
      updateTestResult('/backup/create', 'error', error.message || 'Failed to create backup')
    }

    setTesting(false)
  }

  const getStatusBadge = (status: 'success' | 'error' | 'pending') => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      success: 'default',
      error: 'destructive', 
      pending: 'secondary'
    }
    
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Backup System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testBackupEndpoints} 
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Run Backup System Tests'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {result.endpoint}
                    </code>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600">View Response Data</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 