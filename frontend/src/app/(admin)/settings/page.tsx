'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/apiClient';
import { Trash2, CheckCircle, Timer, ClockIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Add type definitions for the API response
interface CleanupResult {
  processedFiles: {
    deletedCount: number;
    sizeFormatted: string;
  };
  archiveFiles: {
    deletedCount: number;
    sizeFormatted: string;
  };
  uploadedFiles: {
    deletedCount: number;
    sizeFormatted: string;
  };
  totalDeleted: number;
  totalSizeRecovered: string;
}

interface ScheduledTaskResult {
  success: boolean;
  message: string;
}

interface ApiResponse {
  status: string;
  data: {
    cleanup: CleanupResult;
    scheduledTask: ScheduledTaskResult | null;
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setupAutoCleanup, setSetupAutoCleanup] = useState(true);
  const [results, setResults] = useState<ApiResponse['data'] | null>(null);
  
  // Function to handle cleanup
  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ApiResponse>('admin/cleanup-images', {
        method: 'POST',
        body: { setupAutoCleanup },
        requireAuth: true
      });
      
      setResults(response.data);
      
      toast({
        title: 'Cleanup completed successfully',
        description: `Deleted ${response.data.cleanup.totalDeleted} files, recovered ${response.data.cleanup.totalSizeRecovered} of space.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      
      toast({
        title: 'Cleanup failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }
  
  return (
    <div className="container space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and maintenance tasks
        </p>
      </div>
      
      {/* Maintenance Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>
            Perform system maintenance tasks and configure automated cleanup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Image Cleanup</h3>
            <p className="text-sm text-muted-foreground">
              Clean up temporary and processed images to free up disk space.
              This will remove processed images, conversion results, and archives that are older than 7 days.
              Blog images will be preserved.
            </p>
            
            {results && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Cleanup completed</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      <strong>Processed files:</strong> {results.cleanup.processedFiles.deletedCount} deleted 
                      ({results.cleanup.processedFiles.sizeFormatted})
                    </p>
                    <p>
                      <strong>Archive files:</strong> {results.cleanup.archiveFiles.deletedCount} deleted 
                      ({results.cleanup.archiveFiles.sizeFormatted})
                    </p>
                    <p>
                      <strong>Uploaded files:</strong> {results.cleanup.uploadedFiles.deletedCount} deleted 
                      ({results.cleanup.uploadedFiles.sizeFormatted})
                    </p>
                    <Separator className="my-2" />
                    <p>
                      <strong>Total:</strong> {results.cleanup.totalDeleted} files deleted, 
                      {results.cleanup.totalSizeRecovered} recovered
                    </p>
                    
                    {results.scheduledTask && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                        <p className={results.scheduledTask.success ? 'text-green-600' : 'text-red-600'}>
                          <ClockIcon className="h-4 w-4 inline mr-1" />
                          {results.scheduledTask.message}
                        </p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="autoCleanup" 
                checked={setupAutoCleanup}
                onCheckedChange={() => setSetupAutoCleanup(!setupAutoCleanup)}
              />
              <label
                htmlFor="autoCleanup"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set up automatic daily cleanup (3:00 AM)
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCleanup} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> 
                Clean Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 