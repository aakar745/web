import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import cleanupToolImages from '../scripts/cleanupToolImages';
import logger from '../utils/logger';

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
    const { setupAutoCleanup = false } = req.body;
    
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