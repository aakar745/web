import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import BackupHistory, { IBackupHistory } from '../models/BackupHistory';
import logger from '../utils/logger';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';

// Import all models for restore
import Blog from '../models/Blog';
import User from '../models/User';
import Comment from '../models/Comment';
import Media from '../models/Media';
import SystemSettings from '../models/SystemSettings';
import Script from '../models/Script';
import PageSeo from '../models/PageSeo';
import SchedulerConfig from '../models/SchedulerConfig';

interface RestoreOptions {
  backupId?: string;
  backupFilePath?: string;
  collections?: string[];
  overwrite: boolean;
  createdBy: string;
}

interface RestoreResult {
  success: boolean;
  message: string;
  restoredCollections?: string[];
  skippedCollections?: string[];
  error?: string;
  details?: any;
}

interface BackupData {
  metadata: {
    version: string;
    type: string;
    timestamp: string;
    collections: string[];
    totalCollections: number;
  };
  data: {
    [collectionName: string]: {
      count: number;
      documents: any[];
      error?: string;
    };
  };
}

export class RestoreService {
  
  /**
   * Get mongoose model by collection name
   */
  private getModelByCollection(collectionName: string): mongoose.Model<any> {
    const modelMap: { [key: string]: mongoose.Model<any> } = {
      'blogs': Blog,
      'users': User,
      'comments': Comment,
      'media': Media,
      'systemsettings': SystemSettings,
      'scripts': Script,
      'pageseo': PageSeo,
      'schedulerconfigs': SchedulerConfig,
      'backuphistory': BackupHistory
    };
    
    const model = modelMap[collectionName];
    if (!model) {
      throw new Error(`Unknown collection: ${collectionName}`);
    }
    
    return model;
  }
  
