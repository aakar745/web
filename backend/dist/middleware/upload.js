"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageDimensions = exports.validateDynamicFileSize = exports.createDynamicUpload = exports.upload = exports.IMAGE_LIMITS = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = __importDefault(require("../utils/logger"));
const settingsService_1 = require("../services/settingsService");
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
// Constants for image limits (fallback values)
exports.IMAGE_LIMITS = {
    MAX_FILE_SIZE: 52428800, // 50MB default (will be overridden by settings)
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
const uploadDir = path_1.default.join(__dirname, '../../uploads');
const blogsDir = path_1.default.join(uploadDir, 'blogs');
const processedDir = path_1.default.join(uploadDir, 'processed');
const archivesDir = path_1.default.join(uploadDir, 'archives');
// Create directories if they don't exist
[uploadDir, blogsDir, processedDir, archivesDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Check if this is a blog image upload (based on the route or a flag in the request)
        const isBlogUpload = req.path === '/api/upload' ||
            req.path === '/upload' ||
            req.query.type === 'blog' ||
            (req.body && req.body.type === 'blog');
        if (isBlogUpload) {
            cb(null, blogsDir);
        }
        else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Generate a unique filename with the original extension
        const ext = path_1.default.extname(file.originalname);
        const id = (0, uuid_1.v4)();
        // Check if this is a blog image upload
        const isBlogUpload = req.path === '/api/upload' ||
            req.path === '/upload' ||
            req.query.type === 'blog' ||
            (req.body && req.body.type === 'blog');
        if (isBlogUpload) {
            // For blog images, prefix with 'blog-'
            cb(null, `blog-${id}${ext}`);
        }
        else {
            // For other uploads, use the UUID directly
            cb(null, `${id}${ext}`);
        }
    }
});
// Create a filter function for file types
const fileFilter = (req, file, cb) => {
    // Check if the file type is allowed
    if (exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Allowed types: ${exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`));
    }
};
// Create the multer upload middleware
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: exports.IMAGE_LIMITS.MAX_FILE_SIZE
    }
});
// Dynamic upload middleware factory that uses current database settings
const createDynamicUpload = () => {
    return (0, multer_1.default)({
        storage,
        fileFilter: async (req, file, cb) => {
            try {
                // Get current file upload settings
                const settings = await (0, settingsService_1.getFileUploadSettings)();
                // Check file type
                if (!exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    return cb(new Error(`Invalid file type. Allowed types: ${exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`));
                }
                // Attach settings to request for later use
                req.uploadSettings = settings;
                cb(null, true);
            }
            catch (error) {
                logger_1.default.error('Error getting upload settings:', error);
                // Fall back to static file filter
                if (exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new Error(`Invalid file type. Allowed types: ${exports.IMAGE_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`));
                }
            }
        },
        limits: {
            fileSize: exports.IMAGE_LIMITS.MAX_FILE_SIZE // Will be checked dynamically in middleware
        }
    });
};
exports.createDynamicUpload = createDynamicUpload;
// Middleware to validate file size against dynamic settings
const validateDynamicFileSize = async (req, res, next) => {
    try {
        const settings = req.uploadSettings || await (0, settingsService_1.getFileUploadSettings)();
        const files = req.files || (req.file ? [req.file] : []);
        // Check file count
        if (files.length > settings.maxFiles) {
            // Clean up uploaded files
            files.forEach(file => {
                if (file.path && fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
            return res.status(400).json({
                status: 'error',
                message: `Too many files. Maximum allowed: ${settings.maxFiles}`
            });
        }
        // Check file sizes
        for (const file of files) {
            if (file.size > settings.maxFileSize) {
                // Clean up uploaded files
                files.forEach(f => {
                    if (f.path && fs_1.default.existsSync(f.path)) {
                        fs_1.default.unlinkSync(f.path);
                    }
                });
                return res.status(400).json({
                    status: 'error',
                    message: `File size exceeds limit. Maximum allowed: ${Math.round(settings.maxFileSize / 1048576)}MB`
                });
            }
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating dynamic file size:', error);
        next(); // Continue with static validation
    }
};
exports.validateDynamicFileSize = validateDynamicFileSize;
// Middleware to validate image dimensions after upload
const validateImageDimensions = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    try {
        // Get image metadata using sharp
        const metadata = await (0, sharp_1.default)(req.file.path).metadata();
        // Check dimensions
        if (metadata.width && metadata.height) {
            if (metadata.width > exports.IMAGE_LIMITS.MAX_WIDTH || metadata.height > exports.IMAGE_LIMITS.MAX_HEIGHT) {
                // Delete the file
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    status: 'error',
                    message: `Image dimensions too large. Maximum allowed: ${exports.IMAGE_LIMITS.MAX_WIDTH}x${exports.IMAGE_LIMITS.MAX_HEIGHT}`
                });
            }
            if (metadata.width < exports.IMAGE_LIMITS.MIN_WIDTH || metadata.height < exports.IMAGE_LIMITS.MIN_HEIGHT) {
                // Delete the file
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    status: 'error',
                    message: `Image dimensions too small. Minimum allowed: ${exports.IMAGE_LIMITS.MIN_WIDTH}x${exports.IMAGE_LIMITS.MIN_HEIGHT}`
                });
            }
        }
        next();
    }
    catch (error) {
        // Delete the file if we can't process it
        if (req.file && req.file.path) {
            try {
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (unlinkError) {
                logger_1.default.error(`Error removing invalid file: ${unlinkError.message}`);
            }
        }
        logger_1.default.error(`Error validating image dimensions: ${error.message}`);
        return res.status(400).json({
            status: 'error',
            message: 'Invalid image file. Could not process dimensions.'
        });
    }
};
exports.validateImageDimensions = validateImageDimensions;
//# sourceMappingURL=upload.js.map