'use client'

import React, { useState, useEffect } from 'react'
import { ToolHeader } from '@/components/tools/ToolHeader'
import { useSeo } from '@/hooks/useSeo'
import { Button } from '@/components/ui/button'
import { 
  Repeat, Download, X, Trash2, FileType, ImageIcon, Plus, Package, 
  ArrowDownSquare, ArrowRightSquare, RefreshCw, CheckCircle, Server
} from 'lucide-react'
import ImageDropzone from '@/components/tools/ImageDropzone'
import { useToast } from '@/components/ui/use-toast'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { processHeicFiles } from '@/lib/heicConverter'
import { useRateLimit } from '@/lib/hooks/useRateLimit'
import { apiRequest, getApiUrl } from '@/lib/apiClient'
import { pollJobStatus } from '@/lib/api/statusApi'
import { QueueStatusIndicator } from '@/components/ui/QueueStatusIndicator'
import { useProcessingMode } from '@/lib/context/ProcessingModeContext'

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

// Define response types for API calls
interface ConvertResponse {
  status: string;
  data: {
    originalFormat: string;
    convertedFormat: string;
    mime: string;
    filename: string;
    originalFilename: string;
    downloadUrl: string;
  } | {
    jobId: string;
    statusUrl: string;
  };
}

export default function ConvertTool() {
  // Load SEO data for image convert tool
  const { seoData, loading: seoLoading } = useSeo('/image/convert')
  
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null)
  const [targetFormat, setTargetFormat] = useState<string>('webp')
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
  
  // Add dropzone control state
  const [shouldClearDropzone, setShouldClearDropzone] = useState(false)
  
  const { toast } = useToast()
  const { processingMode } = useProcessingMode()
  const { makeRequest } = useRateLimit()
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
  
  // Update target format when selected file changes
  useEffect(() => {
    if (selectedFileIndex !== null && files[selectedFileIndex]) {
      const currentFormat = getCurrentFormat()
      
      // If current target format is the same as the file's format, select a different one
      if (currentFormat === targetFormat) {
        // Default to webp if current is not webp, otherwise use png
        setTargetFormat(currentFormat === 'webp' ? 'png' : 'webp')
      }
    }
  }, [selectedFileIndex, files])
  
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
    // Also remove from results if it was already processed
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
  
  // Function to get file extension from a filename
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }
  
  // Function to get file name without extension
  const getFileNameWithoutExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename
  }
  
  // Get the current format of the selected file
  const getCurrentFormat = (): string | null => {
    if (selectedFileIndex === null || !files[selectedFileIndex]) {
      return null;
    }
    
    // Check for HEIC/HEIF files by extension first
    const fileName = files[selectedFileIndex].name.toLowerCase();
    if (fileName.endsWith('.heic')) return 'heic';
    if (fileName.endsWith('.heif')) return 'heif';
    
    // Check by MIME type
    if (files[selectedFileIndex].type.includes('heic')) return 'heic';
    if (files[selectedFileIndex].type.includes('heif')) return 'heif';
    
    // Normalize jpeg/jpg
    const ext = getFileExtension(files[selectedFileIndex].name).toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    return ext;
  }
  
  const handleConvertSingle = async () => {
    if (selectedFileIndex === null) {
      toast({
        title: "No file selected",
        description: "Please select an image to convert",
        variant: "destructive"
      })
      return
    }
    
    // Check if file is already converted
    if (results[selectedFileIndex]) {
      toast({
        title: "Image already converted",
        description: "This image has already been converted. You can download it from the preview panel.",
        variant: "default"
      })
      return
    }
    
    const file = files[selectedFileIndex]
    await convertFiles([file], [selectedFileIndex])
  }
  
  const handleConvertAll = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image to convert",
        variant: "destructive"
      })
      return
    }
    
    // Filter out already converted files
    const unconvertedFiles: File[] = []
    const unconvertedIndices: number[] = []
    
    files.forEach((file, index) => {
      if (!results[index]) {
        unconvertedFiles.push(file)
        unconvertedIndices.push(index)
      }
    })
    
    if (unconvertedFiles.length === 0) {
      toast({
        title: "All images already converted",
        description: "All images have already been converted. You can download them using the ZIP download button.",
        variant: "default"
      })
      return
    }
    
    await convertFiles(unconvertedFiles, unconvertedIndices)
  }
  
  const convertFiles = async (filesToConvert: File[], fileIndices: number[]) => {
    setIsLoading(true);
    const convertedResults: any[] = [...results];
    
    // Mark files as being processed and start visual progress
    setProcessingFiles(new Set(fileIndices))
    
    try {
      for (let i = 0; i < filesToConvert.length; i++) {
        const file = filesToConvert[i];
        const index = fileIndices[i];
        
        // Start visual progress for this file
        setVisualProgress(prev => ({
          ...prev,
          [index]: 0
        }));
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('format', targetFormat);
        
        try {
          // Use makeApiRequestWithRateLimitTracking instead of makeRequest
          const result = await makeApiRequestWithRateLimitTracking<ConvertResponse>('images/convert', {
            method: 'POST',
            body: formData,
            isFormData: true,
          });
          
          // Create the new filename with the target extension
          const newFilename = `${getFileNameWithoutExtension(file.name)}.${targetFormat}`;
          
          // Check if this is a direct response or a job that needs polling
          if (result.status === 'success' && 'convertedFormat' in result.data) {
            // Direct processing - use visual progress
            const resultData = result.data as {
              originalFormat: string;
              convertedFormat: string;
              mime: string;
              filename: string;
              originalFilename: string;
              downloadUrl: string;
            };
            
            const resultObj = {
              filename: file.name,
              originalFormat: resultData.originalFormat,
              convertedFormat: resultData.convertedFormat,
              mime: resultData.mime,
              resultFilename: resultData.filename,
              newFilename: newFilename,
              downloadUrl: resultData.downloadUrl
            };
            
            // Start visual progress simulation for direct processing
            showResultsAfterProgress(index, resultObj).then(() => {
              // Show success notification after progress completes
              toast({
                title: "✅ Conversion completed!",
                description: `${file.name} converted to ${resultData.convertedFormat.toUpperCase()}`,
              });
            });
          } else if (result.status === 'processing' && 'jobId' in result.data) {
            // Background processing - need to poll for status
            const jobId = result.data.jobId;
            setJobIds(prev => [...prev, jobId]);
            
            // Map this file index to the job ID
            setFileJobMapping(prev => ({
              ...prev,
              [index]: jobId
            }));
            
            // Start polling this job
            pollJobStatus(jobId, 'convert', {
              intervalMs: 1000,
              onProgress: (progress, queuePosition, estimatedWaitTime) => {
                // Update visual progress for queued jobs (use actual progress)
                setVisualProgress(prev => ({
                  ...prev,
                  [index]: progress
                }));
                
                setJobProgress(prev => ({
                  ...prev,
                  [jobId]: progress
                }));
                
                // Update queue status
                setQueueStatus(prev => ({
                  ...prev,
                  [jobId]: {
                    position: queuePosition,
                    waitTime: estimatedWaitTime,
                    isProcessing: progress > 0
                  }
                }));
              },
              onQueueStatus: (position, waitTime) => {
                setQueueStatus(prev => ({
                  ...prev,
                  [jobId]: {
                    position,
                    waitTime,
                    isProcessing: false
                  }
                }));
              },
              onComplete: async (jobResult) => {
                // Prepare result object
                const resultObj = {
                  filename: file.name,
                  originalFormat: jobResult.originalFormat,
                  convertedFormat: jobResult.convertedFormat,
                  mime: jobResult.mime,
                  resultFilename: jobResult.filename,
                  newFilename: newFilename,
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
                    title: "✅ Conversion completed!",
                    description: `${file.name} converted to ${jobResult.convertedFormat.toUpperCase()}`,
                  });
                }, 500);
                
                // Remove job from active jobs
                setJobIds(prev => prev.filter(id => id !== jobId));
                
                // Clean up file job mapping
                setFileJobMapping(prev => {
                  const newMapping = { ...prev };
                  delete newMapping[index];
                  return newMapping;
                });
              },
              onError: (error) => {
                console.error(`Job ${jobId} failed:`, error);
                
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
                  title: "Conversion failed",
                  description: error,
                  variant: "destructive"
                });
                
                // Remove job from active jobs
                setJobIds(prev => prev.filter(id => id !== jobId));
              }
            }).catch(error => {
              console.error('Polling error:', error);
            });
          }
        } catch (error: any) {
          console.error(`Failed to convert file ${i+1}/${filesToConvert.length}:`, error);
          
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
            
            // Do not mark files as processed if they hit the rate limit
            convertedResults[index] = null;
            
            // Stop processing more files if we hit a rate limit
            break;
          } else {
            // For other errors, just continue to the next file
            toast({
              title: `Failed to convert file ${i+1}/${filesToConvert.length}`,
              description: error.message || "An unexpected error occurred",
              variant: "destructive"
            });
            
            // Mark the file as failed
            convertedResults[index] = null;
          }
          
          // Continue with other files instead of stopping the whole batch
          continue;
        }
      }
      
      // Update results for direct processing (this is handled by showResultsAfterProgress now)
      // setResults(convertedResults);
      
      // Only show success toast if we're not waiting for background jobs
      // (Individual success toasts are now shown after progress completes)
      
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Clean up all progress states on major error
      setVisualProgress({});
      setProcessingFiles(new Set());
      setFileJobMapping({});
      
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      // Only set loading to false if we're not waiting for background jobs
      if (jobIds.length === 0) {
        setIsLoading(false);
      }
    }
  }
  
  const handleDownloadArchive = async () => {
    if (results.filter(r => r).length === 0) {
      toast({
        title: "No converted images",
        description: "Please convert at least one image first",
        variant: "destructive"
      });
      return;
    }
    
    setIsArchiveLoading(true);
    
    try {
      // Get all file IDs that have been converted
      const fileIds = results
        .map((result, index) => result ? { 
          filename: result.resultFilename, 
          originalName: result.newFilename 
        } : null)
        .filter(item => item !== null);
      
      // Use makeApiRequestWithRateLimitTracking instead of makeRequest
      const result = await makeApiRequestWithRateLimitTracking<{status: string, data: {downloadUrl: string}}>('images/archive', {
        method: 'POST',
        body: { files: fileIds },
      });
      
      // Use consistent API URL approach
      const baseUrl = getApiUrl().replace('/api', ''); // Remove '/api' as it's included in the downloadUrl
      window.location.href = `${baseUrl}${result.data.downloadUrl}`;
      
      toast({
        title: "Archive created",
        description: "Your converted images are being downloaded as a ZIP file"
      });
    } catch (error: any) {
      console.error('Archive error:', error);
      
      // Special handling for rate limit errors
      if (error.status === 429) {
        toast({
          title: "Rate Limit Reached",
          description: "You've reached your limit for batch operations. It will reset after some time.",
          variant: "destructive",
          duration: 5000 // Make it display longer
        });
      } else {
        toast({
          title: "Archive creation failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsArchiveLoading(false);
    }
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader 
        title="Image Converter" 
        description="Convert your images between different formats while maintaining quality."
        icon={<Repeat className="h-6 w-6" />}
      />
      
      <div className="grid gap-8 mt-8">
        {/* File selection area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Dropzone and file list */}
          <div className="flex-1">
            <div className="space-y-4">
              <ImageDropzone 
                onImageDrop={handleImageDrop} 
                existingFiles={files.length}
                shouldClear={shouldClearDropzone}
                onClearComplete={handleDropzoneClearComplete}
              />
              
              {/* Rate Limit Indicator */}
              <RateLimitIndicator 
                usage={rateLimitUsage.used} 
                limit={rateLimitUsage.limit} 
                resetsIn={rateLimitUsage.resetsIn}
                isLimitReached={rateLimitUsage.isLimitReached}
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
                              {results[index] ? (
                                <span>{results[index].originalFormat.toUpperCase()} → {results[index].convertedFormat.toUpperCase()}</span>
                              ) : (
                                <span>Format: {getFileExtension(file.name).toUpperCase()}</span>
                              )}
                              {/* Show appropriate badge based on processing state */}
                              {results[index] ? (
                                <Badge className="ml-2 bg-green-600" variant="secondary">
                                  Converted
                                </Badge>
                              ) : (
                                jobIds.includes(index.toString()) && (
                                  <Badge className="ml-2 bg-yellow-600" variant="secondary">
                                    Processing {jobProgress[index.toString()] ? `${Math.round(jobProgress[index.toString()])}%` : ''}
                                  </Badge>
                                )
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
                    <p><span className="font-medium">Current Format:</span> {getFileExtension(files[selectedFileIndex].name).toUpperCase()}</p>
                    
                    {results[selectedFileIndex] && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="font-medium text-green-600">Conversion Results:</p>
                        <p>New format: {results[selectedFileIndex].convertedFormat.toUpperCase()}</p>
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
                    <Repeat className="h-10 w-10 mx-auto mb-2 opacity-30" />
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
        
        {/* Convert settings and actions */}
        <Card className="p-6">
          <Tabs defaultValue="single" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Conversion Settings</h3>
              
              <div className="flex items-center gap-3">
                {processingMode === 'queued' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Server className="h-3 w-3" /> Queue mode
                  </span>
                )}
                <TabsList>
                  <TabsTrigger value="single" disabled={files.length === 0}>Single Image</TabsTrigger>
                  <TabsTrigger value="batch" disabled={files.length < 2}>Batch Convert</TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="grid gap-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Format</label>
                <Select 
                  value={targetFormat} 
                  onValueChange={setTargetFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentFormat() !== 'webp' && (
                      <SelectItem value="webp">WebP (Best overall)</SelectItem>
                    )}
                    {getCurrentFormat() !== 'jpg' && (
                      <SelectItem value="jpg">JPEG (Photos)</SelectItem>
                    )}
                    {getCurrentFormat() !== 'png' && (
                      <SelectItem value="png">PNG (Transparency)</SelectItem>
                    )}
                    {getCurrentFormat() !== 'avif' && (
                      <SelectItem value="avif">AVIF (Smallest size)</SelectItem>
                    )}
                    {getCurrentFormat() !== 'tiff' && (
                      <SelectItem value="tiff">TIFF (Print quality)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {targetFormat === 'webp' && "WebP offers excellent compression and quality balance, supports transparency, and works on most modern browsers."}
                  {targetFormat === 'jpg' && "JPEG is best for photographs and has universal support, but doesn't support transparency."}
                  {targetFormat === 'png' && "PNG supports transparency and lossless compression, ideal for graphics and screenshots."}
                  {targetFormat === 'avif' && "AVIF provides the smallest file sizes with high quality, but has limited compatibility with older browsers."}
                  {targetFormat === 'tiff' && "TIFF offers the highest quality for printing and professional editing, but creates larger files."}
                </p>
                {(getCurrentFormat() === 'heic' || getCurrentFormat() === 'heif') && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-medium">HEIC/HEIF Detected</p>
                    <p>HEIC/HEIF files are automatically converted to JPEG before processing. Original files remain unchanged.</p>
                  </div>
                )}
              </div>
              
              {/* Format Comparison */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <h4 className="font-medium mb-2">Best For</h4>
                  <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                    {targetFormat === 'webp' && (
                      <>
                        <li>Web images</li>
                        <li>Photos with transparency</li>
                        <li>Balancing quality and size</li>
                      </>
                    )}
                    {targetFormat === 'jpg' && (
                      <>
                        <li>Photographs</li>
                        <li>Complex images</li>
                        <li>Universal support</li>
                      </>
                    )}
                    {targetFormat === 'png' && (
                      <>
                        <li>Graphics with transparency</li>
                        <li>Screenshots</li>
                        <li>Logos and icons</li>
                      </>
                    )}
                    {targetFormat === 'avif' && (
                      <>
                        <li>Modern websites</li>
                        <li>Maximum compression</li>
                        <li>High-quality photos</li>
                      </>
                    )}
                    {targetFormat === 'tiff' && (
                      <>
                        <li>Print materials</li>
                        <li>Professional editing</li>
                        <li>Archival purposes</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Limitations</h4>
                  <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                    {targetFormat === 'webp' && (
                      <>
                        <li>Limited support in older browsers</li>
                        <li>Some quality loss compared to PNG</li>
                      </>
                    )}
                    {targetFormat === 'jpg' && (
                      <>
                        <li>No transparency support</li>
                        <li>Lossy compression</li>
                        <li>Not ideal for text or graphics</li>
                      </>
                    )}
                    {targetFormat === 'png' && (
                      <>
                        <li>Larger file sizes</li>
                        <li>Not ideal for photographs</li>
                      </>
                    )}
                    {targetFormat === 'avif' && (
                      <>
                        <li>Limited browser support</li>
                        <li>Slower encoding</li>
                        <li>Not widely supported in software</li>
                      </>
                    )}
                    {targetFormat === 'tiff' && (
                      <>
                        <li>Very large file sizes</li>
                        <li>Not supported by web browsers</li>
                        <li>Limited compatibility</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            <TabsContent value="single" className="space-y-4 mt-4">
              {/* Visual Progress Bar for Single Image */}
              {selectedFileIndex !== null && processingFiles.has(selectedFileIndex) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Converting image...</span>
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
                onClick={handleConvertSingle}
                disabled={isLoading || selectedFileIndex === null || (selectedFileIndex !== null && results[selectedFileIndex])}
                variant="default"
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
                    <Repeat className="mr-2 h-4 w-4" /> Convert Selected Image
                  </>
                )}
              </Button>
              
              {/* Show message if already processed */}
              {selectedFileIndex !== null && results[selectedFileIndex] && !isLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Image already converted and ready for download.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 mt-4">
              {/* Visual Progress Bar for Batch Processing */}
              {processingFiles.size > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Converting {processingFiles.size} image{processingFiles.size > 1 ? 's' : ''}...
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
                onClick={handleConvertAll}
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
                    <Repeat className="mr-2 h-4 w-4" /> Convert All Images
                  </>
                )}
              </Button>
              
              {/* Show message if all files are already processed */}
              {files.length > 0 && files.every((_, index) => results[index]) && !isLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    All images already converted and ready for download.
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating archive...
                    </span>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Download All as ZIP
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