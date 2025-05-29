"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("./config/database");
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const upload_1 = require("./middleware/upload");
const loadBalancer_1 = require("./middleware/loadBalancer");
const imageQueue_1 = require("./queues/imageQueue");
const redis_1 = require("./config/redis");
require("./workers/imageWorker"); // Register workers in the main process
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const monitoringRoutes_1 = __importDefault(require("./routes/monitoringRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const seoRoutes_1 = __importDefault(require("./routes/seoRoutes"));
const scripts_1 = __importDefault(require("./routes/scripts"));
const cacheControl_1 = require("./middleware/cacheControl");
// Load environment variables
dotenv_1.default.config();
// Create our express app early
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Define uploads path
const uploadsPath = path_1.default.join(__dirname, '../uploads');
console.log('Uploads directory path:', uploadsPath);
// Set up a domain to catch uncaught errors and prevent server crashes
const domain = require('domain').create();
domain.on('error', (err) => {
    console.error('Uncaught error in domain:', err);
    // Don't crash the server, just log the error
});
domain.run(async () => {
    try {
        // CORS configuration
        app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: false, // Allow cross-origin resource sharing for images
        }));
        app.use((0, morgan_1.default)('dev')); // Logging
        app.use(express_1.default.json({ limit: '10mb' })); // Increased JSON limit for larger payloads
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Serve static files from uploads directory
        app.use('/uploads', express_1.default.static(uploadsPath));
        // Ensure blogs subdirectory is also accessible
        app.use('/uploads/blogs', express_1.default.static(path_1.default.join(uploadsPath, 'blogs')));
        // Serve Next.js static files
        app.use('/_next', express_1.default.static(path_1.default.join(__dirname, '../public/static')));
        app.use('/static', express_1.default.static(path_1.default.join(__dirname, '../public/static')));
        // Remove general API rate limiting - we only want to limit specific tools
        // app.use('/api/', apiLimiter);
        // Apply load balancer middleware for graceful degradation
        app.use('/api/', loadBalancer_1.loadBalancer);
        // ===== CACHE CONTROL FIX =====
        // Prevent browser caching of API responses to avoid stale data issues
        app.use('/api/', cacheControl_1.noCacheAPI);
        // Add version headers for cache busting
        app.use('/api/', cacheControl_1.addVersionHeaders);
        // Health checks moved to dedicated routes at /api/health
        // See healthRoutes.ts for implementation
        // Connect to MongoDB in the background, but don't block server startup
        (0, database_1.connectDB)().catch(err => {
            console.error('MongoDB connection failed, but server will continue:', err);
            // We're not exiting the process anymore, allowing the server to run
            // even without MongoDB for stateless operations
        });
        // Upload endpoint for blog images
        app.post('/api/upload', 
        // Add middleware to handle type parameters before multer processes the file
        (req, res, next) => {
            // If type is in query params, transfer it to req.body
            // This ensures it's available during the multer storage configuration
            if (req.query.type && !req.body) {
                req.body = {};
            }
            if (req.query.type) {
                req.body.type = req.query.type;
            }
            next();
        }, upload_1.upload.single('image'), upload_1.validateImageDimensions, (req, res) => {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No file uploaded'
                });
            }
            const isBlogImage = req.query.type === 'blog' || (req.body && req.body.type === 'blog');
            console.log('Blog image uploaded:', req.file.filename, isBlogImage ? '(blog image)' : '');
            // Determine the correct path (blogs directory for blog images)
            const filePath = isBlogImage ?
                `/uploads/blogs/${req.file.filename}` :
                `/uploads/${req.file.filename}`;
            // Return the URL to the uploaded file - now includes /blogs in the path if it's a blog image
            const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;
            res.status(200).json({
                status: 'success',
                data: {
                    fileUrl,
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    size: req.file.size
                }
            });
        });
        // Mount routes with appropriate cache control
        app.use('/api/auth', authRoutes_1.default);
        app.use('/api/blogs', blogRoutes_1.default);
        app.use('/api/images', imageRoutes_1.default);
        app.use('/api/media', mediaRoutes_1.default);
        app.use('/api/health', cacheControl_1.healthCacheAPI, healthRoutes_1.default); // Health checks can cache briefly
        app.use('/api/monitoring', monitoringRoutes_1.default);
        app.use('/api/admin', adminRoutes_1.default);
        app.use('/api/comments', commentRoutes_1.default);
        app.use('/api/seo', seoRoutes_1.default);
        app.use('/api/scripts', scripts_1.default);
        // Add a catch-all route for Next.js frontend - after all API routes
        app.get('*', (req, res) => {
            // Skip API routes that weren't handled by the API routers
            if (req.path.startsWith('/api/')) {
                return res.status(404).send('API endpoint not found');
            }
            try {
                // Create a fallback HTML that loads the Next.js client
                const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Web Tools</title>
              <script>
                window.location.href = '/dashboard';
              </script>
            </head>
            <body>
              <div id="__next">Loading...</div>
            </body>
          </html>
        `;
                res.send(html);
            }
            catch (error) {
                console.error('Error serving frontend:', error);
                res.status(500).send('Internal Server Error');
            }
        });
        // Error handling middleware
        app.use(errorHandler_1.errorHandler);
        // Start server
        const server = app.listen(port, () => {
            console.log(`✨ Server running on http://localhost:${port}`);
            console.log(`👉 API documentation: http://localhost:${port}/api/docs`);
            console.log(`🔒 Auth routes: http://localhost:${port}/api/auth`);
            console.log(`📝 Blog routes: http://localhost:${port}/api/blogs`);
            console.log(`🖼️ Media routes: http://localhost:${port}/api/media`);
            console.log(`🔍 Health check: http://localhost:${port}/api/health`);
            console.log(`⚙️ Admin routes: http://localhost:${port}/api/admin`);
            // Delay printing processing mode until Redis availability is confirmed
            // Allow some time for Redis connection to be established or failed
            setTimeout(async () => {
                try {
                    // Force a re-check of Redis status before logging
                    const redisStatus = await (0, redis_1.testRedisConnection)();
                    console.log(`🔄 Processing mode: ${redisStatus ? 'Queued (Redis)' : 'Direct (Local)'}`);
                    // Clean up old jobs at startup if Redis is available
                    if (redisStatus) {
                        (0, imageQueue_1.cleanOldJobs)().catch(err => console.error('Failed to clean old jobs:', err));
                    }
                    // Set up periodic Redis status check to update processing mode
                    let lastKnownRedisStatus = redisStatus;
                    const redisCheckInterval = setInterval(async () => {
                        try {
                            const currentRedisStatus = await (0, redis_1.testRedisConnection)();
                            // If Redis status changed, log the change
                            if (currentRedisStatus !== lastKnownRedisStatus) {
                                console.log(`🔄 Processing mode changed: ${currentRedisStatus ? 'Queued (Redis)' : 'Direct (Local)'}`);
                                // If Redis became available, clean up old jobs
                                if (currentRedisStatus) {
                                    (0, imageQueue_1.cleanOldJobs)().catch(err => console.error('Failed to clean old jobs after Redis became available:', err));
                                }
                                // Update the last known status
                                lastKnownRedisStatus = currentRedisStatus;
                            }
                        }
                        catch (err) {
                            // Error already logged in testRedisConnection
                        }
                    }, 10000); // Check every 10 seconds
                    // Make sure it doesn't prevent the Node.js process from exiting
                    if (redisCheckInterval.unref) {
                        redisCheckInterval.unref();
                    }
                }
                catch (err) {
                    console.error('Error checking Redis status:', err);
                    console.log('🔄 Processing mode: Direct (Local) - Redis check failed');
                }
            }, 2000);
        });
        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Error during server startup:', error);
        // Keep the server running despite errors
    }
});
//# sourceMappingURL=index.js.map