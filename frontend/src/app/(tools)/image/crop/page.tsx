'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ToolHeader } from '@/components/tools/ToolHeader'
import { useSeo } from '@/hooks/useSeo'
import { Button } from '@/components/ui/button'
import { Crop, Download, X, Trash2, MoveHorizontal, MoveVertical, ArrowDownSquare } from 'lucide-react'
import ImageDropzone from '@/components/tools/ImageDropzone'
import { useToast } from '@/components/ui/use-toast'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { processHeicFiles } from '@/lib/heicConverter'
import { useRateLimit } from '@/lib/hooks/useRateLimit'
import { getApiUrl } from '@/lib/apiClient'
import { pollJobStatus } from '@/lib/api/statusApi'

// Define response types for API calls
interface CropResponse {
  status: string;
  data: {
    width: number;
    height: number;
    mime: string;
    filename: string;
    originalFilename: string;
    downloadUrl: string;
  } | {
    jobId: string;
    statusUrl: string;
  };
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

export default function CropTool() {
  // Load SEO data for image crop tool
  const { seoData, loading: seoLoading } = useSeo('/image/crop')
  
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null)
  const [crop, setCrop] = useState<CropType>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number}>({ width: 0, height: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [jobIds, setJobIds] = useState<string[]>([])
  const [jobProgress, setJobProgress] = useState<Record<string, number>>({})
  const { toast } = useToast()
  
  // Add rate limit tracking
  const { makeRequest } = useRateLimit();
  
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
  
  const imgRef = useRef<HTMLImageElement>(null)
  
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
  
  // Get dimensions of the selected image
  useEffect(() => {
    if (selectedFileIndex !== null && files[selectedFileIndex]) {
      const img = new Image()
      img.onload = () => {
        const imgWidth = img.width
        const imgHeight = img.height
        
        setOriginalDimensions({ width: imgWidth, height: imgHeight })
        
        // Reset crop when selecting a new image
        setCrop({
          unit: 'px',
          x: 0,
          y: 0,
          width: 0,
          height: 0
        })
        setCompletedCrop(null)
      }
      img.src = previews[selectedFileIndex]
    }
  }, [selectedFileIndex, files, previews])
  
  // Update the apiRequest call to capture rate limit headers
  const makeApiRequestWithRateLimitTracking = async <T,>(endpoint: string, options: any): Promise<T> => {
    try {
      // Make the actual API request
      const result = await makeRequest<T>(endpoint, options);
      
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
    // Also remove from results if it was already processed
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
  
  // Add this helper function for more reliable coordinate conversion
  const convertToPixelCrop = (crop: CropType, imageWidth: number, imageHeight: number): PixelCrop => {
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    
    if (crop.unit === '%') {
      // Convert from percentage to pixels
      pixelCrop.x = Math.round((crop.x / 100) * imageWidth);
      pixelCrop.y = Math.round((crop.y / 100) * imageHeight);
      pixelCrop.width = Math.round((crop.width / 100) * imageWidth);
      pixelCrop.height = Math.round((crop.height / 100) * imageHeight);
    } else {
      // Already in pixels, just round values
      pixelCrop.x = Math.round(crop.x);
      pixelCrop.y = Math.round(crop.y);
      pixelCrop.width = Math.round(crop.width);
      pixelCrop.height = Math.round(crop.height);
    }
    
    return pixelCrop;
  };
  
  // Function to attempt crop with retry
  const attemptCrop = async (cropParams: any, retryCount = 0): Promise<any> => {
    const { x, y, width, height } = cropParams;
    
    // Make sure we have a valid file
    if (selectedFileIndex === null || !files[selectedFileIndex]) {
      throw new Error("No file selected");
    }
    
    const file = files[selectedFileIndex];
    const imageWidth = originalDimensions.width;
    const imageHeight = originalDimensions.height;
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('left', x.toString());
    formData.append('top', y.toString());
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    
    console.log(`Crop attempt ${retryCount + 1}:`, cropParams);
    
    try {
      // Use makeApiRequestWithRateLimitTracking instead of makeRequest
      const result = await makeApiRequestWithRateLimitTracking<CropResponse>('images/crop', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      
      // If this is a queued job, handle it appropriately
      if (result.status === 'processing' && 'jobId' in result.data) {
        const jobId = result.data.jobId;
        setJobIds(prev => [...prev, jobId]);
        
        // Start polling this job and return a promise that resolves when complete
        return new Promise((resolve, reject) => {
          pollJobStatus(jobId, 'crop', {
            intervalMs: 1000,
            onProgress: (progress) => {
              setJobProgress(prev => ({
                ...prev,
                [jobId]: progress
              }));
            },
            onComplete: (jobResult) => {
              // Remove job from active jobs
              setJobIds(prev => prev.filter(id => id !== jobId));
              resolve({
                status: 'success',
                data: jobResult
              });
            },
            onError: (error) => {
              console.error(`Job ${jobId} failed:`, error);
              setJobIds(prev => prev.filter(id => id !== jobId));
              reject(new Error(error));
            }
          }).catch(reject);
        });
      }
      
      // Direct processing result
      return result;
    } catch (error: any) {
      console.error('Crop error:', error);
      
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
        
        throw error; // Let the caller handle the rate limit error
      }
      
      // If we've reached max retries, throw the error
      if (retryCount >= 2) {
        throw error;
      }
      
      // Otherwise, try with a more conservative crop area
      // Reduce crop size by 10% and adjust position to remain within image bounds
      const newWidth = Math.floor(width * 0.9);
      const newHeight = Math.floor(height * 0.9);
      const newX = Math.min(x + Math.floor((width - newWidth) / 2), imageWidth - newWidth);
      const newY = Math.min(y + Math.floor((height - newHeight) / 2), imageHeight - newHeight);
      
      // Retry with adjusted coordinates
      return attemptCrop({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: newWidth,
        height: newHeight
      }, retryCount + 1);
    }
  };
  
  const handleCrop = async () => {
    if (selectedFileIndex === null) {
      toast({
        title: "No file selected",
        description: "Please select an image to crop",
        variant: "destructive"
      })
      return
    }
    
    if (!completedCrop) {
      toast({
        title: "No crop area selected",
        description: "Please select an area to crop",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    const croppedResults = [...results]
    
    try {
      const file = files[selectedFileIndex];
      
      // Get the original image dimensions
      const imageWidth = originalDimensions.width;
      const imageHeight = originalDimensions.height;
      
      // Calculate scaling factor between displayed image and original dimensions
      const imageElement = imgRef.current
      if (!imageElement) {
        throw new Error("Image reference not available")
      }
      
      // Convert to pixel crop if we have percentage
      let pixelCrop: PixelCrop;
      if (completedCrop.unit !== 'px') {
        pixelCrop = convertToPixelCrop(completedCrop, imageElement.width, imageElement.height);
      } else {
        pixelCrop = completedCrop;
      }
      
      // Calculate scaling ratio between displayed image and original
      const scaleX = imageWidth / imageElement.width;
      const scaleY = imageHeight / imageElement.height;
      
      // Scale the crop coordinates to match the original image dimensions
      const scaledCrop = {
        x: Math.round(pixelCrop.x * scaleX),
        y: Math.round(pixelCrop.y * scaleY),
        width: Math.round(pixelCrop.width * scaleX),
        height: Math.round(pixelCrop.height * scaleY)
      };
      
      // Validate crop coordinates are within image bounds
      if (scaledCrop.x < 0) scaledCrop.x = 0;
      if (scaledCrop.y < 0) scaledCrop.y = 0;
      if (scaledCrop.width <= 0) scaledCrop.width = 1;
      if (scaledCrop.height <= 0) scaledCrop.height = 1;
      if (scaledCrop.x + scaledCrop.width > imageWidth) {
        scaledCrop.width = imageWidth - scaledCrop.x;
      }
      if (scaledCrop.y + scaledCrop.height > imageHeight) {
        scaledCrop.height = imageHeight - scaledCrop.y;
      }
      
      console.log('Image element size:', imageElement.width, 'x', imageElement.height);
      console.log('Original dimensions:', imageWidth, 'x', imageHeight);
      console.log('Original crop:', completedCrop);
      console.log('Pixel crop:', pixelCrop);
      console.log('Scale factors:', scaleX, scaleY);
      console.log('Scaled crop:', scaledCrop);
      
      // Process the crop with retry mechanism
      try {
        const result = await attemptCrop(scaledCrop);
        
        // Update or add result
        croppedResults[selectedFileIndex] = {
          filename: file.name,
          originalWidth: originalDimensions.width,
          originalHeight: originalDimensions.height,
          croppedWidth: result.data.width,
          croppedHeight: result.data.height,
          mime: result.data.mime,
          resultFilename: result.data.filename,
          downloadUrl: result.data.downloadUrl || `/api/images/download/${result.data.filename}?originalFilename=${encodeURIComponent(file.name)}`
        };
        
        setResults(croppedResults);
        toast({
          title: "Crop successful",
          description: `Cropped image to ${result.data.width} × ${result.data.height} pixels`,
        });
      } catch (error: any) {
        console.error('Crop failed:', error);
        
        // Special handling for rate limit errors
        if (error.status === 429) {
          // Rate limit toast is already shown in attemptCrop
          // Set the result to null to indicate it wasn't processed
          croppedResults[selectedFileIndex] = null;
        } else {
          toast({
            title: "Crop failed",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive"
          });
        }
        
        // Update results even if there was an error
        setResults(croppedResults);
      }
    } catch (error) {
      console.error('Crop error:', error);
      toast({
        title: "Crop failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader 
        title="Image Cropper" 
        description="Crop your images with precision by selecting the exact area you want to keep."
        icon={<Crop className="h-6 w-6" />}
      />
      
      <div className="grid gap-8 mt-8">
        {/* File selection area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Dropzone and file list */}
          <div className="flex-1">
            <div className="space-y-4">
              <ImageDropzone onImageDrop={handleImageDrop} existingFiles={files.length} />
              
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
                                <span>{results[index].originalWidth}×{results[index].originalHeight} → {results[index].croppedWidth}×{results[index].croppedHeight}</span>
                              ) : (
                                <span>Dimensions will appear here</span>
                              )}
                              {/* Show appropriate badge based on processing state */}
                              {results[index] ? (
                                <Badge className="ml-2 bg-green-600" variant="secondary">
                                  Cropped
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
        </div>
        
        {/* Crop Area */}
        {selectedFileIndex !== null && (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Crop Image</h3>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image preview with crop */}
              <div className="flex-grow flex flex-col items-center bg-accent/10 rounded-lg p-4 overflow-hidden">
                {previews[selectedFileIndex] && (
                  <ReactCrop
                    crop={crop}
                    onChange={(c: CropType) => setCrop(c)}
                    onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                    aspect={undefined}
                    circularCrop={false}
                  >
                    <img
                      ref={imgRef}
                      src={previews[selectedFileIndex]}
                      alt={files[selectedFileIndex].name}
                      style={{ maxHeight: '500px', maxWidth: '100%' }}
                      onLoad={(e) => {
                        // Once the image is loaded, update the originalDimensions with natural dimensions
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setOriginalDimensions({
                            width: img.naturalWidth,
                            height: img.naturalHeight
                          });
                        }
                      }}
                    />
                  </ReactCrop>
                )}
                
                <div className="w-full mt-4 text-sm text-center text-muted-foreground">
                  <p>Click and drag on the image to select the area you want to crop.</p>
                </div>
              </div>
              
              {/* Crop controls */}
              <div className="w-full lg:w-72 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crop-x">X Position</Label>
                    <Input
                      id="crop-x"
                      type="number"
                      min="0"
                      max={originalDimensions.width - (completedCrop?.width || 0)}
                      value={Math.round(completedCrop?.x || 0)}
                      onChange={(e) => {
                        const x = parseInt(e.target.value) || 0
                        setCrop((prev: CropType) => ({ ...prev, x }))
                        setCompletedCrop((prev: PixelCrop | null) => prev ? { ...prev, x } : null)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-y">Y Position</Label>
                    <Input
                      id="crop-y"
                      type="number"
                      min="0"
                      max={originalDimensions.height - (completedCrop?.height || 0)}
                      value={Math.round(completedCrop?.y || 0)}
                      onChange={(e) => {
                        const y = parseInt(e.target.value) || 0
                        setCrop((prev: CropType) => ({ ...prev, y }))
                        setCompletedCrop((prev: PixelCrop | null) => prev ? { ...prev, y } : null)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-width">Width (px)</Label>
                    <Input
                      id="crop-width"
                      type="number"
                      min="1"
                      max={originalDimensions.width}
                      value={Math.round(completedCrop?.width || 0)}
                      onChange={(e) => {
                        const width = parseInt(e.target.value) || 0
                        setCrop((prev: CropType) => ({ ...prev, width }))
                        setCompletedCrop((prev: PixelCrop | null) => prev ? { ...prev, width } : null)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-height">Height (px)</Label>
                    <Input
                      id="crop-height"
                      type="number"
                      min="1"
                      max={originalDimensions.height}
                      value={Math.round(completedCrop?.height || 0)}
                      onChange={(e) => {
                        const height = parseInt(e.target.value) || 0
                        setCrop((prev: CropType) => ({ ...prev, height }))
                        setCompletedCrop((prev: PixelCrop | null) => prev ? { ...prev, height } : null)
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  {/* Info box */}
                  <div className="bg-accent/20 rounded p-3 text-sm">
                    <p><strong>Original Size:</strong> {originalDimensions.width} × {originalDimensions.height} px</p>
                    {completedCrop && (
                      <>
                        <p><strong>Crop Size:</strong> {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px</p>
                        <p><strong>Position:</strong> X: {Math.round(completedCrop.x)}, Y: {Math.round(completedCrop.y)}</p>
                      </>
                    )}
                  </div>
                  
                  {results[selectedFileIndex] && (
                    <div className="border-t pt-4">
                      <p className="font-medium text-green-600 mb-2">Crop Results:</p>
                      <p>New dimensions: {results[selectedFileIndex].croppedWidth} × {results[selectedFileIndex].croppedHeight} px</p>
                      <a 
                        href={`${getApiUrl().replace('/api', '')}${results[selectedFileIndex].downloadUrl}`}
                        className="mt-2 inline-flex items-center px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                      >
                        <Download className="h-3 w-3 mr-1" /> Download
                      </a>
                    </div>
                  )}
                  
                  {/* Show progress for background jobs */}
                  {selectedFileIndex !== null &&
                    !results[selectedFileIndex] &&
                    jobIds.includes(selectedFileIndex.toString()) && (
                    <div className="border-t pt-4">
                      <p className="font-medium text-yellow-600 mb-2">Processing Image...</p>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-2">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-300"
                          style={{ width: `${jobProgress[selectedFileIndex.toString()] || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {jobProgress[selectedFileIndex.toString()]
                           ? `${Math.round(jobProgress[selectedFileIndex.toString()])}% complete`
                           : 'Starting process...'}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleCrop}
                    disabled={isLoading || !completedCrop || !completedCrop.width || !completedCrop.height}
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
                        <ArrowDownSquare className="mr-2 h-4 w-4" /> Crop Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Info message if no image is selected */}
        {selectedFileIndex === null && files.length > 0 && (
          <div className="text-center p-8 bg-accent/10 rounded-lg">
            <Crop className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-medium mb-2">Select an Image to Crop</h3>
            <p className="text-muted-foreground">Choose an image from the list above to start cropping.</p>
          </div>
        )}
        
        {/* Empty state */}
        {files.length === 0 && (
          <div className="text-center p-8 bg-accent/10 rounded-lg">
            <Crop className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-medium mb-2">No Images Uploaded</h3>
            <p className="text-muted-foreground">Upload an image using the dropzone above to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
} 