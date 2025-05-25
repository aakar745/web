"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupImages = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const cleanupToolImages_1 = __importDefault(require("../scripts/cleanupToolImages"));
const logger_1 = __importDefault(require("../utils/logger"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Run image cleanup and optionally set up scheduled task
 */
exports.cleanupImages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Get options from request body
        const { setupAutoCleanup = false } = req.body;
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
//# sourceMappingURL=adminController.js.map