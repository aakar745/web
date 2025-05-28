import rateLimit from 'express-rate-limit';
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

/**
 * Dynamic rate limiter for image processing endpoints
 */
export const createImageProcessingLimiter = () => {
  return rateLimit({
    windowMs: 300000, // 5 minutes default, will be updated by middleware
    max: 50, // default, will be updated by middleware  
    message: {
      status: 'error',
      message: 'Too many image processing requests. Please wait before trying again.',
      retryAfter: 300,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development unless explicitly enabled
    skip: (req) => {
      return process.env.NODE_ENV === 'development' && process.env.ENABLE_RATE_LIMITING !== 'true';
    },
    // Use the user's IP address for identification
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });
};

/**
 * Dynamic rate limiter for batch operations
 */
export const createBatchOperationLimiter = () => {
  return rateLimit({
    windowMs: 600000, // 10 minutes default, will be updated by middleware
    max: 15, // default, will be updated by middleware
    message: {
      status: 'error',
      message: 'Too many batch operations. Please wait before trying again.',
      retryAfter: 600,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'development' && process.env.ENABLE_RATE_LIMITING !== 'true';
    },
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });
};

// Create the limiters
export const imageProcessingLimiter = createImageProcessingLimiter();
export const batchOperationLimiter = createBatchOperationLimiter();

/**
 * Clear rate limit cache (call when settings are updated)
 */
export function clearRateLimitCache(): void {
  rateLimitCache = null;
  lastRateLimitUpdate = 0;
}

/**
 * Rate limiting middleware for API endpoints
 * 
 * Updated for higher concurrent usage while preventing abuse
 */

// General API rate limiter - more lenient for high traffic
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 200 to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  }
});

// New: Lighter rate limiter for non-processing endpoints
export const lightApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for status checks, etc.
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please slow down.',
  }
}); 