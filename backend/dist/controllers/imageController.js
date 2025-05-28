"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeBlogImage = exports.cropImage = exports.convertImage = exports.resizeImage = exports.compressImage = exports.getJobStatus = void 0;
const path_1 = __importDefault(require("path"));
const imageService_1 = require("../services/imageService");
const imageQueue_1 = require("../queues/imageQueue");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Helper function to get job status with queue position
 */
exports.getJobStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { type = 'compress' } = req.query;
    if (!id) {
        return res.status(400).json({
            status: 'error',
            message: 'Job ID is required'
        });
    }
    // If Redis is not available, we can't fetch job status
    const redisAvailable = await (0, imageQueue_1.isRedisActuallyAvailable)();
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
            queue = imageQueue_1.compressQueue;
            break;
        case 'resize':
            queue = imageQueue_1.resizeQueue;
            break;
        case 'convert':
            queue = imageQueue_1.convertQueue;
            break;
        case 'crop':
            queue = imageQueue_1.cropQueue;
            break;
        default:
            queue = imageQueue_1.compressQueue;
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
    // Calculate queue position if job is waiting
    let queuePosition = null;
    let estimatedWaitTime = null;
    if (state === 'waiting') {
        try {
            // Get all waiting jobs to calculate position
            const waitingJobs = await queue.getWaiting();
            const jobIndex = waitingJobs.findIndex(waitingJob => waitingJob.id === job.id);
            if (jobIndex !== -1) {
                queuePosition = jobIndex + 1; // 1-based position
                // Estimate wait time (assuming 30 seconds per job on average)
                const avgProcessingTime = 30; // seconds
                estimatedWaitTime = Math.max(0, jobIndex * avgProcessingTime);
            }
        }
        catch (error) {
            console.error('Error calculating queue position:', error);
        }
    }
    res.status(200).json({
        status: 'success',
        data: {
            id: job.id,
            state,
            progress,
            result: state === 'completed' ? result : null,
            error: state === 'failed' ? failReason : null,
            queuePosition,
            estimatedWaitTime: estimatedWaitTime ? `${Math.ceil(estimatedWaitTime / 60)} minutes` : null
        }
    });
});
exports.compressImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            message: 'Please upload an image'
        });
    }
    const { quality = '80' } = req.body;
    const qualityValue = parseInt(quality);
    console.log('Compression request received:');
    console.log('- File:', req.file.originalname);
    console.log('- Original size:', req.file.size, 'bytes');
    console.log('- Quality setting:', qualityValue);
    // Store original filename for download
    const originalFilename = req.file.originalname;
    // Check Redis availability - now with async call
    const redisAvailable = await (0, imageQueue_1.isRedisActuallyAvailable)();
    console.log(`Redis availability for compression job: ${redisAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
    // If Redis is not available, process the image directly
    if (redisAvailable === false) {
        console.log('Processing compression directly (Redis not available)');
        try {
            const result = await (0, imageService_1.compressImageService)(req.file.path, qualityValue);
            // Set the filePath to include the 'processed' folder for correct download URL
            const filePath = path_1.default.basename(result.path);
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
        }
        catch (error) {
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
    const job = await imageQueue_1.compressQueue.add({
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
        await job.update({
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
exports.resizeImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
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
    const widthValue = width ? parseInt(width) : undefined;
    const heightValue = height ? parseInt(height) : undefined;
    console.log('Resize request received:');
    console.log('- File:', req.file.originalname);
    console.log('- Dimensions:', widthValue, 'x', heightValue);
    console.log('- Fit:', fit);
    // Store original filename for download
    const originalFilename = req.file.originalname;
    // Check Redis availability - now with async call
    const redisAvailable = await (0, imageQueue_1.isRedisActuallyAvailable)();
    // If Redis is not available, process the image directly
    if (redisAvailable === false) {
        console.log('Processing resize directly (Redis not available)');
        try {
            const result = await (0, imageService_1.resizeImageService)(req.file.path, widthValue || 0, // Provide fallback of 0 if undefined
            heightValue || 0, // Provide fallback of 0 if undefined
            fit);
            // Set the filePath to include the 'processed' folder for correct download URL
            const filePath = path_1.default.basename(result.path);
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
        }
        catch (error) {
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
    const job = await imageQueue_1.resizeQueue.add({
        filePath: req.file.path,
        width: widthValue,
        height: heightValue,
        fit: fit,
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
        await job.update({
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
exports.convertImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
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
    const redisAvailable = await (0, imageQueue_1.isRedisActuallyAvailable)();
    // If Redis is not available, process the image directly
    if (redisAvailable === false) {
        console.log('Processing conversion directly (Redis not available)');
        try {
            const result = await (0, imageService_1.convertImageService)(req.file.path, format);
            // Set the filePath to include the 'processed' folder for correct download URL
            const filePath = path_1.default.basename(result.path);
            return res.status(200).json({
                status: 'success',
                data: {
                    originalFormat: path_1.default.extname(originalFilename).substring(1),
                    convertedFormat: format,
                    mime: result.mime,
                    filename: filePath,
                    originalFilename,
                    downloadUrl: `/api/images/download/${filePath}?originalFilename=${encodeURIComponent(originalFilename.replace(/\.[^/.]+$/, `.${format}`))}`
                }
            });
        }
        catch (error) {
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
    const job = await imageQueue_1.convertQueue.add({
        filePath: req.file.path,
        format: format,
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
        await job.update({
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
exports.cropImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
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
    const leftValue = parseInt(left);
    const topValue = parseInt(top);
    const widthValue = parseInt(width);
    const heightValue = parseInt(height);
    console.log('Crop request received:');
    console.log('- File:', req.file.originalname);
    console.log('- Crop area:', leftValue, topValue, widthValue, heightValue);
    // Store original filename for download
    const originalFilename = req.file.originalname;
    // Check Redis availability - now with async call
    const redisAvailable = await (0, imageQueue_1.isRedisActuallyAvailable)();
    // If Redis is not available, process the image directly
    if (redisAvailable === false) {
        console.log('Processing crop directly (Redis not available)');
        try {
            const result = await (0, imageService_1.cropImageService)(req.file.path, leftValue, topValue, widthValue, heightValue);
            // Set the filePath to include the 'processed' folder for correct download URL
            const filePath = path_1.default.basename(result.path);
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
        }
        catch (error) {
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
    const job = await imageQueue_1.cropQueue.add({
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
        await job.update({
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
exports.optimizeBlogImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            message: 'Please upload an image'
        });
    }
    try {
        const file = req.file;
        const quality = parseInt(req.body.quality) || 80;
        const format = req.body.format || 'webp';
        // Check if this is a featured image or regular content image
        const isFeatured = req.body.isFeatured === 'true';
        // Import sharp without TypeScript issues
        const sharp = require('sharp');
        let processor = sharp(file.buffer);
        // Apply resize based on image type
        if (isFeatured) {
            // Featured images should be 1200x630 (social sharing optimized)
            processor = processor.resize(1200, 630, { fit: 'cover' });
        }
        else {
            // Regular blog images should be max 800px wide, maintain aspect ratio
            processor = processor.resize(800, null, { fit: 'inside' });
        }
        // Apply format with quality
        let processedImageBuffer;
        if (format === 'webp') {
            processedImageBuffer = await processor.webp({ quality }).toBuffer();
        }
        else if (format === 'jpeg' || format === 'jpg') {
            processedImageBuffer = await processor.jpeg({ quality }).toBuffer();
        }
        else if (format === 'png') {
            processedImageBuffer = await processor.png({ quality }).toBuffer();
        }
        else {
            processedImageBuffer = await processor.webp({ quality }).toBuffer();
        }
        // Return the processed image
        res.set('Content-Type', `image/${format}`);
        res.set('Content-Disposition', `attachment; filename="optimized-${file.originalname}.${format}"`);
        res.send(processedImageBuffer);
    }
    catch (error) {
        console.error('Error optimizing blog image:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error processing image'
        });
    }
});
//# sourceMappingURL=imageController.js.map