  /**
   * Extract ZIP file and return the JSON content
   */
  private async extractBackupFile(filePath: string): Promise<string> {
    if (filePath.endsWith('.zip')) {
      logger.info('Extracting ZIP backup file', { filePath });
      
      // Create a temporary directory for extraction
      const tempDir = path.join(__dirname, '../../temp', `extract_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      try {
        // For Windows, try using PowerShell to extract ZIP
        if (process.platform === 'win32') {
          const extractCommand = `powershell -command "Expand-Archive -Path '${filePath}' -DestinationPath '${tempDir}' -Force"`;
          execSync(extractCommand);
        } else {
          // For Unix systems, use unzip command
          execSync(`unzip -o "${filePath}" -d "${tempDir}"`);
        }
        
        // Find the JSON file in the extracted directory
        const files = await fs.readdir(tempDir);
        const jsonFile = files.find(f => f.endsWith('.json'));
        
        if (!jsonFile) {
          throw new Error('No JSON file found in backup ZIP');
        }
        
        const jsonPath = path.join(tempDir, jsonFile);
        const content = await fs.readFile(jsonPath, 'utf8');
        
        // Cleanup temp directory
        await fs.rm(tempDir, { recursive: true, force: true });
        
        logger.info('ZIP extraction successful', { originalFile: filePath, jsonFile });
        return content;
        
      } catch (error) {
        // Cleanup temp directory on error
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {}
        throw error;
      }
    } else {
      // Read JSON file directly
      return await fs.readFile(filePath, 'utf8');
    }
  }

  /**
   * Validate backup file format and structure
   */
  private async validateBackupFile(filePath: string): Promise<BackupData> {
    try {
      const fileContent = await this.extractBackupFile(filePath);
      const backupData: BackupData = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file structure: missing metadata or data');
      }
      
      if (!backupData.metadata.version || !backupData.metadata.type) {
        throw new Error('Invalid backup file: missing version or type in metadata');
      }
      
      if (!backupData.metadata.collections || !Array.isArray(backupData.metadata.collections)) {
        throw new Error('Invalid backup file: missing or invalid collections list');
      }
      
      // Validate each collection data
      for (const collectionName of backupData.metadata.collections) {
        if (!backupData.data[collectionName]) {
          logger.warn(`Collection ${collectionName} not found in backup data`);
          continue;
        }
        
        const collectionData = backupData.data[collectionName];
        if (typeof collectionData.count !== 'number' || !Array.isArray(collectionData.documents)) {
          throw new Error(`Invalid data structure for collection: ${collectionName}`);
        }
      }
      
      logger.info('Backup file validation successful', {
        version: backupData.metadata.version,
        type: backupData.metadata.type,
        collections: backupData.metadata.collections.length,
        timestamp: backupData.metadata.timestamp
      });
      
      return backupData;
      
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid backup file: not a valid JSON file');
      }
      throw error;
    }
  }
  
  /**
   * Restore database from backup
   */
  async restoreFromBackup(options: RestoreOptions): Promise<RestoreResult> {
    let backupFilePath: string;
    let backupData: BackupData;
    
    try {
      // Determine backup file path
      if (options.backupId) {
        const backup = await BackupHistory.findById(options.backupId);
        if (!backup) {
          return {
            success: false,
            message: 'Backup not found'
          };
        }
        
        if (backup.status !== 'completed') {
          return {
            success: false,
            message: `Cannot restore from backup with status: ${backup.status}`
          };
        }
        
        backupFilePath = backup.filePath;
      } else if (options.backupFilePath) {
        backupFilePath = options.backupFilePath;
      } else {
        return {
          success: false,
          message: 'Either backupId or backupFilePath must be provided'
        };
      }
      
      // Check if backup file exists
      try {
        await fs.access(backupFilePath);
      } catch (error) {
        return {
          success: false,
          message: `Backup file not found: ${backupFilePath}`
        };
      }
      
      logger.info('Starting database restore', {
        backupFilePath,
        overwrite: options.overwrite,
        collections: options.collections,
        createdBy: options.createdBy
      });
      
      // Validate and parse backup file
      backupData = await this.validateBackupFile(backupFilePath);
      
      // Determine which collections to restore
      const collectionsToRestore = options.collections || backupData.metadata.collections;
      const validCollections = collectionsToRestore.filter(col => 
        backupData.metadata.collections.includes(col) && backupData.data[col]
      );
      
      if (validCollections.length === 0) {
        return {
          success: false,
          message: 'No valid collections found to restore'
        };
      }
      
      const restoredCollections: string[] = [];
      const skippedCollections: string[] = [];
      const errors: string[] = [];
      
      // Restore each collection
      for (const collectionName of validCollections) {
        try {
          const collectionData = backupData.data[collectionName];
          
          if (collectionData.error) {
            logger.warn(`Skipping collection ${collectionName}: ${collectionData.error}`);
            skippedCollections.push(collectionName);
            continue;
          }
          
          if (collectionData.count === 0) {
            logger.info(`Skipping empty collection: ${collectionName}`);
            skippedCollections.push(collectionName);
            continue;
          }
          
          await this.restoreCollection(collectionName, collectionData.documents, options.overwrite);
          restoredCollections.push(collectionName);
          
          logger.info(`Successfully restored collection: ${collectionName}, documents: ${collectionData.count}`);
          
        } catch (error: any) {
          logger.error(`Failed to restore collection ${collectionName}:`, error);
          errors.push(`${collectionName}: ${error.message}`);
          skippedCollections.push(collectionName);
        }
      }
      
      const success = restoredCollections.length > 0;
      const message = success 
        ? `Restore completed: ${restoredCollections.length} collections restored${skippedCollections.length > 0 ? `, ${skippedCollections.length} skipped` : ''}${errors.length > 0 ? `, ${errors.length} errors` : ''}`
        : 'Restore failed: no collections were restored';
      
      logger.info('Database restore completed', {
        success,
        restoredCollections: restoredCollections.length,
        skippedCollections: skippedCollections.length,
        errors: errors.length
      });
      
      return {
        success,
        message,
        restoredCollections,
        skippedCollections,
        details: {
          backupType: backupData.metadata.type,
          backupTimestamp: backupData.metadata.timestamp,
          totalDocuments: restoredCollections.reduce((sum, col) => 
            sum + (backupData.data[col]?.count || 0), 0
          ),
          errors: errors.length > 0 ? errors : undefined
        }
      };
      
    } catch (error: any) {
      logger.error('Database restore failed:', error);
      return {
        success: false,
        message: 'Restore operation failed',
        error: error.message
      };
    }
  }
  
  /**
   * Restore a specific collection from backup data
   */
  private async restoreCollection(
    collectionName: string, 
    documents: any[], 
    overwrite: boolean
  ): Promise<void> {
    const Model = this.getModelByCollection(collectionName);
    
    if (overwrite) {
      // Clear existing data
      logger.info(`Clearing existing data from collection: ${collectionName}`);
      await Model.deleteMany({});
    }
    
    if (documents.length === 0) {
      logger.info(`No documents to restore for collection: ${collectionName}`);
      return;
    }
    
    // Process documents in batches to avoid memory issues
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      try {
        // Clean up documents for insertion
        const cleanedBatch = batch.map(doc => {
          // Remove version key if it exists
          const { __v, ...cleanDoc } = doc;
          return cleanDoc;
        });
        
        if (overwrite) {
          // Insert new documents
          await Model.insertMany(cleanedBatch, { 
            ordered: false, // Continue on duplicate key errors
            rawResult: false 
          });
          insertedCount += cleanedBatch.length;
        } else {
          // Update or insert documents (upsert)
          for (const doc of cleanedBatch) {
            await Model.findByIdAndUpdate(
              doc._id,
              doc,
              { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true 
              }
            );
            insertedCount++;
          }
        }
        
        logger.info(`Restored batch for ${collectionName}: ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
        
      } catch (error: any) {
        logger.error(`Failed to restore batch for ${collectionName}:`, error);
        // Continue with next batch for non-critical errors
        if (error.name !== 'ValidationError' && error.code !== 11000) {
          throw error;
        }
      }
    }
    
    logger.info(`Collection restore completed: ${collectionName}, inserted: ${insertedCount}/${documents.length}`);
  }
  
