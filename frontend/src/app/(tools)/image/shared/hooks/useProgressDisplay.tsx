import React from 'react'
import { QueueStatusIndicator } from '@/components/ui/QueueStatusIndicator'

interface BackgroundJobProgressProps {
  selectedFileIndex: number | null
  results: any[]
  fileJobMapping: Record<number, string>
  jobProgress: Record<string, number>
  queueStatus: Record<string, any>
}

interface VisualProgressProps {
  selectedFileIndex: number | null
  processingFiles: Set<number>
  visualProgress: Record<number, number>
  actionText: string
}

interface BatchProgressProps {
  processingFiles: Set<number>
  visualProgress: Record<number, number>
  files: File[]
  actionText: string
}

export function useProgressDisplay() {
  const renderBackgroundJobProgress = ({
    selectedFileIndex,
    results,
    fileJobMapping,
    jobProgress,
    queueStatus
  }: BackgroundJobProgressProps) => {
    if (selectedFileIndex === null || 
        results[selectedFileIndex] || 
        !fileJobMapping[selectedFileIndex]) {
      return null
    }

    return (
      <div className="mt-3 pt-3 border-t">
        <p className="font-medium text-yellow-600 mb-2">Processing Image...</p>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mb-2">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${jobProgress[fileJobMapping[selectedFileIndex]] || 0}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-2">
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
    )
  }

  const renderVisualProgress = ({
    selectedFileIndex,
    processingFiles,
    visualProgress,
    actionText
  }: VisualProgressProps) => {
    if (selectedFileIndex === null || !processingFiles.has(selectedFileIndex)) {
      return null
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{actionText}...</span>
          <span className="font-medium">{visualProgress[selectedFileIndex] || 0}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${visualProgress[selectedFileIndex] || 0}%` }}
          />
        </div>
      </div>
    )
  }

  const renderBatchProgress = ({
    processingFiles,
    visualProgress,
    files,
    actionText
  }: BatchProgressProps) => {
    if (processingFiles.size <= 1) {
      return null
    }

    const averageProgress = Object.keys(visualProgress).length > 0 
      ? Math.round(Object.values(visualProgress).reduce((a, b) => a + b, 0) / Object.values(visualProgress).length)
      : 0

    return (
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {actionText} {processingFiles.size} images...
          </span>
          <span className="font-medium">{averageProgress}%</span>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Array.from(processingFiles).map(fileIndex => (
            <div key={fileIndex} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate text-muted-foreground flex-1 mr-2" title={files[fileIndex]?.name}>
                  {files[fileIndex]?.name || `File ${fileIndex + 1}`}
                </span>
                <span className="font-medium flex-shrink-0">{visualProgress[fileIndex] || 0}%</span>
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
    )
  }

  return {
    renderBackgroundJobProgress,
    renderVisualProgress,
    renderBatchProgress
  }
} 