/**
 * Worker process entry point
 * 
 * This file is used to start the worker processes that handle image processing jobs.
 * It can be run as a separate process to handle jobs in the background.
 */

import { compressQueue, resizeQueue, convertQueue, cropQueue, cleanOldJobs } from '../queues/imageQueue';
import './imageWorker';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine how many jobs to process concurrently (per queue)
// Default to number of available CPUs - 1 (leave one for the main process)
import os from 'os';
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || String(Math.max(1, os.cpus().length - 1)));

// Set concurrency for each queue
// Need to use type assertion since the type definition is incomplete
(compressQueue as any).concurrency = concurrency;
(resizeQueue as any).concurrency = concurrency;
(convertQueue as any).concurrency = concurrency;
(cropQueue as any).concurrency = concurrency;

// Log worker startup
console.log(`[Worker] Starting image processing workers with concurrency: ${concurrency}`);
console.log(`[Worker] Listening for jobs on queues: compression, resize, conversion, crop`);

// Clean old jobs on startup and then every day
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
cleanOldJobs().catch(err => console.error('Error cleaning old jobs:', err));
setInterval(() => {
  cleanOldJobs().catch(err => console.error('Error cleaning old jobs:', err));
}, CLEANUP_INTERVAL);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...');
  
  // Close all queue connections
  await Promise.all([
    compressQueue.close(),
    resizeQueue.close(),
    convertQueue.close(),
    cropQueue.close(),
  ]);
  
  console.log('[Worker] All queue connections closed, exiting.');
  process.exit(0);
});

// Export queues for testing or direct access
export {
  compressQueue,
  resizeQueue,
  convertQueue,
  cropQueue,
}; 