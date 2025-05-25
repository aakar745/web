"use strict";
/**
 * Worker process entry point
 *
 * This file is used to start the worker processes that handle image processing jobs.
 * It can be run as a separate process to handle jobs in the background.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropQueue = exports.convertQueue = exports.resizeQueue = exports.compressQueue = void 0;
const imageQueue_1 = require("../queues/imageQueue");
Object.defineProperty(exports, "compressQueue", { enumerable: true, get: function () { return imageQueue_1.compressQueue; } });
Object.defineProperty(exports, "resizeQueue", { enumerable: true, get: function () { return imageQueue_1.resizeQueue; } });
Object.defineProperty(exports, "convertQueue", { enumerable: true, get: function () { return imageQueue_1.convertQueue; } });
Object.defineProperty(exports, "cropQueue", { enumerable: true, get: function () { return imageQueue_1.cropQueue; } });
require("./imageWorker");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Determine how many jobs to process concurrently (per queue)
// Default to number of available CPUs - 1 (leave one for the main process)
const os_1 = __importDefault(require("os"));
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || String(Math.max(1, os_1.default.cpus().length - 1)));
// Set concurrency for each queue
// Need to use type assertion since the type definition is incomplete
imageQueue_1.compressQueue.concurrency = concurrency;
imageQueue_1.resizeQueue.concurrency = concurrency;
imageQueue_1.convertQueue.concurrency = concurrency;
imageQueue_1.cropQueue.concurrency = concurrency;
// Log worker startup
console.log(`[Worker] Starting image processing workers with concurrency: ${concurrency}`);
console.log(`[Worker] Listening for jobs on queues: compression, resize, conversion, crop`);
// Clean old jobs on startup and then every day
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
(0, imageQueue_1.cleanOldJobs)().catch(err => console.error('Error cleaning old jobs:', err));
setInterval(() => {
    (0, imageQueue_1.cleanOldJobs)().catch(err => console.error('Error cleaning old jobs:', err));
}, CLEANUP_INTERVAL);
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Worker] Received SIGTERM, shutting down gracefully...');
    // Close all queue connections
    await Promise.all([
        imageQueue_1.compressQueue.close(),
        imageQueue_1.resizeQueue.close(),
        imageQueue_1.convertQueue.close(),
        imageQueue_1.cropQueue.close(),
    ]);
    console.log('[Worker] All queue connections closed, exiting.');
    process.exit(0);
});
//# sourceMappingURL=index.js.map