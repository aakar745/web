"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullConfig = exports.redisConfig = exports.isRedisAvailable = exports.redisStatusObserver = void 0;
exports.testRedisConnection = testRedisConnection;
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const events_1 = require("events");
dotenv_1.default.config();
// Status observer to emit events when Redis status changes
exports.redisStatusObserver = new events_1.EventEmitter();
// Redis availability flag - will be set to false if Redis connection fails
exports.isRedisAvailable = false; // Default to false until verified
// Flag to prevent excessive error logging
let redisConnectionErrorLogged = false;
// Flag to track last known Redis status (for detecting changes)
let lastKnownRedisStatus = false;
// Add stability counters to prevent rapid oscillation
let consecutiveSuccesses = 0;
let consecutiveFailures = 0;
const STABILITY_THRESHOLD = 3; // Decreased threshold for faster detection
// Add debug logging
function logDebug(message) {
    console.log(`[Redis Debug] ${message}`);
}
// Function to test Redis connection
async function testRedisConnection() {
    return new Promise((resolve) => {
        try {
            // Use localhost since Docker is exposing Redis on localhost
            const redisHost = process.env.REDIS_HOST || 'localhost';
            const redisPort = parseInt(process.env.REDIS_PORT || '6379');
            // Log the connection attempt
            logDebug(`Attempting to connect to Redis at ${redisHost}:${redisPort}`);
            // Create Redis client using proper import
            const testClient = (0, redis_1.createClient)({
                url: `redis://${process.env.REDIS_USERNAME ? process.env.REDIS_USERNAME + ':' + process.env.REDIS_PASSWORD + '@' : ''}${redisHost}:${redisPort}/${process.env.REDIS_DB || '0'}`,
            });
            // Set timeout to prevent hanging
            const timeout = setTimeout(() => {
                testClient.quit().catch(() => { });
                if (!redisConnectionErrorLogged) {
                    console.warn('Redis connection test timed out after 3 seconds');
                    redisConnectionErrorLogged = true;
                }
                handleFailure();
                resolve(false);
            }, 3000);
            // Set up event handlers
            testClient.on('error', (err) => {
                clearTimeout(timeout);
                testClient.quit().catch(() => { });
                // Only log the error if we haven't logged it yet
                if (!redisConnectionErrorLogged) {
                    console.warn('Redis connection test failed:', err.message);
                    redisConnectionErrorLogged = true;
                }
                handleFailure();
                resolve(false);
            });
            testClient.on('ready', () => {
                clearTimeout(timeout);
                testClient.quit().catch(() => { });
                console.log('Redis connection test succeeded');
                // Reset the error logged flag when we successfully connect
                redisConnectionErrorLogged = false;
                handleSuccess();
                resolve(exports.isRedisAvailable); // Return the stabilized status
            });
            testClient.connect().catch(err => {
                clearTimeout(timeout);
                if (!redisConnectionErrorLogged) {
                    console.warn('Redis connection test failed during connect:', err.message);
                    redisConnectionErrorLogged = true;
                }
                handleFailure();
                resolve(false);
            });
        }
        catch (error) {
            if (!redisConnectionErrorLogged) {
                console.warn('Redis connection test failed (exception):', error);
                redisConnectionErrorLogged = true;
            }
            handleFailure();
            resolve(false);
        }
    });
}
// Function to handle success with stability counter
function handleSuccess() {
    consecutiveSuccesses++;
    consecutiveFailures = 0;
    logDebug(`Success counter: ${consecutiveSuccesses}/${STABILITY_THRESHOLD}, Failure counter: ${consecutiveFailures}/${STABILITY_THRESHOLD}`);
    // Only update status after multiple consecutive successes
    if (consecutiveSuccesses >= STABILITY_THRESHOLD && !exports.isRedisAvailable) {
        updateRedisStatus(true);
    }
}
// Function to handle failure with stability counter
function handleFailure() {
    consecutiveFailures++;
    consecutiveSuccesses = 0;
    logDebug(`Success counter: ${consecutiveSuccesses}/${STABILITY_THRESHOLD}, Failure counter: ${consecutiveFailures}/${STABILITY_THRESHOLD}`);
    // Only update status after multiple consecutive failures
    if (consecutiveFailures >= STABILITY_THRESHOLD && exports.isRedisAvailable) {
        updateRedisStatus(false);
    }
}
// Function to update Redis status and emit events when it changes
function updateRedisStatus(status) {
    // Update the global flag
    exports.isRedisAvailable = status;
    // Emit an event if the status changed
    if (status !== lastKnownRedisStatus) {
        console.log(`Redis status changed: ${status ? 'AVAILABLE' : 'UNAVAILABLE'}`);
        lastKnownRedisStatus = status;
        exports.redisStatusObserver.emit('statusChanged', status);
    }
}
// Test the connection on module load
testRedisConnection().catch(err => {
    if (!redisConnectionErrorLogged) {
        console.warn('Redis initial connection test failed:', err);
        redisConnectionErrorLogged = true;
    }
    handleFailure();
});
// Start periodic Redis connectivity checks
const REDIS_CHECK_INTERVAL = 5000; // 5 seconds
setInterval(() => {
    testRedisConnection().catch(err => {
        // Error is already logged in the function
        handleFailure();
    });
}, REDIS_CHECK_INTERVAL);
/**
 * Redis configuration for the job queue
 */
exports.redisConfig = {
    // Use localhost since Docker is exposing Redis on localhost
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    // Default to Redis database 0
    db: parseInt(process.env.REDIS_DB || '0'),
    // Connection retry settings
    maxRetriesPerRequest: 1, // Reduce retries to fail faster
    retryStrategy: (times) => {
        if (times >= 2) {
            // If we've failed to connect 2 times, mark Redis as unavailable
            if (!redisConnectionErrorLogged) {
                console.warn('Redis connection failed after 2 attempts. Operating in local-only mode.');
                redisConnectionErrorLogged = true;
            }
            handleFailure();
            return null; // Stop trying to reconnect
        }
        // Quick backoff
        return 500; // Retry after 500ms
    },
    // Adding connection timeout to prevent hanging
    connectTimeout: 3000,
    // Disable auto reconnect to avoid locking up
    enableAutoPipelining: false,
    disableOfflineQueue: true,
};
// Connection settings for Bull queues
exports.bullConfig = {
    redis: exports.redisConfig,
    // Bull queue settings
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 100, // Keep last 100 failed jobs
        timeout: 5 * 60 * 1000, // 5 minutes timeout
    },
};
//# sourceMappingURL=redis.js.map