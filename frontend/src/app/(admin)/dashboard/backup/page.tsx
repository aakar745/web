'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  Clock,
  HardDrive,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  ArrowRight,
  Settings,
  Eye,
  PlayCircle,
  Sparkles,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { withAdminAuth } from '@/middleware/authCheck'
import { apiRequest } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Type definitions
interface BackupHistory {
  _id: string;
  filename: string;
  originalName: string;
  type: 'full' | 'incremental' | 'selective';
  collections: string[];
  size: number;
  status: 'creating' | 'completed' | 'failed' | 'deleted';
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  description?: string;
  errorMessage?: string;
  compression: boolean;
  encryption: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackupStatus {
  recentBackups: BackupHistory[];
  storage: {
    totalSize: string;
    totalFiles: number;
    directory: string;
  };
  lastBackup: BackupHistory | null;
}

interface RestorePreview {
  backupInfo: {
    type: string;
    timestamp: string;
    version: string;
  };
  collectionsToRestore: string[];
  totalDocuments: number;
  estimatedSize: string;
}

const AVAILABLE_COLLECTIONS = [
  'blogs',
  'users', 
  'comments',
  'media',
  'systemsettings',
  'scripts',
  'pageseo',
  'schedulerconfigs'
];

function BackupManagement() {
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [createBackupForm, setCreateBackupForm] = useState({
    type: 'full' as 'full' | 'incremental' | 'selective',
    collections: [] as string[],
    compress: true,
    description: ''
  })
  const [restoreForm, setRestoreForm] = useState({
    backupId: '',
    collections: [] as string[],
    overwrite: false,
    createSafetyBackup: true
  })
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  // Fetch backup data
  const fetchBackupData = async () => {
    try {
      setLoading(true)
      const [historyResponse, statusResponse] = await Promise.allSettled([
        apiRequest<{ status: string; data: { backups: BackupHistory[] } }>('/backup/history', { requireAuth: true }),
        apiRequest<{ status: string; data: BackupStatus }>('/backup/status', { requireAuth: true })
      ])

      if (historyResponse.status === 'fulfilled') {
        setBackupHistory(historyResponse.value.data.backups || [])
      }

      if (statusResponse.status === 'fulfilled') {
        setBackupStatus(statusResponse.value.data)
      }
    } catch (error) {
      console.error('Failed to fetch backup data:', error)
      toast({
        title: "Error",
        description: "Failed to load backup data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackupData()
  }, [])

  // Create backup
  const handleCreateBackup = async () => {
    try {
      setActiveOperation('creating')
      
      const response = await apiRequest<{ status: string; data: any }>('/backup/create', {
        method: 'POST',
        body: createBackupForm,
        requireAuth: true
      })

      if (response.status === 'success') {
        toast({
          title: "✨ Backup Created",
          description: `${createBackupForm.type} backup completed successfully!`,
        })
        
        // Reset form
        setCreateBackupForm({
          type: 'full',
          collections: [],
          compress: true,
          description: ''
        })
        
        // Refresh data
        fetchBackupData()
      }
    } catch (error) {
      console.error('Backup creation failed:', error)
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive"
      })
    } finally {
      setActiveOperation(null)
    }
  }

  // Delete backup
  const handleDeleteBackup = async (backupId: string) => {
    try {
      setActiveOperation(`deleting-${backupId}`)
      
      const response = await apiRequest<{ status: string }>(`/backup/${backupId}`, {
        method: 'DELETE',
        requireAuth: true
      })

      if (response.status === 'success') {
        toast({
          title: "🗑️ Backup Deleted",
          description: "Backup deleted successfully",
        })
        fetchBackupData()
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive"
      })
    } finally {
      setActiveOperation(null)
    }
  }

