# Web Tools Production Deployment Guide

This guide explains how to deploy the Web Tools application to a production environment using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your production server
- Git installed for pulling code from your repository
- Basic understanding of Docker and containerization

## Environment Variables

Before deployment, create a `.env` file in the project root with the following variables:

```
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://mongo:27017/webtools

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Settings
FRONTEND_URL=http://localhost

# Worker Configuration
WORKER_CONCURRENCY=2

# Logging
LOG_LEVEL=info
```

Make sure to replace `your-secret-key-here` with a strong, unique secret key for JWT authentication.

## Deployment Steps

1. **Clone your repository to the production server:**

   ```bash
   git clone https://github.com/yourusername/web-tools.git
   cd web-tools
   ```

2. **Create the `.env` file with your production settings**

3. **Build and start the application:**

   ```bash
   docker-compose up -d --build
   ```

4. **Verify the deployment:**

   Access your application at `http://your-server-ip` (or domain name if configured)

## Deployment Architecture

The application consists of the following containers:

- **app**: Main application container serving both backend API and frontend
- **worker**: Worker process for background image processing tasks
- **redis**: Redis for job queue and caching
- **mongo**: MongoDB database for persistent storage

## Data Persistence

The following Docker volumes ensure data persistence:

- **redis_data**: Redis data
- **mongo_data**: MongoDB database files
- **uploads**: User uploaded files and processed images
- **logs**: Application logs

## Scaling

To scale the worker processes for higher load, use:

```bash
docker-compose up -d --scale worker=3
```

## Monitoring

The application exposes health endpoints:

- `http://your-server-ip/api/health` - Overall system health
- `http://your-server-ip/api/monitoring/system-health` - Detailed system status

## Updating the Application

To update to a new version:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart containers:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Backup

### Database Backup

```bash
docker exec -it web-tools_mongo_1 mongodump --out /dump
docker cp web-tools_mongo_1:/dump ./backup/mongo_$(date +%Y%m%d)
```

### Uploads Backup

```bash
docker cp web-tools_app_1:/app/uploads ./backup/uploads_$(date +%Y%m%d)
```

## Troubleshooting

- **Application not accessible**: Check if all containers are running with `docker-compose ps`
- **Redis connection issues**: The application will automatically fall back to direct mode
- **Worker not processing jobs**: Check worker logs with `docker-compose logs worker`

## Security Considerations

- Set a strong JWT_SECRET
- Consider using Redis with password in production
- Set up SSL/TLS for production using a reverse proxy (Nginx/Traefik)
- Restrict MongoDB access using authentication

## EasyPanel Deployment

For EasyPanel deployment:

1. Push your code to GitHub
2. In EasyPanel, create a new application
3. Connect to your GitHub repository
4. Select Dockerfile as the build method
5. Set the necessary environment variables
6. Deploy the application 