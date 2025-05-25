"use strict";
/**
 * Script to clean up temporary tool images
 *
 * This script is designed to be run as a cron job periodically to remove
 * tool-generated images that are no longer needed. It preserves blog images
 * which are now stored in the /uploads/blogs directory.
 *
 * Usage:
 * - Manual run: ts-node src/scripts/cleanupToolImages.ts
 * - Or set up as a cron job
 *
 * Configuration:
 * - RETENTION_DAYS: Number of days to keep temporary images before deletion
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
// Configuration
const RETENTION_DAYS = 0; // Keep temporary images for 7 days by default
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Paths
const BASE_DIR = path_1.default.resolve(__dirname, '../../uploads');
const PROCESSED_DIR = path_1.default.join(BASE_DIR, 'processed');
const ARCHIVES_DIR = path_1.default.join(BASE_DIR, 'archives');
const BLOGS_DIR = path_1.default.join(BASE_DIR, 'blogs');
/**
 * Delete files older than the retention period with the specified prefix
 */
async function cleanDirectory(directory, prefix, excludePrefix) {
    try {
        console.log(`Cleaning directory: ${directory}`);
        // Check if directory exists
        if (!(0, fs_1.existsSync)(directory)) {
            console.log(`Directory ${directory} does not exist, creating it...`);
            await promises_1.default.mkdir(directory, { recursive: true });
            return {
                directory,
                deletedCount: 0,
                totalSize: 0,
                sizeFormatted: '0 Bytes'
            };
        }
        // Get current time for comparison
        const now = Date.now();
        const cutoffTime = now - (RETENTION_DAYS * MS_PER_DAY);
        // Read all files in the directory
        const files = await promises_1.default.readdir(directory);
        let deletedCount = 0;
        let totalSize = 0;
        for (const file of files) {
            // Check if file matches our criteria
            const shouldProcess = excludePrefix
                ? !file.startsWith(excludePrefix) // If excludePrefix is provided, process files NOT starting with it
                : prefix === '' || file.startsWith(prefix); // If prefix is empty, process all files, otherwise check prefix
            if (shouldProcess) {
                const filePath = path_1.default.join(directory, file);
                try {
                    // Get file stats
                    const stats = await promises_1.default.stat(filePath);
                    // Skip directories
                    if (stats.isDirectory()) {
                        continue;
                    }
                    // Check if file is older than retention period
                    if (stats.mtimeMs < cutoffTime) {
                        const fileSize = stats.size;
                        totalSize += fileSize;
                        // Delete the file
                        await promises_1.default.unlink(filePath);
                        deletedCount++;
                        console.log(`Deleted: ${file} (${formatSize(fileSize)})`);
                    }
                }
                catch (fileError) {
                    console.error(`Error processing file ${filePath}:`, fileError);
                    // Continue with other files
                }
            }
        }
        console.log(`Cleanup complete for ${directory}:`);
        console.log(`- ${deletedCount} files deleted`);
        console.log(`- ${formatSize(totalSize)} recovered`);
        return {
            directory,
            deletedCount,
            totalSize,
            sizeFormatted: formatSize(totalSize)
        };
    }
    catch (error) {
        console.error(`Error cleaning directory ${directory}:`, error);
        return {
            directory,
            deletedCount: 0,
            totalSize: 0,
            sizeFormatted: '0 Bytes'
        };
    }
}
/**
 * Format file size in human-readable format
 */
function formatSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Main function to run the cleanup
 */
async function main() {
    try {
        console.log('Starting tool image cleanup');
        console.log(`Retention period: ${RETENTION_DAYS} days`);
        // Ensure all required directories exist
        for (const dir of [BASE_DIR, PROCESSED_DIR, ARCHIVES_DIR, BLOGS_DIR]) {
            if (!(0, fs_1.existsSync)(dir)) {
                console.log(`Creating directory: ${dir}`);
                await promises_1.default.mkdir(dir, { recursive: true });
            }
        }
        // Clean processed directory (tool-*.*)
        const processedResult = await cleanDirectory(PROCESSED_DIR, 'tool-');
        // Clean archives directory (tool-*.zip)
        const archivesResult = await cleanDirectory(ARCHIVES_DIR, 'tool-');
        // Clean main uploads directory (all files except those in subdirectories)
        // We'll need to check if a path is a directory before trying to clean it
        const uploadsResult = await cleanMainDirectory();
        // Calculate totals
        const totalDeletedCount = processedResult.deletedCount + archivesResult.deletedCount + uploadsResult.deletedCount;
        const totalSize = processedResult.totalSize + archivesResult.totalSize + uploadsResult.totalSize;
        console.log(`Total files deleted: ${totalDeletedCount}`);
        console.log(`Total space recovered: ${formatSize(totalSize)}`);
        console.log('Cleanup completed successfully');
        return {
            processedFiles: processedResult,
            archiveFiles: archivesResult,
            uploadedFiles: uploadsResult,
            totalDeleted: totalDeletedCount,
            totalSizeRecovered: formatSize(totalSize)
        };
    }
    catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
    }
}
/**
 * Special function to clean the main uploads directory
 * This will skip any subdirectories like blogs/
 */
async function cleanMainDirectory() {
    try {
        console.log(`Cleaning directory: ${BASE_DIR}`);
        // Check if directory exists
        if (!(0, fs_1.existsSync)(BASE_DIR)) {
            console.log(`Directory ${BASE_DIR} does not exist, creating it...`);
            await promises_1.default.mkdir(BASE_DIR, { recursive: true });
            return {
                directory: BASE_DIR,
                deletedCount: 0,
                totalSize: 0,
                sizeFormatted: '0 Bytes'
            };
        }
        // Get current time for comparison
        const now = Date.now();
        const cutoffTime = now - (RETENTION_DAYS * MS_PER_DAY);
        // Read all files in the directory
        const files = await promises_1.default.readdir(BASE_DIR);
        let deletedCount = 0;
        let totalSize = 0;
        for (const file of files) {
            const filePath = path_1.default.join(BASE_DIR, file);
            try {
                // Get file stats
                const stats = await promises_1.default.stat(filePath);
                // Skip directories and files that start with 'blog-'
                if (stats.isDirectory()) {
                    continue;
                }
                // Check if file is older than retention period
                if (stats.mtimeMs < cutoffTime) {
                    const fileSize = stats.size;
                    totalSize += fileSize;
                    // Delete the file
                    await promises_1.default.unlink(filePath);
                    deletedCount++;
                    console.log(`Deleted: ${file} (${formatSize(fileSize)})`);
                }
            }
            catch (fileError) {
                console.error(`Error processing file ${filePath}:`, fileError);
                // Continue with other files
            }
        }
        console.log(`Cleanup complete for ${BASE_DIR}:`);
        console.log(`- ${deletedCount} files deleted`);
        console.log(`- ${formatSize(totalSize)} recovered`);
        return {
            directory: BASE_DIR,
            deletedCount,
            totalSize,
            sizeFormatted: formatSize(totalSize)
        };
    }
    catch (error) {
        console.error(`Error cleaning directory ${BASE_DIR}:`, error);
        return {
            directory: BASE_DIR,
            deletedCount: 0,
            totalSize: 0,
            sizeFormatted: '0 Bytes'
        };
    }
}
// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('Cleanup failed:', error);
        process.exit(1);
    });
}
exports.default = main;
//# sourceMappingURL=cleanupToolImages.js.map