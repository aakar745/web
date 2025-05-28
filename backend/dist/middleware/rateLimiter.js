"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lightApiLimiter = exports.apiLimiter = exports.batchOperationLimiter = exports.imageProcessingLimiter = exports.createBatchOperationLimiter = exports.createImageProcessingLimiter = void 0;
exports.clearRateLimitCache = clearRateLimitCache;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const settingsService_1 = require("../services/settingsService");
// Cache for rate limit settings
let rateLimitCache = null;
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
        const settings = await (0, settingsService_1.getRateLimitSettings)();
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
    }
    catch (error) {
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
const createImageProcessingLimiter = () => {
    return (0, express_rate_limit_1.default)({
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
exports.createImageProcessingLimiter = createImageProcessingLimiter;
/**
 * Dynamic rate limiter for batch operations
 */
const createBatchOperationLimiter = () => {
    return (0, express_rate_limit_1.default)({
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
exports.createBatchOperationLimiter = createBatchOperationLimiter;
// Create the limiters
exports.imageProcessingLimiter = (0, exports.createImageProcessingLimiter)();
exports.batchOperationLimiter = (0, exports.createBatchOperationLimiter)();
/**
 * Clear rate limit cache (call when settings are updated)
 */
function clearRateLimitCache() {
    rateLimitCache = null;
    lastRateLimitUpdate = 0;
}
/**
 * Rate limiting middleware for API endpoints
 *
 * Updated for higher concurrent usage while preventing abuse
 */
// General API rate limiter - more lenient for high traffic
exports.apiLimiter = (0, express_rate_limit_1.default)({
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
exports.lightApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for status checks, etc.
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many requests, please slow down.',
    }
});
//# sourceMappingURL=rateLimiter.js.map