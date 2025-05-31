import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { getRateLimitSettings } from '../services/settingsService';

// Cache for rate limit settings
let rateLimitCache: any = null;
let lastRateLimitUpdate = 0;
const RATE_LIMIT_CACHE_DURATION = 60000; // 1 minute

/**
 * Get rate limit configuration with caching
 */
async function getRateLimitConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (rateLimitCache && (now - lastRateLimitUpdate) < RATE_LIMIT_CACHE_DURATION) {
    return rateLimitCache;
  }
  
  try {
    const settings = await getRateLimitSettings();
    
    rateLimitCache = {
      imageProcessing: {
        windowMs: settings.imageProcessing.windowMs,
        max: settings.imageProcessing.max,
        message: {
          status: 'error',
          message: `Too many image processing requests. Limit: ${settings.imageProcessing.max} requests per ${settings.imageProcessing.windowMs / 60000} minutes.`,
          retryAfter: Math.ceil(settings.imageProcessing.windowMs / 1000),
        }
      },
      batchOperation: {
        windowMs: settings.batchOperation.windowMs,
        max: settings.batchOperation.max,
        message: {
          status: 'error',
          message: `Too many batch operations. Limit: ${settings.batchOperation.max} operations per ${settings.batchOperation.windowMs / 60000} minutes.`,
          retryAfter: Math.ceil(settings.batchOperation.windowMs / 1000),
        }
      }
    };
    
    lastRateLimitUpdate = now;
    return rateLimitCache;
  } catch (error) {
    console.error('Failed to get rate limit settings, using defaults:', error);
    
    // Fallback configuration
    return {
      imageProcessing: {
        windowMs: 300000, // 5 minutes
        max: 50,
        message: {
          status: 'error',
          message: 'Too many image processing requests. Limit: 50 requests per 5 minutes.',
          retryAfter: 300,
        }
      },
      batchOperation: {
        windowMs: 600000, // 10 minutes
        max: 15,
        message: {
          status: 'error',
          message: 'Too many batch operations. Limit: 15 operations per 10 minutes.',
          retryAfter: 600,
        }
      }
    };
  }
}

// Store for dynamic rate limiters
const rateLimiters = new Map();

/**
 * Get or create a rate limiter for specific configuration
 */
function getOrCreateRateLimiter(key: string, config: any) {
  const configKey = `${key}-${config.windowMs}-${config.max}`;
  
  if (!rateLimiters.has(configKey)) {
    const limiter = rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: config.message,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return process.env.NODE_ENV === 'development' && process.env.ENABLE_RATE_LIMITING !== 'true';
      },
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
      },
      handler: (req, res) => {
        console.log(`Rate limit hit for ${key}: ${req.ip}`);
        res.status(429).json(config.message);
      }
    });
    
    rateLimiters.set(configKey, limiter);
    
    // Clean up old limiters (keep only last 10)
    if (rateLimiters.size > 10) {
      const firstKey = rateLimiters.keys().next().value;
      rateLimiters.delete(firstKey);
    }
  }
  
  return rateLimiters.get(configKey);
}

/**
 * Dynamic image processing rate limiter middleware
 */
export const imageProcessingLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await getRateLimitConfig();
    const limiter = getOrCreateRateLimiter('imageProcessing', config.imageProcessing);
    limiter(req, res, next);
  } catch (error) {
    console.error('Error in image processing rate limiter:', error);
    next(); // Continue without rate limiting on error
  }
};

/**
 * Dynamic batch operation rate limiter middleware
 */
export const batchOperationLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await getRateLimitConfig();
    const limiter = getOrCreateRateLimiter('batchOperation', config.batchOperation);
    limiter(req, res, next);
  } catch (error) {
    console.error('Error in batch operation rate limiter:', error);
    next(); // Continue without rate limiting on error
  }
};

/**
 * Clear rate limit cache (call when settings are updated)
 */
export function clearRateLimitCache(): void {
  rateLimitCache = null;
  lastRateLimitUpdate = 0;
  rateLimiters.clear(); // Clear all cached limiters to force recreation
  console.log('Rate limit cache cleared - new settings will be applied');
}

/**
 * General API rate limiter - static for overall API protection
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  }
});

/**
 * Light API rate limiter for non-processing endpoints
 */
export const lightApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please slow down.',
  }
});

// For backwards compatibility
export const createImageProcessingLimiter = () => imageProcessingLimiter;
export const createBatchOperationLimiter = () => batchOperationLimiter; 