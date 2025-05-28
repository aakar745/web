import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import cleanupToolImages from '../scripts/cleanupToolImages';
import logger from '../utils/logger';
import { isSystemUnderHighLoad } from '../middleware/loadBalancer';
import SystemSettings, { ISystemSettings } from '../models/SystemSettings';
import { clearSettingsCache } from '../services/settingsService';
import { clearRateLimitCache } from '../middleware/rateLimiter';

const execPromise = promisify(exec);

// Define interface for scheduled task result
interface ScheduledTaskResult {
  success: boolean;
  message: string;
}

/**
 * Run image cleanup and optionally set up scheduled task
 */
export const cleanupImages = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get options from request body
    const { setupAutoCleanup = false, emergencyMode = false } = req.body;
    
    // Check if system is under high load for automatic emergency mode
    const isHighLoad = await isSystemUnderHighLoad();
    const shouldUseEmergencyMode = emergencyMode || isHighLoad;
    
    if (shouldUseEmergencyMode) {
      logger.warn('Running cleanup in emergency mode due to high system load');
    }
    
    // Run immediate cleanup
    logger.info('Manual cleanup triggered from admin panel');
    const cleanupResults = await cleanupToolImages();
    
    // Set up scheduled task if requested
    let scheduledTaskResult: ScheduledTaskResult | null = null;
    
    if (setupAutoCleanup) {
      try {
        // Check if task already exists
        const { stdout: taskCheckOutput } = await execPromise('schtasks /query /tn "WebTools Image Cleanup" 2>&1');
        
        if (taskCheckOutput.includes('ERROR:')) {
          // Task doesn't exist, create it
          const scriptPath = path.resolve(__dirname, '../../../cleanup-images.bat');
          
          // Create daily task at 3:00 AM
          const { stdout, stderr } = await execPromise(
            `schtasks /create /tn "WebTools Image Cleanup" /tr "${scriptPath}" /sc DAILY /st 03:00 /ru SYSTEM /f`
          );
          
          scheduledTaskResult = {
            success: true,
            message: 'Automatic cleanup scheduled daily at 3:00 AM'
          };
          
          logger.info('Automatic cleanup task created successfully');
        } else {
          // Task already exists
          scheduledTaskResult = {
            success: true,
            message: 'Automatic cleanup was already configured'
          };
          
          logger.info('Automatic cleanup task already exists');
        }
      } catch (taskError: any) {
        logger.error('Failed to set up scheduled task:', taskError);
        scheduledTaskResult = {
          success: false,
          message: `Failed to set up scheduled task: ${taskError.message}`
        };
      }
    }
    
    // Return results
    res.status(200).json({
      status: 'success',
      data: {
        cleanup: cleanupResults,
        scheduledTask: scheduledTaskResult
      }
    });
  } catch (error: any) {
    logger.error('Image cleanup failed:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to perform image cleanup: ${error.message}`
    });
  }
});

/**
 * Get system settings
 */
export const getSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.getCurrentSettings();
    
    res.status(200).json({
      status: 'success',
      data: {
        settings
      }
    });
  } catch (error: any) {
    logger.error('Failed to get system settings:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to get system settings: ${error.message}`
    });
  }
});

/**
 * Update system settings
 */
export const updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    // Update settings
    const settings = await SystemSettings.updateSettings(updates);
    
    logger.info('System settings updated by admin:', {
      updates,
      updatedBy: req.user?.email || 'Unknown'
    });
    
    // Clear settings cache
    clearSettingsCache();
    
    // Clear rate limit cache
    clearRateLimitCache();
    
    res.status(200).json({
      status: 'success',
      data: {
        settings,
        message: 'Settings updated successfully. Changes will take effect for new requests.'
      }
    });
  } catch (error: any) {
    logger.error('Failed to update system settings:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: `Failed to update system settings: ${error.message}`
    });
  }
});

/**
 * Get rate limit settings for frontend display
 */
export const getRateLimitSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.getCurrentSettings();
    
    res.status(200).json({
      status: 'success',
      data: {
        imageProcessing: {
          max: settings.imageProcessingMaxRequests,
          windowMs: settings.imageProcessingWindowMs
        },
        batchOperation: {
          max: settings.batchOperationMaxRequests,
          windowMs: settings.batchOperationWindowMs
        },
        api: {
          max: settings.apiMaxRequests,
          windowMs: settings.apiWindowMs
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to get rate limit settings:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to get rate limit settings: ${error.message}`
    });
  }
});

/**
 * Get file upload settings for frontend display
 */
export const getFileUploadSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.getCurrentSettings();
    
    res.status(200).json({
      status: 'success',
      data: {
        maxFileSize: settings.maxFileSize,
        maxFiles: settings.maxFiles
      }
    });
  } catch (error: any) {
    logger.error('Failed to get file upload settings:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to get file upload settings: ${error.message}`
    });
  }
}); 