import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { 
  compressImageService, 
  resizeImageService, 
  convertImageService, 
  cropImageService 
} from '../services/imageService';
import { 
  compressQueue,
  resizeQueue,
  convertQueue,
  cropQueue,
  isRedisActuallyAvailable
} from '../queues/imageQueue';
import { isRedisAvailable } from '../config/redis';
import { asyncHandler } from '../utils/asyncHandler';
import Queue from 'bull';

/**
 * Helper function to get job status
 */
export const getJobStatus = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  const { type = 'compress' } = req.query;
  
  if (!id) {
    return res.status(400).json({
      status: 'error',
      message: 'Job ID is required'
    });
  }
  
  // If Redis is not available, we can't fetch job status
  const redisAvailable = await isRedisActuallyAvailable();
  if (redisAvailable === false) {
    return res.status(503).json({
      status: 'error',
      message: 'Job status checking is not available in local processing mode'
    });
  }
  
  // Select the appropriate queue based on job type
  let queue;
  switch (type) {
    case 'compress':
      queue = compressQueue;
      break;
    case 'resize':
      queue = resizeQueue;
      break;
    case 'convert':
      queue = convertQueue;
      break;
    case 'crop':
      queue = cropQueue;
      break;
    default:
      queue = compressQueue;
  }
  
  // Get job from queue
  const job = await queue.getJob(id);
  
  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'Job not found'
    });
  }
  
  // Get job status, progress and result if available
  const state = await job.getState();
  const progress = job.progress();
  const result = job.returnvalue;
  const failReason = job.failedReason;
  
  res.status(200).json({
    status: 'success',
    data: {
      id: job.id,
      state,
      progress,
      result: state === 'completed' ? result : null,
      error: state === 'failed' ? failReason : null
    }
  });
});

