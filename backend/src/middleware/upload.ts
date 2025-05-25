import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';
import logger from '../utils/logger';

/**
 * File naming convention:
 * - Blog images: 'blog-[uuid].[extension]' (stored in /uploads/blogs directory)
 * - Tool processed images: 'tool-[operation]-[uuid].[extension]' (stored in /uploads/processed)
 * - Other uploads: '[uuid].[extension]' (stored in main /uploads directory)
 * 
 * For future cleanup scripts/cron jobs:
 * - Files in /uploads/blogs should be preserved (permanent storage)
 * - Files starting with 'tool-' in /uploads/processed and archives with 'tool-' in /uploads/archives
 *   can be cleaned up periodically.
 * - Regular files in /uploads can be cleaned up periodically.
 */

// Constants for image limits
export const IMAGE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_WIDTH: 8000, // 8K resolution width
  MAX_HEIGHT: 8000, // 8K resolution height
  MIN_WIDTH: 10,
  MIN_HEIGHT: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ]
};

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const blogsDir = path.join(uploadDir, 'blogs');
const processedDir = path.join(uploadDir, 'processed');
const archivesDir = path.join(uploadDir, 'archives');

// Create directories if they don't exist
[uploadDir, blogsDir, processedDir, archivesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check if this is a blog image upload (based on the route or a flag in the request)
    const isBlogUpload = req.path === '/api/upload' || 
                         req.path === '/upload' || 
                         req.query.type === 'blog' || 
                         (req.body && req.body.type === 'blog');
    
    if (isBlogUpload) {
      cb(null, blogsDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with the original extension
    const ext = path.extname(file.originalname);
    const id = uuidv4();
    
    // Check if this is a blog image upload
    const isBlogUpload = req.path === '/api/upload' || 
                         req.path === '/upload' || 
                         req.query.type === 'blog' || 
                         (req.body && req.body.type === 'blog');
    
    if (isBlogUpload) {
      // For blog images, prefix with 'blog-'
      cb(null, `blog-${id}${ext}`);
    } else {
      // For other uploads, use the UUID directly
      cb(null, `${id}${ext}`);
    }
  }
});

// Create a filter function for file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if the file type is allowed
  if (IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${IMAGE_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

// Create the multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: IMAGE_LIMITS.MAX_FILE_SIZE
  }
});

// Middleware to validate image dimensions after upload
export const validateImageDimensions = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  try {
    // Get image metadata using sharp
    const metadata = await sharp(req.file.path).metadata();
    
    // Check dimensions
    if (metadata.width && metadata.height) {
      if (metadata.width > IMAGE_LIMITS.MAX_WIDTH || metadata.height > IMAGE_LIMITS.MAX_HEIGHT) {
        // Delete the file
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
          status: 'error',
          message: `Image dimensions too large. Maximum allowed: ${IMAGE_LIMITS.MAX_WIDTH}x${IMAGE_LIMITS.MAX_HEIGHT}`
        });
      }
      
      if (metadata.width < IMAGE_LIMITS.MIN_WIDTH || metadata.height < IMAGE_LIMITS.MIN_HEIGHT) {
        // Delete the file
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
          status: 'error',
          message: `Image dimensions too small. Minimum allowed: ${IMAGE_LIMITS.MIN_WIDTH}x${IMAGE_LIMITS.MIN_HEIGHT}`
        });
      }
    }
    
    next();
  } catch (error: any) {
    // Delete the file if we can't process it
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error removing invalid file: ${(unlinkError as Error).message}`);
      }
    }
    
    logger.error(`Error validating image dimensions: ${error.message}`);
    
    return res.status(400).json({
      status: 'error',
      message: 'Invalid image file. Could not process dimensions.'
    });
  }
}; 