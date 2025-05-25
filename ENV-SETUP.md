# Environment Variables Setup

This document explains how to set up environment variables for both development and production environments.

## Development Environment

For local development, create a `.env` file in the `backend` directory with the following variables:

```
# Server configuration
NODE_ENV=development
PORT=5000

# MongoDB connection
MONGODB_URI=mongodb://127.0.0.1:27017/webtools

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_DB=0

# JWT configuration
JWT_SECRET=your-dev-secret-key-change-this
JWT_EXPIRE=7d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Worker configuration
WORKER_CONCURRENCY=2

# Logging
LOG_LEVEL=debug
```

## Production Environment

For production deployment using Docker, environment variables are already configured in the `docker-compose.yml` file. You can customize them by:

1. Directly editing the `docker-compose.yml` file
2. Using host environment variables that get passed to the containers

### Using Host Environment Variables

To set sensitive information like JWT secrets, you can set environment variables on your host machine before running Docker Compose:

```bash
# Set secure JWT secret
export JWT_SECRET=your-secure-production-secret

# Start the application
docker-compose up -d
```

This approach keeps sensitive information out of your configuration files.

## Important Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://127.0.0.1:27017/webtools |
| REDIS_HOST | Redis server hostname | localhost |
| REDIS_PORT | Redis server port | 6379 |
| JWT_SECRET | Secret key for JWT tokens | fallback value (should be changed) |
| JWT_EXPIRE | JWT token expiration period | 7d |
| FRONTEND_URL | URL of the frontend for CORS | http://localhost:3000 |
| WORKER_CONCURRENCY | Number of concurrent jobs | 2 |

## Security Best Practices

1. Never commit `.env` files or real secrets to your repository
2. Use different JWT secrets for development and production
3. For production, use long, randomly generated strings for JWT_SECRET
4. Consider using a secret management solution for production deployments 