import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './config/database';
import imageRoutes from './routes/imageRoutes';
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';
import mediaRoutes from './routes/mediaRoutes';
import adminRoutes from './routes/adminRoutes';
import { upload, validateImageDimensions } from './middleware/upload';
import { config } from './config/env';
import { loadBalancer } from './middleware/loadBalancer';
import { cleanOldJobs, isRedisActuallyAvailable } from './queues/imageQueue';
import { isRedisAvailable, testRedisConnection } from './config/redis';
import './workers/imageWorker'; // Register workers in the main process
import healthRoutes from './routes/healthRoutes';
import { cleanupDeadLetterQueue } from './queues/deadLetterQueue';
import monitoringRoutes from './routes/monitoringRoutes';
import commentRoutes from './routes/commentRoutes';
import seoRoutes from './routes/seoRoutes';
import scriptsRoutes from './routes/scripts';
import { noCacheAPI, shortCacheAPI, healthCacheAPI, addVersionHeaders } from './middleware/cacheControl';
import { initializeSchedulers } from './services/cleanupScheduler';

// Load environment variables
dotenv.config();

// Create our express app early
const app = express();
const port = process.env.PORT || 5000;

// Define uploads path
const uploadsPath = path.join(__dirname, '../uploads');
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
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(helmet({
      crossOriginResourcePolicy: false, // Allow cross-origin resource sharing for images
    })); 
    app.use(morgan('dev')); // Logging
    app.use(express.json({ limit: '10mb' })); // Increased JSON limit for larger payloads
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Serve static files from uploads directory
    app.use('/uploads', express.static(uploadsPath));
    
    // Ensure blogs subdirectory is also accessible
    app.use('/uploads/blogs', express.static(path.join(uploadsPath, 'blogs')));
    
    // Serve frontend public files (favicon, manifest, etc.)
    const frontendPublicPath = path.join(__dirname, '../../frontend/public');
    app.use(express.static(frontendPublicPath, { 
      maxAge: '1d'
    }));
    
    // Serve Next.js static files
    app.use('/_next', express.static(path.join(__dirname, '../public/static')));
    app.use('/static', express.static(path.join(__dirname, '../public/static')));
    
    // Apply load balancer middleware for graceful degradation
    app.use('/api/', loadBalancer);
    
    // ===== CACHE CONTROL FIX =====
    // Prevent browser caching of API responses to avoid stale data issues
    app.use('/api/', noCacheAPI);
    
    // Add version headers for cache busting
    app.use('/api/', addVersionHeaders);
    
    // Connect to MongoDB in the background, but don't block server startup
    connectDB().catch(err => {
      console.error('MongoDB connection failed, but server will continue:', err);
      // We're not exiting the process anymore, allowing the server to run
      // even without MongoDB for stateless operations
    });
    
    // Initialize scheduler system after database connection attempt
    initializeSchedulers().catch(err => {
      console.error('Scheduler initialization failed:', err);
      // Don't exit - server can run without schedulers
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
      },
      upload.single('image'), 
      validateImageDimensions, 
      (req, res) => {
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
    app.use('/api/auth', authRoutes);
    app.use('/api/blogs', blogRoutes);
    app.use('/api/images', imageRoutes);
    app.use('/api/media', mediaRoutes);
    app.use('/api/health', healthCacheAPI, healthRoutes); // Health checks can cache briefly
    app.use('/api/monitoring', monitoringRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/seo', seoRoutes);
    app.use('/api/scripts', scriptsRoutes);
    
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
      } catch (error) {
        console.error('Error serving frontend:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    // Error handling middleware
    app.use(errorHandler);
    
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
          const redisStatus = await testRedisConnection();
          console.log(`🔄 Processing mode: ${redisStatus ? 'Queued (Redis)' : 'Direct (Local)'}`);
          
          // Clean up old jobs at startup if Redis is available
          if (redisStatus) {
            cleanOldJobs().catch(err => console.error('Failed to clean old jobs:', err));
          }
          
          // Try to clean up dead letter queue periodically
          setInterval(async () => {
            try {
              if (await testRedisConnection()) {
                await cleanupDeadLetterQueue();
              }
            } catch (err) {
              // Silent fail - don't spam logs
            }
          }, 10 * 60 * 1000); // Every 10 minutes
          
        } catch (err) {
          console.error('Error during Redis status check:', err);
        }
      }, 3000); // 3 second delay to allow Redis connection to stabilize
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
}); 