  // Download backup
  const handleDownloadBackup = async (backupId: string, filename: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${baseUrl}/backup/${backupId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "📥 Download Started",
          description: `Downloading ${filename}`,
        })
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Error",
        description: "Failed to download backup",
        variant: "destructive"
      })
    }
  }

  // Get restore preview
  const handleGetRestorePreview = async (backupId: string) => {
    try {
      const response = await apiRequest<{ status: string; data: RestorePreview }>(`/backup/restore/preview?backupId=${backupId}`, {
        requireAuth: true
      })

      if (response.status === 'success') {
        setRestorePreview(response.data)
      }
    } catch (error) {
      console.error('Preview failed:', error)
      toast({
        title: "Error",
        description: "Failed to generate restore preview",
        variant: "destructive"
      })
    }
  }

  // Restore from backup
  const handleRestoreBackup = async () => {
    try {
      setActiveOperation('restoring')
      
      const response = await apiRequest<{ status: string; data: any }>('/backup/restore', {
        method: 'POST',
        body: restoreForm,
        requireAuth: true
      })

      if (response.status === 'success') {
        toast({
          title: "🔄 Restore Completed",
          description: `Database restored successfully!`,
        })
        
        // Reset form
        setRestoreForm({
          backupId: '',
          collections: [],
          overwrite: false,
          createSafetyBackup: true
        })
        setRestorePreview(null)
      }
    } catch (error) {
      console.error('Restore failed:', error)
      toast({
        title: "Error",
        description: "Database restore failed",
        variant: "destructive"
      })
    } finally {
      setActiveOperation(null)
    }
  }

  // Upload and restore
  const handleUploadRestore = async () => {
    if (!uploadFile) return

    try {
      setActiveOperation('uploading')
      
      const formData = new FormData()
      formData.append('backup', uploadFile)
      formData.append('overwrite', restoreForm.overwrite.toString())
      formData.append('createSafetyBackup', restoreForm.createSafetyBackup.toString())
      if (restoreForm.collections.length > 0) {
        formData.append('collections', restoreForm.collections.join(','))
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${baseUrl}/backup/restore/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()

      if (result.status === 'success') {
        toast({
          title: "📤 Upload & Restore Completed",
          description: "Database restored from uploaded file!",
        })
        
        setUploadFile(null)
        setRestoreForm({
          backupId: '',
          collections: [],
          overwrite: false,
          createSafetyBackup: true
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Upload restore failed:', error)
      toast({
        title: "Error",
        description: "Upload and restore failed",
        variant: "destructive"
      })
    } finally {
      setActiveOperation(null)
    }
  }

  // Cleanup old backups
  const handleCleanupOldBackups = async () => {
    try {
      setActiveOperation('cleaning')
      
      const response = await apiRequest<{ status: string; data: { deletedCount: number } }>('/backup/cleanup', {
        method: 'POST',
        body: { retentionDays: 30 },
        requireAuth: true
      })

      if (response.status === 'success') {
        toast({
          title: "🧹 Cleanup Completed",
          description: `Removed ${response.data.deletedCount} old backups`,
        })
        fetchBackupData()
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      toast({
        title: "Error",
        description: "Cleanup failed",
        variant: "destructive"
      })
    } finally {
      setActiveOperation(null)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      completed: 'default',
      creating: 'secondary',
      failed: 'destructive',
      deleted: 'outline'
    }
    
    const icons = {
      completed: <CheckCircle className="w-3 h-3" />,
      creating: <RefreshCw className="w-3 h-3 animate-spin" />,
      failed: <XCircle className="w-3 h-3" />,
      deleted: <Trash2 className="w-3 h-3" />
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="gap-1">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return <BackupSkeleton />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
              Database Backup & Restore
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage database backups and restore operations safely
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchBackupData} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={handleCleanupOldBackups}
              variant="outline"
              size="sm"
              disabled={activeOperation === 'cleaning'}
            >
              {activeOperation === 'cleaning' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Cleanup
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status Overview */}
      {backupStatus && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-pink-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                <div className="text-2xl font-bold">{backupStatus.storage.totalSize}</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="w-4 h-4" />
                  {backupStatus.storage.totalFiles} files
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
                <div className="text-2xl font-bold">{backupHistory.length}</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="w-4 h-4" />
                  Active backups
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Backup</CardTitle>
                <div className="text-2xl font-bold">
                  {backupStatus.lastBackup ? formatDate(backupStatus.lastBackup.createdAt).split(',')[0] : 'None'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {backupStatus.lastBackup ? formatDate(backupStatus.lastBackup.createdAt).split(',')[1] : 'No backups yet'}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup">Create Backup</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Create Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Backup
                </CardTitle>
                <CardDescription>
                  Create a backup of your database collections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup Type */}
                  <div className="space-y-2">
                    <Label htmlFor="backup-type">Backup Type</Label>
                    <Select
                      value={createBackupForm.type}
                      onValueChange={(value: 'full' | 'incremental' | 'selective') => 
                        setCreateBackupForm(prev => ({ ...prev, type: value, collections: value === 'selective' ? prev.collections : [] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Full Backup - All collections
                          </div>
                        </SelectItem>
                        <SelectItem value="incremental">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Incremental - Only changes since last backup
                          </div>
                        </SelectItem>
                        <SelectItem value="selective">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Selective - Choose specific collections
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compression */}
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="compress"
                        checked={createBackupForm.compress}
                        onCheckedChange={(checked) => 
                          setCreateBackupForm(prev => ({ ...prev, compress: !!checked }))
                        }
                      />
                      <Label htmlFor="compress" className="text-sm">
                        Compress backup file (recommended)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Selective Collections */}
                {createBackupForm.type === 'selective' && (
                  <div className="space-y-2">
                    <Label>Select Collections to Backup</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {AVAILABLE_COLLECTIONS.map((collection) => (
                        <div key={collection} className="flex items-center space-x-2">
                          <Checkbox
                            id={collection}
                            checked={createBackupForm.collections.includes(collection)}
                            onCheckedChange={(checked) => {
                              setCreateBackupForm(prev => ({
                                ...prev,
                                collections: checked
                                  ? [...prev.collections, collection]
                                  : prev.collections.filter(c => c !== collection)
                              }))
                            }}
                          />
                          <Label htmlFor={collection} className="text-sm">
                            {collection}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a description for this backup..."
                    value={createBackupForm.description}
                    onChange={(e) => setCreateBackupForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateBackup}
                  disabled={
                    activeOperation === 'creating' || 
                    (createBackupForm.type === 'selective' && createBackupForm.collections.length === 0)
                  }
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 hover:from-pink-600 hover:via-purple-600 hover:to-violet-600"
                >
                  {activeOperation === 'creating' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restore Tab */}
          <TabsContent value="restore" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Restore from Existing Backup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Restore from Backup
                  </CardTitle>
                  <CardDescription>
                    Select an existing backup to restore
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Backup</Label>
                    <Select
                      value={restoreForm.backupId}
                      onValueChange={(value) => {
                        setRestoreForm(prev => ({ ...prev, backupId: value }))
                        if (value) {
                          handleGetRestorePreview(value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a backup..." />
                      </SelectTrigger>
                      <SelectContent>
                        {backupHistory.filter(b => b.status === 'completed').map((backup) => (
                          <SelectItem key={backup._id} value={backup._id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate">
                                {backup.originalName} ({backup.type})
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatDate(backup.createdAt).split(',')[0]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Restore Preview */}
                  {restorePreview && (
                    <Alert>
                      <Eye className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div><strong>Type:</strong> {restorePreview.backupInfo.type}</div>
                          <div><strong>Collections:</strong> {restorePreview.collectionsToRestore.length}</div>
                          <div><strong>Documents:</strong> {restorePreview.totalDocuments.toLocaleString()}</div>
                          <div><strong>Size:</strong> {restorePreview.estimatedSize}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Restore Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overwrite"
                        checked={restoreForm.overwrite}
                        onCheckedChange={(checked) => 
                          setRestoreForm(prev => ({ ...prev, overwrite: !!checked }))
                        }
                      />
                      <Label htmlFor="overwrite" className="text-sm">
                        Overwrite existing data (destructive)
                      </Label>
                    </div>
                    
                    {restoreForm.overwrite && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="safety"
                          checked={restoreForm.createSafetyBackup}
                          onCheckedChange={(checked) => 
                            setRestoreForm(prev => ({ ...prev, createSafetyBackup: !!checked }))
                          }
                        />
                        <Label htmlFor="safety" className="text-sm">
                          Create safety backup before restore (recommended)
                        </Label>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleRestoreBackup}
                    disabled={!restoreForm.backupId || activeOperation === 'restoring'}
                    variant={restoreForm.overwrite ? "destructive" : "default"}
                    className="w-full"
                  >
                    {activeOperation === 'restoring' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Restore Database
                      </>
                    )}
                  </Button>

                  {restoreForm.overwrite && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> This will overwrite existing data. Make sure you have a recent backup!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Upload and Restore */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload & Restore
                  </CardTitle>
                  <CardDescription>
                    Upload a backup file and restore from it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Backup File</Label>
                    <Input
                      type="file"
                      accept=".json,.zip"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    {uploadFile && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </div>
                    )}
                  </div>

                  {/* Upload Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="upload-overwrite"
                        checked={restoreForm.overwrite}
                        onCheckedChange={(checked) => 
                          setRestoreForm(prev => ({ ...prev, overwrite: !!checked }))
                        }
                      />
                      <Label htmlFor="upload-overwrite" className="text-sm">
                        Overwrite existing data
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="upload-safety"
                        checked={restoreForm.createSafetyBackup}
                        onCheckedChange={(checked) => 
                          setRestoreForm(prev => ({ ...prev, createSafetyBackup: !!checked }))
                        }
                      />
                      <Label htmlFor="upload-safety" className="text-sm">
                        Create safety backup before restore
                      </Label>
                    </div>
                  </div>

                  <Button
                    onClick={handleUploadRestore}
                    disabled={!uploadFile || activeOperation === 'uploading'}
                    variant={restoreForm.overwrite ? "destructive" : "default"}
                    className="w-full"
                  >
                    {activeOperation === 'uploading' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading & Restoring...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Restore
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Backup History
                </CardTitle>
                <CardDescription>
                  View and manage your backup files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No backups found</p>
                      <p className="text-sm">Create your first backup to get started</p>
                    </div>
                  ) : (
                    backupHistory.map((backup) => (
                      <div
                        key={backup._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{backup.originalName}</span>
                            {getStatusBadge(backup.status)}
                            <Badge variant="outline" className="text-xs">
                              {backup.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>
                              Created: {formatDate(backup.createdAt)} by {backup.createdBy}
                            </div>
                            <div>
                              Size: {formatFileSize(backup.size)} • 
                              Collections: {backup.collections.join(', ')} •
                              {backup.compression && ' Compressed'}
                            </div>
                            {backup.description && (
                              <div className="italic">{backup.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {backup.status === 'completed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadBackup(backup._id, backup.filename)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRestoreForm(prev => ({ ...prev, backupId: backup._id }))
                                  handleGetRestorePreview(backup._id)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup._id)}
                            disabled={activeOperation === `deleting-${backup._id}`}
                          >
                            {activeOperation === `deleting-${backup._id}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

function BackupSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default withAdminAuth(BackupManagement) 