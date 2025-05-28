'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ToolHeader } from '@/components/tools/ToolHeader'
import { useSeo } from '@/hooks/useSeo'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ImageIcon, Download, X, Trash2, Plus, Package, Server, WifiOff, RefreshCw, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import ImageDropzone from '@/components/tools/ImageDropzone'
import { useToast } from '@/components/ui/use-toast'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { processHeicFiles } from '@/lib/heicConverter'
import { useProcessingMode } from '@/lib/context/ProcessingModeContext'
import { pollJobStatus } from '@/lib/api/statusApi'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { apiRequest, getApiUrl } from '@/lib/apiClient'
import { QueueStatusIndicator } from '@/components/ui/QueueStatusIndicator'
import { RateLimitIndicator } from '@/components/ui/RateLimitIndicator'

// Define types for API responses
interface CompressResponse {
  status: string;
  data: {
    jobId?: string;
    compressedSize: number;
    compressionRatio: number;
    originalFilename: string;
    filename: string;
    downloadUrl: string;
  }
}

interface ArchiveResponse {
  status: string;
  data: {
    downloadUrl: string;
  }
}

export default function CompressTool() {
  // Load SEO data for image compression tool
  const { seoData, loading: seoLoading } = useSeo('/image/compress')
  
  const [quality, setQuality] = useState(80)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isArchiveLoading, setIsArchiveLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [jobIds, setJobIds] = useState<string[]>([])
  const [jobProgress, setJobProgress] = useState<Record<string, number>>({})
  const [queueStatus, setQueueStatus] = useState<Record<string, {
    position?: number | null;
    waitTime?: string | null;
    isProcessing?: boolean;
  }>>({})
  const [fileJobMapping, setFileJobMapping] = useState<Record<number, string>>({}) // Map file index to job ID
  
  // Add visual progress states
  const [visualProgress, setVisualProgress] = useState<Record<number, number>>({}) // file index -> progress percentage
  const [processingFiles, setProcessingFiles] = useState<Set<number>>(new Set()) // track which files are being processed
  const [pendingResults, setPendingResults] = useState<any[]>([]) // store results until progress reaches 100%
  
  // Add dropzone control state
  const [shouldClearDropzone, setShouldClearDropzone] = useState(false)
  
  const { toast } = useToast()
  const { processingMode, isConnected, isInitializing, serverState, errorDetails, nextRetryTime, retryConnection } = useProcessingMode()
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [rateLimitUsage, setRateLimitUsage] = useState<{
    used: number;
    limit: number;
    resetsIn: number | null;
    isLimitReached: boolean;
  }>({
    used: 0,
    limit: 10,  // Default value from the backend
    resetsIn: null,
    isLimitReached: false
  });
  
  // Calculate retry countdown
  useEffect(() => {
    if (!nextRetryTime) {
      setRetryCountdown(null);
      return;
    }
    
    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((nextRetryTime - Date.now()) / 1000));
      setRetryCountdown(secondsLeft);
      
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
      }
    };
    
    // Initial update
    updateCountdown();
    
    // Update every second
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, [nextRetryTime]);
  
  // Visual progress simulation function
  const simulateProgress = (fileIndex: number, duration: number = 2000) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const interval = 50; // Update every 50ms for smooth animation
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        
        setVisualProgress(prev => ({
          ...prev,
          [fileIndex]: Math.round(progress)
        }));
        
        if (progress >= 100) {
          resolve();
        } else {
          setTimeout(updateProgress, interval);
        }
      };
      
      updateProgress();
    });
  };
  
  // Function to show results after progress completes
  const showResultsAfterProgress = async (fileIndex: number, result: any) => {
    // Wait for visual progress to complete
    await simulateProgress(fileIndex);
    
    // Now show the actual result
    setResults(prevResults => {
      const newResults = [...prevResults];
      newResults[fileIndex] = result;
      return newResults;
    });
    
    // Clean up progress state
    setVisualProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileIndex];
      return newProgress;
    });
    
    setProcessingFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileIndex);
      return newSet;
    });
  };
  
  // Generate preview URLs when files change
  useEffect(() => {
    // Revoke old object URLs to avoid memory leaks
    previews.forEach(preview => URL.revokeObjectURL(preview))
    
    // Create new preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
    
    // Clean up function to revoke URLs when component unmounts
    return () => {
      newPreviews.forEach(preview => URL.revokeObjectURL(preview))
    }
  }, [files])
  
  const handleImageDrop = async (droppedFiles: File[]) => {
    // First convert any HEIC/HEIF files to JPEG
    try {
      const processedFiles = await processHeicFiles(droppedFiles);
      
      // ImageDropzone now handles file limits dynamically, so we just add all processed files
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles, ...processedFiles];
        // Automatically select the first file if none is currently selected
        if (selectedFileIndex === null && updatedFiles.length > 0) {
          setTimeout(() => setSelectedFileIndex(0), 0);
        }
        return updatedFiles;
      });
      
      // Reset results and progress states when new files are uploaded
      setResults([]);
      setVisualProgress({});
      setProcessingFiles(new Set());
    } catch (error) {
      toast({
        title: "Error processing HEIC images",
        description: "There was an error processing one or more HEIC images. Try converting them to JPEG before uploading.",
        variant: "destructive"
      });
    }
  }
  
  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    // Also remove from results if it was already compressed
    setResults(prevResults => prevResults.filter((_, i) => i !== index))
    
    // Clean up progress states for this file
    setVisualProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      // Also need to adjust indices for remaining files
      const adjustedProgress: Record<number, number> = {};
      Object.entries(newProgress).forEach(([key, value]) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          adjustedProgress[oldIndex - 1] = value;
        } else if (oldIndex < index) {
          adjustedProgress[oldIndex] = value;
        }
      });
      return adjustedProgress;
    });
    
    setProcessingFiles(prev => {
      const newSet = new Set<number>();
      prev.forEach(fileIndex => {
        if (fileIndex < index) {
          newSet.add(fileIndex);
        } else if (fileIndex > index) {
          newSet.add(fileIndex - 1);
        }
        // Don't add the removed index
      });
      return newSet;
    });
    
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null)
    } else if (selectedFileIndex !== null && selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1)
    }
  }
  
  const handleRemoveAllFiles = () => {
    setFiles([])
    setPreviews([])
    setResults([])
    setSelectedFileIndex(null)
    // Clean up all progress states
    setVisualProgress({});
    setProcessingFiles(new Set());
    setFileJobMapping({});
    // Trigger dropzone clearing
    setShouldClearDropzone(true);
  }
  
  // Callback for when dropzone completes clearing
  const handleDropzoneClearComplete = () => {
    setShouldClearDropzone(false);
  }
  
  const handleCompressSingle = async () => {
    if (selectedFileIndex === null) {
      toast({
        title: "No file selected",
        description: "Please select an image to compress",
        variant: "destructive"
      })
      return
    }
    
    // Check if file is already compressed
    if (results[selectedFileIndex]) {
      toast({
        title: "Image already compressed",
        description: "This image has already been compressed. You can download it from the preview panel.",
        variant: "default"
      })
      return
    }
    
    const file = files[selectedFileIndex]
    await compressFiles([file], [selectedFileIndex])
  }
  
  const handleCompressAll = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image to compress",
        variant: "destructive"
      })
      return
    }
    
    // Filter out already compressed files
    const uncompressedFiles: File[] = []
    const uncompressedIndices: number[] = []
    
    files.forEach((file, index) => {
      if (!results[index]) {
        uncompressedFiles.push(file)
        uncompressedIndices.push(index)
      }
    })
    
    if (uncompressedFiles.length === 0) {
      toast({
        title: "All images already compressed",
        description: "All images have already been compressed. You can download them using the ZIP download button.",
        variant: "default"
      })
      return
    }
    
    await compressFiles(uncompressedFiles, uncompressedIndices)
  }
  
  const compressFiles = async (filesToCompress: File[], fileIndices: number[]) => {
    setIsLoading(true)
    const compressedResults: any[] = [...results]
    const newJobIds: string[] = []
    
    // Mark files as being processed and start visual progress
    setProcessingFiles(new Set(fileIndices))
    
    try {
      // Check if backend is connected
      if (!isConnected) {
        toast({
          title: "Server unavailable",
          description: "Cannot connect to the server. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
        // Clear processing state
        setProcessingFiles(new Set())
        return;
      }
      
      for (let i = 0; i < filesToCompress.length; i++) {
        const file = filesToCompress[i]
        const index = fileIndices[i]
        
        // Start visual progress for this file
        setVisualProgress(prev => ({
          ...prev,
          [index]: 0
        }));
        
        const formData = new FormData()
        formData.append('image', file)
        formData.append('quality', quality.toString())
        
        try {
          // Use the enhanced API request function
          const result = await makeApiRequestWithRateLimitTracking<CompressResponse>('images/compress', {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          
          // Handle queued response (with jobId) vs direct response
          if (result.status === 'processing' && result.data.jobId) {
            // Queued processing - store job ID for polling
            newJobIds.push(result.data.jobId)
            
            // Map this file index to the job ID
            setFileJobMapping(prev => ({
              ...prev,
              [index]: result.data.jobId as string
            }));
            
            // Start polling this job
            pollJobStatus(result.data.jobId, 'compress', {
              intervalMs: 1000,
              onProgress: (progress, queuePosition, estimatedWaitTime) => {
                // Update visual progress for queued jobs (use actual progress)
                setVisualProgress(prev => ({
                  ...prev,
                  [index]: progress
                }));
                
                setJobProgress(prev => ({
                  ...prev,
                  [result.data.jobId as string]: progress
                }))
                
                // Update queue status
                setQueueStatus(prev => ({
                  ...prev,
                  [result.data.jobId as string]: {
                    position: queuePosition,
                    waitTime: estimatedWaitTime,
                    isProcessing: progress > 0
                  }
                }))
              },
              onQueueStatus: (position, waitTime) => {
                setQueueStatus(prev => ({
                  ...prev,
                  [result.data.jobId as string]: {
                    position,
                    waitTime,
                    isProcessing: false
                  }
                }))
              },
              onComplete: async (jobResult) => {
                // Prepare result object
                const resultObj = {
                  filename: file.name,
                  originalSize: file.size,
                  compressedSize: jobResult.compressedSize,
                  compressionRatio: jobResult.compressionRatio,
                  qualityUsed: quality,
                  originalFilename: jobResult.originalFilename,
                  resultFilename: jobResult.filename,
                  downloadUrl: jobResult.downloadUrl
                };
                
                // Show progress completion and then result
                setVisualProgress(prev => ({
                  ...prev,
                  [index]: 100
                }));
                
                // Wait a moment for the 100% to be visible, then show result
                setTimeout(() => {
                  setResults(prevResults => {
                    const newResults = [...prevResults];
                    newResults[index] = resultObj;
                    return newResults;
                  });
                  
                  // Clean up progress state
                  setVisualProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[index];
                    return newProgress;
                  });
                  
                  setProcessingFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  });
                  
                  // Show success notification
                  toast({
                    title: "✅ Compression completed!",
                    description: `${file.name} compressed successfully (${jobResult.compressionRatio}% file size reduction)`,
                  });
                }, 500);
                
                // Remove job from active jobs
                setJobIds(prev => prev.filter(id => id !== result.data.jobId))
                
                // Clean up file job mapping
                setFileJobMapping(prev => {
                  const newMapping = { ...prev };
                  delete newMapping[index];
                  return newMapping;
                });
              },
              onError: (error) => {
                console.error(`Job ${result.data.jobId} failed:`, error)
                
                // Clean up progress state on error
                setVisualProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[index];
                  return newProgress;
                });
                
                setProcessingFiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(index);
                  return newSet;
                });
                
                toast({
                  title: "Compression failed",
                  description: error,
                  variant: "destructive"
                })
                
                // Remove job from active jobs
                setJobIds(prev => prev.filter(id => id !== result.data.jobId))
              }
            }).catch(error => {
              console.error('Polling error:', error)
            })
            
          } else {
            // Direct processing - immediate result, but use visual progress
            const resultObj = {
              filename: file.name,
              originalSize: file.size,
              compressedSize: result.data.compressedSize,
              compressionRatio: result.data.compressionRatio,
              qualityUsed: quality,
              originalFilename: result.data.originalFilename,
              resultFilename: result.data.filename,
              downloadUrl: result.data.downloadUrl
            };
            
            // Start visual progress simulation for direct processing
            showResultsAfterProgress(index, resultObj).then(() => {
              // Show success notification after progress completes
              toast({
                title: "✅ Compression completed!",
                description: `${file.name} compressed successfully (${result.data.compressionRatio}% file size reduction)`,
              });
            });
          }
        } catch (error: any) {
          console.error(`Failed to compress file ${i+1}/${filesToCompress.length}:`, error);
          
          // Clean up progress state on error
          setVisualProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[index];
            return newProgress;
          });
          
          setProcessingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
          
          // Special handling for rate limit errors
          if (error.status === 429) {
            // Force show a toast notification
            toast({
              title: "Rate Limit Reached",
              description: "You've reached your limit for image processing. It will reset after some time.",
              variant: "destructive",
              duration: 5000 // Make it display longer
            });
            
            // Explicitly set the rate limit reached flag
            setRateLimitUsage(prev => ({
              ...prev,
              isLimitReached: true
            }));
            
            // Do not mark files as compressed if they hit the rate limit
            compressedResults[index] = null;
            
            // Stop processing more files if we hit a rate limit
            break;
          } else {
            // For other errors, just continue to the next file
            toast({
              title: `Failed to compress file ${i+1}/${filesToCompress.length}`,
              description: error.message || "An unexpected error occurred",
              variant: "destructive"
            });
            
            // Mark the file as failed
            compressedResults[index] = null;
          }
          
          // Continue with other files instead of stopping the whole batch
          continue;
        }
      }
      
      // Store new job IDs
      setJobIds(prev => [...prev, ...newJobIds])
      
      // Update results for direct processing (this is handled by showResultsAfterProgress now)
      // setResults(compressedResults)
      
      // Only show success toast if at least one file was successfully compressed
      // (Individual success toasts are now shown after progress completes)
      
    } catch (error) {
      console.error('Compression error:', error)
      
      // Clean up all progress states on major error
      setVisualProgress({});
      setProcessingFiles(new Set());
      
      toast({
        title: "Compression failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      // Only set loading to false if direct processing or all jobs failed
      if (processingMode !== 'queued' || newJobIds.length === 0) {
        setIsLoading(false)
      }
    }
  }
  
  // Set loading to false when all jobs complete
  useEffect(() => {
    if (jobIds.length === 0 && isLoading) {
      setIsLoading(false)
    }
  }, [jobIds, isLoading])
  
  const handleDownloadArchive = async () => {
    if (results.filter(r => r).length === 0) {
      toast({
        title: "No compressed images",
        description: "Please compress at least one image first",
        variant: "destructive"
      })
      return
    }
    
    setIsArchiveLoading(true)
    
    try {
      // Get all file IDs that have been compressed
      const fileIds = results
        .map((result, index) => result ? { filename: result.resultFilename, originalName: result.originalFilename } : null)
        .filter(item => item !== null)
      
      // Use enhanced API request function
      const result = await makeApiRequestWithRateLimitTracking<ArchiveResponse>('images/archive', {
        method: 'POST',
        body: { files: fileIds },
      });
      
      // Trigger download - use getApiUrl to ensure consistent URL format
      const baseUrl = getApiUrl().replace('/api', ''); // Remove '/api' as it's included in the downloadUrl
      window.location.href = `${baseUrl}${result.data.downloadUrl}`;
      
      toast({
        title: "Archive created",
        description: "Your compressed images are being downloaded as a ZIP file"
      })
    } catch (error: any) {
      console.error('Archive error:', error);
      
      // Special handling for rate limit errors
      if (error.status === 429) {
        toast({
          title: "Rate Limit Reached",
          description: "You've reached your limit for batch operations. It will reset after some time.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Archive creation failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsArchiveLoading(false)
    }
  }
  
  // Function to update rate limit info based on response headers
  const updateRateLimitInfo = (headers: Headers) => {
    const remaining = headers.get('RateLimit-Remaining');
    const limit = headers.get('RateLimit-Limit');
    const resetAfter = headers.get('RateLimit-Reset-After');
    
    if (remaining && limit) {
      const used = Number(limit) - Number(remaining);
      setRateLimitUsage(prev => ({
        ...prev,
        used,
        limit: Number(limit),
        resetsIn: resetAfter ? Number(resetAfter) : null
      }));
    }
  };
  
  // Update the apiRequest call to capture rate limit headers
  const makeApiRequestWithRateLimitTracking = async <T,>(endpoint: string, options: any): Promise<T> => {
    try {
      // Make the actual API request
      const result = await apiRequest<T>(endpoint, options);
      
      // No direct access to headers from apiRequest
      // We'll update rate limit info on errors instead
      
      return result;
    } catch (error: any) {
      // If rate limit info is available on the error, update the state
      if (error.rateLimitInfo) {
        const { limit, remaining, resetAfter } = error.rateLimitInfo;
        if (limit && remaining) {
          const used = Number(limit) - Number(remaining);
          setRateLimitUsage({
            used,
            limit: Number(limit),
            resetsIn: resetAfter ? Number(resetAfter) : null,
            isLimitReached: error.status === 429
          });
        }
      }
      
      // If this is a rate limit error, set the flag even without detailed info
      if (error.status === 429) {
        setRateLimitUsage(prev => ({
          ...prev,
          isLimitReached: true
        }));
      }
      
      throw error; // Re-throw the error for the caller to handle
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader 
        title="Image Compression" 
        description="Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality."
        icon={<ImageIcon className="h-6 w-6" />}
      />
      
      {/* Server Status Messages */}
      {serverState === 'connecting' && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <LoadingSpinner className="h-5 w-5" />
            <h3 className="font-medium">Connecting to server...</h3>
          </div>
          <p className="text-sm mt-1 text-blue-700 dark:text-blue-500">
            Establishing connection to the backend. Image processing will be available shortly.
          </p>
        </div>
      )}
      
      {serverState === 'circuit-open' && (
        <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-400">
              <Clock className="h-5 w-5" />
              <h3 className="font-medium">Connection attempts paused</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryConnection}
              className="text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Force Retry
            </Button>
          </div>
          <p className="text-sm mt-1 text-purple-700 dark:text-purple-500">
            Connection attempts temporarily paused to prevent excessive requests. 
            {retryCountdown !== null && retryCountdown > 0 ? (
              <span> Automatically retrying in <strong>{retryCountdown}</strong> seconds.</span>
            ) : (
              <span> Retrying connection...</span>
            )}
          </p>
        </div>
      )}
      
      {serverState === 'unavailable' && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <WifiOff className="h-5 w-5" />
              <h3 className="font-medium">Server unavailable</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryConnection}
              className="text-red-800 dark:text-red-400 border-red-300 dark:border-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
          </div>
          <p className="text-sm mt-1 text-red-700 dark:text-red-500">
            The backend server is not responding. Please make sure the server is running at {getApiUrl()}.
            {retryCountdown !== null && retryCountdown > 0 && (
              <span> Next attempt in <strong>{retryCountdown}</strong> seconds.</span>
            )}
          </p>
        </div>
      )}
      
      {serverState === 'error' && (
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">Server error</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryConnection}
              className="text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
          </div>
          <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-500">
            The server returned an error: {errorDetails || 'Unknown error'}
            {retryCountdown !== null && retryCountdown > 0 && (
              <span> Retrying in <strong>{retryCountdown}</strong> seconds.</span>
            )}
          </p>
        </div>
      )}
      
      {serverState === 'connected' && !isConnected && (
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
              <Server className="h-5 w-5" />
              <h3 className="font-medium">Redis unavailable</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryConnection}
              className="text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
            </Button>
          </div>
          <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-500">
            Server is running in direct processing mode (Redis unavailable). 
            Image processing will work but may be slower with multiple users.
          </p>
        </div>
      )}
      
      <div className="grid gap-8 mt-8">
        {/* File selection area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Dropzone and file list */}
          <div className="flex-1">
            <div className="space-y-4">
              {/* Rate Limit Indicator */}
              {rateLimitUsage.used > 0 && (
                <RateLimitIndicator 
                  usage={rateLimitUsage.used} 
                  resetsIn={rateLimitUsage.resetsIn} 
                  isLimitReached={rateLimitUsage.isLimitReached}
                  type="imageProcessing"
                />
              )}
              
              <ImageDropzone 
                onImageDrop={handleImageDrop} 
                existingFiles={files.length}
                shouldClear={shouldClearDropzone}
                onClearComplete={handleDropzoneClearComplete}
              />
              
              {files.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Selected Files ({files.length})</h3>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleRemoveAllFiles}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Clear All
                    </Button>
                  </div>
                  
                  <div className="max-h-[250px] overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded ${
                          selectedFileIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
                        } cursor-pointer`}
                        onClick={() => setSelectedFileIndex(index)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 mr-3 flex-shrink-0 bg-background rounded overflow-hidden">
                            <img 
                              src={previews[index]} 
                              alt={file.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                              {results[index] && results[index] !== null && (
                                <Badge className="ml-2 bg-green-600" variant="secondary">
                                  Compressed
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        <button 
                          className="p-1 hover:bg-background rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Preview and settings */}
          <div className="flex-1">
            <div className="border rounded-lg p-4 h-full flex flex-col">
              <h3 className="font-medium mb-4">Image Preview</h3>
              
              {selectedFileIndex !== null ? (
                <div className="flex-grow flex flex-col">
                  <div className="flex-grow flex items-center justify-center bg-accent/20 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={previews[selectedFileIndex]} 
                      alt={files[selectedFileIndex].name}
                      className="max-h-[300px] max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="text-sm">
                    <p><span className="font-medium">Name:</span> {files[selectedFileIndex].name}</p>
                    <p><span className="font-medium">Size:</span> {(files[selectedFileIndex].size / 1024).toFixed(2)} KB</p>
                    <p><span className="font-medium">Type:</span> {files[selectedFileIndex].type}</p>
                    
                    {results[selectedFileIndex] && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="font-medium text-green-600">Compressed Stats:</p>
                        <p>
                          Size: {(results[selectedFileIndex].compressedSize / 1024).toFixed(2)} KB 
                          <span className="text-green-600 ml-2">
                            ({results[selectedFileIndex].compressionRatio}% smaller)
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quality setting used: {results[selectedFileIndex].qualityUsed}%
                        </p>
                        <div className="mt-2">
                          <a 
                            href={`${getApiUrl().replace('/api', '')}${results[selectedFileIndex].downloadUrl}`}
                            className="text-xs inline-flex items-center px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            <Download className="h-3 w-3 mr-1" /> Download
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Show progress for background jobs */}
                    {selectedFileIndex !== null && 
                     !results[selectedFileIndex] && 
                     fileJobMapping[selectedFileIndex] && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="font-medium text-yellow-600">Processing Image...</p>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-2">
                          <div
                            className="h-full bg-yellow-500 transition-all duration-300"
                            style={{ width: `${jobProgress[fileJobMapping[selectedFileIndex]] || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {jobProgress[fileJobMapping[selectedFileIndex]] 
                            ? `${Math.round(jobProgress[fileJobMapping[selectedFileIndex]])}% complete` 
                            : 'Starting process...'}
                        </p>
                        
                        {/* Show queue status if available */}
                        {fileJobMapping[selectedFileIndex] && queueStatus[fileJobMapping[selectedFileIndex]] && (
                          <div className="mt-2">
                            <QueueStatusIndicator
                              queuePosition={queueStatus[fileJobMapping[selectedFileIndex]]?.position}
                              estimatedWaitTime={queueStatus[fileJobMapping[selectedFileIndex]]?.waitTime}
                              isProcessing={queueStatus[fileJobMapping[selectedFileIndex]]?.isProcessing}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-center text-muted-foreground bg-accent/10 rounded-lg">
                  <div>
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {files.length > 0 ? (
                      <p>Select an image from the list to preview</p>
                    ) : (
                      <p>Upload images to get started</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Compression settings and actions */}
        <Card className="p-6">
          <Tabs defaultValue="single" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Compression Settings</h3>
              
              <div className="flex items-center gap-3">
                {processingMode === 'queued' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Server className="h-3 w-3" /> Queue mode
                  </span>
                )}
                <TabsList>
                  <TabsTrigger value="single" disabled={files.length === 0}>Single Image</TabsTrigger>
                  <TabsTrigger value="batch" disabled={files.length < 2}>Batch Compress</TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Quality: {quality}%</h4>
              <Slider
                value={[quality]}
                onValueChange={(values: number[]) => setQuality(values[0])}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Lower quality, smaller size</span>
                <span>Higher quality, larger size</span>
              </div>
            </div>
            
            <TabsContent value="single" className="space-y-4 mt-4">
              {/* Queue Status Indicator for Single Image */}
              {selectedFileIndex !== null && 
               !results[selectedFileIndex] && 
               fileJobMapping[selectedFileIndex] && 
               queueStatus[fileJobMapping[selectedFileIndex]] && (
                <QueueStatusIndicator
                  queuePosition={queueStatus[fileJobMapping[selectedFileIndex]]?.position}
                  estimatedWaitTime={queueStatus[fileJobMapping[selectedFileIndex]]?.waitTime}
                  isProcessing={queueStatus[fileJobMapping[selectedFileIndex]]?.isProcessing}
                />
              )}
              
              {/* Visual Progress Bar for Single Image */}
              {selectedFileIndex !== null && processingFiles.has(selectedFileIndex) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Compressing image...</span>
                    <span className="font-medium">{visualProgress[selectedFileIndex] || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${visualProgress[selectedFileIndex] || 0}%` }}
                    />
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCompressSingle}
                disabled={isLoading || selectedFileIndex === null || (selectedFileIndex !== null && results[selectedFileIndex])}
                variant="default"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Compress Selected Image
                  </>
                )}
              </Button>
              
              {/* Show message if already processed */}
              {selectedFileIndex !== null && results[selectedFileIndex] && !isLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Image already compressed and ready for download.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 mt-4">
              {/* Queue Status Indicator for Batch Processing */}
              {Object.keys(fileJobMapping).length > 0 && 
               Object.keys(queueStatus).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(fileJobMapping).map(([fileIndex, jobId]) => {
                    const status = queueStatus[jobId];
                    if (!status || results[parseInt(fileIndex)]) return null;
                    
                    return (
                      <div key={fileIndex} className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          {files[parseInt(fileIndex)]?.name || `File ${parseInt(fileIndex) + 1}`}
                        </p>
                        <QueueStatusIndicator
                          queuePosition={status.position}
                          estimatedWaitTime={status.waitTime}
                          isProcessing={status.isProcessing}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Visual Progress Bar for Batch Processing */}
              {processingFiles.size > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Compressing {processingFiles.size} image{processingFiles.size > 1 ? 's' : ''}...
                    </span>
                    <span className="font-medium">
                      {Object.keys(visualProgress).length > 0 
                        ? `${Math.round(Object.values(visualProgress).reduce((a, b) => a + b, 0) / Object.values(visualProgress).length)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Array.from(processingFiles).map(fileIndex => (
                      <div key={fileIndex} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate text-muted-foreground">
                            {files[fileIndex]?.name || `File ${fileIndex + 1}`}
                          </span>
                          <span className="font-medium">{visualProgress[fileIndex] || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${visualProgress[fileIndex] || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCompressAll}
                disabled={isLoading || files.length === 0 || files.every((_, index) => results[index])}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Compress All Images
                  </>
                )}
              </Button>
              
              {/* Show message if all files are already processed */}
              {files.length > 0 && files.every((_, index) => results[index]) && !isLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    All images already compressed and ready for download.
                  </p>
                </div>
              )}
              
              {results.filter(r => r).length > 1 && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleDownloadArchive}
                  disabled={isArchiveLoading}
                >
                  {isArchiveLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating archive...
                    </span>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" /> Download All as ZIP
                    </>
                  )}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
} 