export const compressImage = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload an image' 
    });
  }

  const { quality = '80' } = req.body;
  const qualityValue = parseInt(quality as string);
  
  console.log('Compression request received:');
  console.log('- File:', req.file.originalname);
  console.log('- Original size:', req.file.size, 'bytes');
  console.log('- Quality setting:', qualityValue);
  
  // Store original filename for download
  const originalFilename = req.file.originalname;
  
  // Check Redis availability - now with async call
  const redisAvailable = await isRedisActuallyAvailable();
  console.log(`Redis availability for compression job: ${redisAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
  
  // If Redis is not available, process the image directly
  if (redisAvailable === false) {
    console.log('Processing compression directly (Redis not available)');
    
    try {
      const result = await compressImageService(
        req.file.path,
        qualityValue
      );
      
      // Set the filePath to include the 'processed' folder for correct download URL
      const filePath = path.basename(result.path);
      
      return res.status(200).json({
        status: 'success',
        data: {
          originalSize: req.file.size,
          compressedSize: result.size ?? 0,
          compressionRatio: Math.round((1 - ((result.size ?? 0) / req.file.size)) * 100),
          mime: result.mime,
          filename: filePath,
          originalFilename,
          downloadUrl: `/api/images/download/${filePath}?originalFilename=${encodeURIComponent(originalFilename)}`
        }
      });
    } catch (error) {
      console.error('Direct compression failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Image compression failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Redis is available, so use the queue
  console.log('Adding compression job to Redis queue');
  
  // Add job to queue
  const job = await compressQueue.add({
    filePath: req.file.path,
    quality: qualityValue,
    originalFilename: req.file.originalname,
    originalSize: req.file.size,
    webhookUrl: req.body.webhookUrl // Add webhook URL directly in the job data
  }, {
    // Job options
    timeout: 3 * 60 * 1000, // 3 minutes timeout
    attempts: 2, // Retry once on failure
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 100 // Keep last 100 failed jobs
  });
  
  // Now job.update is only called if we know it's a Bull queue job
  if (redisAvailable === true && req.body.webhookUrl && 'update' in job) {
    await (job as Queue.Job).update({
      ...job.data,
      webhookUrl: req.body.webhookUrl
    });
  }
  
  res.status(202).json({
    status: 'processing',
    message: 'Image compression job queued',
    data: {
      jobId: job.id,
      statusUrl: `/api/images/status/${job.id}?type=compress`
    }
  });
});

export const resizeImage = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload an image' 
    });
  }

  const { width, height, fit = 'cover' } = req.body;
  
  if (!width && !height) {
    return res.status(400).json({
      status: 'error',
      message: 'At least one dimension (width or height) is required'
    });
  }
  
  // Parse dimensions
  const widthValue = width ? parseInt(width as string) : undefined;
  const heightValue = height ? parseInt(height as string) : undefined;
  
  console.log('Resize request received:');
  console.log('- File:', req.file.originalname);
  console.log('- Dimensions:', widthValue, 'x', heightValue);
  console.log('- Fit:', fit);
  
  // Store original filename for download
  const originalFilename = req.file.originalname;
  
  // Check Redis availability - now with async call
  const redisAvailable = await isRedisActuallyAvailable();
  
  // If Redis is not available, process the image directly
  if (redisAvailable === false) {
    console.log('Processing resize directly (Redis not available)');
    
    try {
      const result = await resizeImageService(
        req.file.path,
        widthValue || 0,  // Provide fallback of 0 if undefined
        heightValue || 0,  // Provide fallback of 0 if undefined
        fit as string
      );
      
      // Set the filePath to include the 'processed' folder for correct download URL
      const filePath = path.basename(result.path);
      
      return res.status(200).json({
        status: 'success',
        data: {
          width: result.width,
          height: result.height,
          mime: result.mime,
          filename: filePath,
          originalFilename,
          downloadUrl: `/api/images/download/${filePath}?originalFilename=${encodeURIComponent(originalFilename)}`
        }
      });
    } catch (error) {
      console.error('Direct resize failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Image resize failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Redis is available, use the queue
  console.log('Adding resize job to Redis queue');
  
  // Add job to queue
  const job = await resizeQueue.add({
    filePath: req.file.path,
    width: widthValue,
    height: heightValue,
    fit: fit as string,
    originalFilename: req.file.originalname,
    webhookUrl: req.body.webhookUrl
  }, {
    // Job options
    timeout: 3 * 60 * 1000,
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 100
  });
  
  // Update webhook URL if provided
  if (redisAvailable === true && req.body.webhookUrl && 'update' in job) {
    await (job as Queue.Job).update({
      ...job.data,
      webhookUrl: req.body.webhookUrl
    });
  }
  
  res.status(202).json({
    status: 'processing',
    message: 'Image resize job queued',
    data: {
      jobId: job.id,
      statusUrl: `/api/images/status/${job.id}?type=resize`
    }
  });
});

export const convertImage = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload an image' 
    });
  }

  const { format = 'jpeg' } = req.body;
  
  console.log('Conversion request received:');
  console.log('- File:', req.file.originalname);
  console.log('- Target format:', format);
  
  // Store original filename for download
  const originalFilename = req.file.originalname;
  
  // Check Redis availability - now with async call
  const redisAvailable = await isRedisActuallyAvailable();
  
  // If Redis is not available, process the image directly
  if (redisAvailable === false) {
    console.log('Processing conversion directly (Redis not available)');
    
    try {
      const result = await convertImageService(
        req.file.path,
        format as string
      );
      
      // Set the filePath to include the 'processed' folder for correct download URL
      const filePath = path.basename(result.path);
      
      return res.status(200).json({
        status: 'success',
        data: {
          originalFormat: path.extname(originalFilename).substring(1),
          convertedFormat: format,
          mime: result.mime,
          filename: filePath,
          originalFilename,
          downloadUrl: `/api/images/download/${filePath}?originalFilename=${encodeURIComponent(originalFilename.replace(/\.[^/.]+$/, `.${format}`))}`
        }
      });
    } catch (error) {
      console.error('Direct conversion failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Image conversion failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Redis is available, use the queue
  console.log('Adding conversion job to Redis queue');
  
  // Add job to queue
  const job = await convertQueue.add({
    filePath: req.file.path,
    format: format as string,
    originalFilename: req.file.originalname,
    webhookUrl: req.body.webhookUrl
  }, {
    // Job options
    timeout: 3 * 60 * 1000,
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 100
  });
  
  // Update webhook URL if provided
  if (redisAvailable === true && req.body.webhookUrl && 'update' in job) {
    await (job as Queue.Job).update({
      ...job.data,
      webhookUrl: req.body.webhookUrl
    });
  }
  
  res.status(202).json({
    status: 'processing',
    message: 'Image conversion job queued',
    data: {
      jobId: job.id,
      statusUrl: `/api/images/status/${job.id}?type=convert`
    }
  });
});

export const cropImage = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload an image' 
    });
  }

  const { left, top, width, height } = req.body;
  
  if (!left || !top || !width || !height) {
    return res.status(400).json({
      status: 'error',
      message: 'Crop coordinates (left, top, width, height) are required'
    });
  }
  
  // Parse crop coordinates
  const leftValue = parseInt(left as string);
  const topValue = parseInt(top as string);
  const widthValue = parseInt(width as string);
  const heightValue = parseInt(height as string);
  
  console.log('Crop request received:');
  console.log('- File:', req.file.originalname);
  console.log('- Crop area:', leftValue, topValue, widthValue, heightValue);
  
  // Store original filename for download
  const originalFilename = req.file.originalname;
  
  // Check Redis availability - now with async call
  const redisAvailable = await isRedisActuallyAvailable();
  
  // If Redis is not available, process the image directly
  if (redisAvailable === false) {
    console.log('Processing crop directly (Redis not available)');
    
    try {
      const result = await cropImageService(
        req.file.path,
        leftValue,
        topValue,
        widthValue,
        heightValue
      );
      
      // Set the filePath to include the 'processed' folder for correct download URL
      const filePath = path.basename(result.path);
      
      return res.status(200).json({
        status: 'success',
        data: {
          width: result.width,
          height: result.height,
          mime: result.mime,
          filename: filePath,
          originalFilename,
          downloadUrl: `/api/images/download/${filePath}?originalFilename=${encodeURIComponent(originalFilename)}`
        }
      });
    } catch (error) {
      console.error('Direct crop failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Image crop failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Redis is available, use the queue
  console.log('Adding crop job to Redis queue');
  
  // Add job to queue
  const job = await cropQueue.add({
    filePath: req.file.path,
    left: leftValue,
    top: topValue,
    width: widthValue,
    height: heightValue,
    originalFilename: req.file.originalname,
    webhookUrl: req.body.webhookUrl
  }, {
    // Job options
    timeout: 3 * 60 * 1000,
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 100
  });
  
  // Update webhook URL if provided
  if (redisAvailable === true && req.body.webhookUrl && 'update' in job) {
    await (job as Queue.Job).update({
      ...job.data,
      webhookUrl: req.body.webhookUrl
    });
  }
  
  res.status(202).json({
    status: 'processing',
    message: 'Image crop job queued',
    data: {
      jobId: job.id,
      statusUrl: `/api/images/status/${job.id}?type=crop`
    }
  });
});

/**
 * @desc    Optimize image for blog usage
 * @route   POST /api/image/optimize-blog
 * @access  Private
 */
export const optimizeBlogImage = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload an image' 
    });
  }

  try {
    const file = req.file;
    const quality = parseInt(req.body.quality as string) || 80;
    const format = (req.body.format as string) || 'webp';
    
    // Check if this is a featured image or regular content image
    const isFeatured = req.body.isFeatured === 'true';
    
    // Import sharp without TypeScript issues
    const sharp = require('sharp');
    let processor = sharp(file.buffer);
    
    // Apply resize based on image type
    if (isFeatured) {
      // Featured images should be 1200x630 (social sharing optimized)
      processor = processor.resize(1200, 630, { fit: 'cover' });
    } else {
      // Regular blog images should be max 800px wide, maintain aspect ratio
      processor = processor.resize(800, null, { fit: 'inside' });
    }
    
    // Apply format with quality
    let processedImageBuffer;
    if (format === 'webp') {
      processedImageBuffer = await processor.webp({ quality }).toBuffer();
    } else if (format === 'jpeg' || format === 'jpg') {
      processedImageBuffer = await processor.jpeg({ quality }).toBuffer();
    } else if (format === 'png') {
      processedImageBuffer = await processor.png({ quality }).toBuffer();
    } else {
      processedImageBuffer = await processor.webp({ quality }).toBuffer();
    }
    
    // Return the processed image
    res.set('Content-Type', `image/${format}`);
    res.set('Content-Disposition', `attachment; filename="optimized-${file.originalname}.${format}"`);
    res.send(processedImageBuffer);
    
  } catch (error: any) {
    console.error('Error optimizing blog image:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error processing image'
    });
  }
}); 