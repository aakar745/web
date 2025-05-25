"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchOperationLimiter = exports.imageProcessingLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiting middleware for API endpoints
 *
 * This creates different rate limiters for different types of requests
 * with appropriate limits for each operation type.
 */
// General API rate limiter - more lenient
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 20 * 60 * 1000, // 20 minutes
    max: 200, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.',
    }
});
// More strict rate limiter for image processing endpoints
exports.imageProcessingLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 image processing requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        message: 'You\'ve reached your limit for image processing. It will reset after 10 minutes.',
    }
});
// Very strict rate limiter for batch operations
exports.batchOperationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 batch operations per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'You\'ve reached your limit for batch operations. It will reset after 15 minutes.',
    }
});
//# sourceMappingURL=rateLimiter.js.map