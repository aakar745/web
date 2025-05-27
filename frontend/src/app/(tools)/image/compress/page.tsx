'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ToolHeader } from '@/components/tools/ToolHeader'
import { useSeo } from '@/hooks/useSeo'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ImageIcon, Download, X, Trash2, Plus, Package, Server, WifiOff, RefreshCw, AlertCircle, Clock } from 'lucide-react'
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

// Add RateLimitIndicator component
const RateLimitIndicator = ({ usage, limit, resetsIn, isLimitReached = false }: { 
  usage: number; 
  limit: number; 
  resetsIn: number | null;
  isLimitReached?: boolean;
}) => {
  // Calculate percentage used
  const percentUsed = Math.min(100, Math.round((usage / limit) * 100));
  
  // Determine indicator color based on usage
  let indicatorColor = "bg-green-500";
  if (percentUsed > 70) indicatorColor = "bg-yellow-500";
  if (percentUsed > 90 || isLimitReached) indicatorColor = "bg-red-500";
  
  // Only hide if no usage and not limit reached
  if (usage === 0 && !isLimitReached) return null;
  
  return (
    <div className={`mt-4 p-3 ${isLimitReached ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'} border rounded-md`}>
      <div className="flex justify-between items-center mb-1">
        <h4 className={`text-sm font-medium ${isLimitReached ? 'text-red-700 dark:text-red-400' : ''}`}>
          {isLimitReached ? 'Rate Limit Reached' : 'API Rate Limit'}
        </h4>
        <span className="text-xs">{usage} of {limit} requests used</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full ${indicatorColor} transition-all duration-300`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
      {resetsIn !== null && (
        <p className={`mt-1 text-xs ${isLimitReached ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          Rate limit resets in {Math.ceil(resetsIn / 60)} minutes
        </p>
      )}
      {isLimitReached && resetsIn === null && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
          Please wait before making more requests
        </p>
      )}
    </div>
  );
};

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
      
      // Check if adding would exceed the maximum of 10 files
      const maxFiles = 10;
      if (files.length + processedFiles.length > maxFiles) {
        // Only take what fits
        const remainingSlots = maxFiles - files.length;
        const filesToAdd = processedFiles.slice(0, remainingSlots);
        
        // Show a notification about files that weren't added
        if (remainingSlots < processedFiles.length) {
          toast({
            title: "File limit exceeded",
            description: `Only ${remainingSlots} file(s) were added. The maximum is ${maxFiles} files total.`,
            variant: "destructive"
          });
        }
        
        setFiles(prevFiles => {
          const updatedFiles = [...prevFiles, ...filesToAdd];
          // Automatically select the first file if none is currently selected
          if (selectedFileIndex === null && updatedFiles.length > 0) {
            setTimeout(() => setSelectedFileIndex(0), 0);
          }
          return updatedFiles;
        });
      } else {
        // All files fit within the limit
        setFiles(prevFiles => {
          const updatedFiles = [...prevFiles, ...processedFiles];
          // Automatically select the first file if none is currently selected
          if (selectedFileIndex === null && updatedFiles.length > 0) {
            setTimeout(() => setSelectedFileIndex(0), 0);
          }
          return updatedFiles;
        });
      }
      
      // Reset results when new files are uploaded
      setResults([]);
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
    
    await compressFiles(files, files.map((_, i) => i))
  }
  
  const compressFiles = async (filesToCompress: File[], fileIndices: number[]) => {
    setIsLoading(true)
    const compressedResults: any[] = [...results]
    const newJobIds: string[] = []
    
    try {
      // Check if backend is connected
      if (!isConnected) {
        toast({
          title: "Server unavailable",
          description: "Cannot connect to the server. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      for (let i = 0; i < filesToCompress.length; i++) {
        const file = filesToCompress[i]
        const index = fileIndices[i]
        
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
            
            // Start polling this job
            pollJobStatus(result.data.jobId, 'compress', {
              intervalMs: 1000,
              onProgress: (progress) => {
                setJobProgress(prev => ({
                  ...prev,
                  [result.data.jobId as string]: progress
                }))
              },
              onComplete: (jobResult) => {
                // Update results when job completes
                compressedResults[index] = {
                  filename: file.name,
                  originalSize: file.size,
                  compressedSize: jobResult.compressedSize,
                  compressionRatio: jobResult.compressionRatio,
                  originalFilename: jobResult.originalFilename,
                  resultFilename: jobResult.filename,
                  downloadUrl: jobResult.downloadUrl
                }
                setResults([...compressedResults])
                
                // Remove job from active jobs
                setJobIds(prev => prev.filter(id => id !== result.data.jobId))
              },
              onError: (error) => {
                console.error(`Job ${result.data.jobId} failed:`, error)
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
            // Direct processing - immediate result
            compressedResults[index] = {
              filename: file.name,
              originalSize: file.size,
              compressedSize: result.data.compressedSize,
              compressionRatio: result.data.compressionRatio,
              originalFilename: result.data.originalFilename,
              resultFilename: result.data.filename,
              downloadUrl: result.data.downloadUrl
            }
          }
        } catch (error: any) {
          console.error(`Failed to compress file ${i+1}/${filesToCompress.length}:`, error);
          
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
      
      // Update results for direct processing
      setResults(compressedResults)
      
      // Only show success toast if at least one file was successfully compressed
      if (compressedResults.some(result => result !== null)) {
        toast({
          title: "Compression started",
          description: processingMode === 'queued' 
            ? `${filesToCompress.length} image(s) queued for compression` 
            : `Compressed ${filesToCompress.length} image(s)`,
        });
      }
    } catch (error) {
      console.error('Compression error:', error)
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
                  limit={rateLimitUsage.limit} 
                  resetsIn={rateLimitUsage.resetsIn} 
                  isLimitReached={rateLimitUsage.isLimitReached}
                />
              )}
              
              <ImageDropzone onImageDrop={handleImageDrop} existingFiles={files.length} />
              
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
                    
                    {/* Show progress indicator for queued jobs */}
                    {isLoading && processingMode === 'queued' && selectedFileIndex !== null && 
                     !results[selectedFileIndex] && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <LoadingSpinner className="h-4 w-4" />
                          <p className="text-sm text-muted-foreground">
                            Processing in queue...
                            {jobProgress[jobIds[selectedFileIndex]] && (
                              <span className="ml-1">({jobProgress[jobIds[selectedFileIndex]]}%)</span>
                            )}
                          </p>
                        </div>
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
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCompressSingle}
                disabled={isLoading || selectedFileIndex === null}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Compress Selected Image
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 mt-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCompressAll}
                disabled={isLoading || files.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Compress All Images
                  </>
                )}
              </Button>
              
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