  /**
   * Create a backup before restore (safety measure)
   */
  async createPreRestoreBackup(collections: string[], createdBy: string): Promise<string | null> {
    try {
             const { BackupService } = await import('./backupService.js');
      const backupService = new BackupService();
      
      const result = await backupService.createBackup({
        type: 'selective',
        collections,
        compress: true,
        description: 'Pre-restore safety backup',
        createdBy
      });
      
      if (result.success && result.backupId) {
        logger.info('Pre-restore backup created', { backupId: result.backupId });
        return result.backupId;
      }
      
      return null;
    } catch (error: any) {
      logger.error('Failed to create pre-restore backup:', error);
      return null;
    }
  }
  
  /**
   * Get restore preview (what would be restored without actually doing it)
   */
  async getRestorePreview(options: Omit<RestoreOptions, 'overwrite' | 'createdBy'>): Promise<{
    success: boolean;
    message: string;
    preview?: {
      backupInfo: any;
      collectionsToRestore: string[];
      totalDocuments: number;
      estimatedSize: string;
    };
    error?: string;
  }> {
    try {
      logger.info('RestoreService.getRestorePreview called', { options });
      let backupFilePath: string;
      
      if (options.backupId) {
        logger.info('Looking up backup by ID', { backupId: options.backupId });
        const backup = await BackupHistory.findById(options.backupId);
        logger.info('Backup lookup result', { 
          found: !!backup, 
          backupId: options.backupId,
          backup: backup ? {
            id: backup._id,
            filename: backup.filename,
            filePath: backup.filePath,
            status: backup.status
          } : null
        });
        
        if (!backup) {
          logger.warn('Backup not found in database', { backupId: options.backupId });
          return {
            success: false,
            message: 'Backup not found'
          };
        }
        backupFilePath = backup.filePath;
        logger.info('Using backup file path', { backupFilePath });
      } else if (options.backupFilePath) {
        backupFilePath = options.backupFilePath;
        logger.info('Using provided file path', { backupFilePath });
      } else {
        logger.error('No backup ID or file path provided');
        return {
          success: false,
          message: 'Either backupId or backupFilePath must be provided'
        };
      }
      
      // Check if backup file exists first
      try {
        await fs.access(backupFilePath);
        logger.info('Backup file exists', { backupFilePath });
      } catch (error: any) {
        logger.error('Backup file not found', { backupFilePath, error: error.message });
        return {
          success: false,
          message: `Backup file not found: ${backupFilePath}`,
          error: error.message
        };
      }
      
      // Validate backup file
      logger.info('Validating backup file', { backupFilePath });
      const backupData = await this.validateBackupFile(backupFilePath);
      logger.info('Backup file validated successfully', { 
        type: backupData.metadata.type,
        collections: backupData.metadata.collections.length 
      });
      
      // Calculate what would be restored
      const collectionsToRestore = options.collections || backupData.metadata.collections;
      const validCollections = collectionsToRestore.filter(col => 
        backupData.metadata.collections.includes(col) && backupData.data[col]
      );
      
      logger.info('Collections to restore', { collectionsToRestore, validCollections });
      
      const totalDocuments = validCollections.reduce((sum, col) => 
        sum + (backupData.data[col]?.count || 0), 0
      );
      
      // Estimate size
      const backupSize = await fs.stat(backupFilePath);
      const estimatedSize = this.formatFileSize(backupSize.size);
      
      logger.info('Restore preview calculated', { 
        totalDocuments, 
        estimatedSize, 
        validCollections: validCollections.length 
      });
      
      return {
        success: true,
        message: 'Restore preview generated successfully',
        preview: {
          backupInfo: {
            type: backupData.metadata.type,
            timestamp: backupData.metadata.timestamp,
            version: backupData.metadata.version
          },
          collectionsToRestore: validCollections,
          totalDocuments,
          estimatedSize
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to generate restore preview',
        error: error.message
      };
    }
  }
  
  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
} 