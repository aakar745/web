"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUploadSettings = exports.getRateLimitSettings = exports.updateSystemSettings = exports.getSystemSettings = exports.cleanupImages = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const cleanupToolImages_1 = __importDefault(require("../scripts/cleanupToolImages"));
const logger_1 = __importDefault(require("../utils/logger"));
const loadBalancer_1 = require("../middleware/loadBalancer");
const SystemSettings_1 = __importDefault(require("../models/SystemSettings"));
const settingsService_1 = require("../services/settingsService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Run image cleanup and optionally set up scheduled task
 */
exports.cleanupImages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get options from request body
        const { setupAutoCleanup = false, emergencyMode = false } = req.body;
        // Check if system is under high load for automatic emergency mode
        const isHighLoad = await (0, loadBalancer_1.isSystemUnderHighLoad)();
        const shouldUseEmergencyMode = emergencyMode || isHighLoad;
        if (shouldUseEmergencyMode) {
            logger_1.default.warn('Running cleanup in emergency mode due to high system load');
        }
        // Run immediate cleanup
        logger_1.default.info('Manual cleanup triggered from admin panel');
        const cleanupResults = await (0, cleanupToolImages_1.default)();
        // Set up scheduled task if requested
        let scheduledTaskResult = null;
        if (setupAutoCleanup) {
            try {
                // Check if task already exists
                const { stdout: taskCheckOutput } = await execPromise('schtasks /query /tn "WebTools Image Cleanup" 2>&1');
                if (taskCheckOutput.includes('ERROR:')) {
                    // Task doesn't exist, create it
                    const scriptPath = path_1.default.resolve(__dirname, '../../../cleanup-images.bat');
                    // Create daily task at 3:00 AM
                    const { stdout, stderr } = await execPromise(`schtasks /create /tn "WebTools Image Cleanup" /tr "${scriptPath}" /sc DAILY /st 03:00 /ru SYSTEM /f`);
                    scheduledTaskResult = {
                        success: true,
                        message: 'Automatic cleanup scheduled daily at 3:00 AM'
                    };
                    logger_1.default.info('Automatic cleanup task created successfully');
                }
                else {
                    // Task already exists
                    scheduledTaskResult = {
                        success: true,
                        message: 'Automatic cleanup was already configured'
                    };
                    logger_1.default.info('Automatic cleanup task already exists');
                }
            }
            catch (taskError) {
                logger_1.default.error('Failed to set up scheduled task:', taskError);
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
    }
    catch (error) {
        logger_1.default.error('Image cleanup failed:', error);
        res.status(500).json({
            status: 'error',
            message: `Failed to perform image cleanup: ${error.message}`
        });
    }
});
/**
 * Get system settings
 */
exports.getSystemSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const settings = await SystemSettings_1.default.getCurrentSettings();
        res.status(200).json({
            status: 'success',
            data: {
                settings
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get system settings:', error);
        res.status(500).json({
            status: 'error',
            message: `Failed to get system settings: ${error.message}`
        });
    }
});
/**
 * Update system settings
 */
exports.updateSystemSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const updates = req.body;
        // Update settings
        const settings = await SystemSettings_1.default.updateSettings(updates);
        logger_1.default.info('System settings updated by admin:', {
            updates,
            updatedBy: req.user?.email || 'Unknown'
        });
        // Clear settings cache
        (0, settingsService_1.clearSettingsCache)();
        // Clear rate limit cache
        (0, rateLimiter_1.clearRateLimitCache)();
        res.status(200).json({
            status: 'success',
            data: {
                settings,
                message: 'Settings updated successfully. Changes will take effect for new requests.'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update system settings:', error);
        // Check if it's a validation error
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
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
exports.getRateLimitSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const settings = await SystemSettings_1.default.getCurrentSettings();
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
    }
    catch (error) {
        logger_1.default.error('Failed to get rate limit settings:', error);
        res.status(500).json({
            status: 'error',
            message: `Failed to get rate limit settings: ${error.message}`
        });
    }
});
/**
 * Get file upload settings for frontend display
 */
exports.getFileUploadSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const settings = await SystemSettings_1.default.getCurrentSettings();
        res.status(200).json({
            status: 'success',
            data: {
                maxFileSize: settings.maxFileSize,
                maxFiles: settings.maxFiles
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get file upload settings:', error);
        res.status(500).json({
            status: 'error',
            message: `Failed to get file upload settings: ${error.message}`
        });
    }
});
//# sourceMappingURL=adminController.js.map