#!/bin/bash

# Web Tools Deployment Script
# This script helps automate the deployment process

# Exit on error
set -e

# Display help message
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Web Tools Deployment Script"
  echo ""
  echo "Usage: ./deploy.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start        Build and start all containers"
  echo "  stop         Stop all containers"
  echo "  restart      Restart all containers"
  echo "  logs         Show logs from all containers"
  echo "  status       Show status of all containers"
  echo "  scale N      Scale worker to N instances"
  echo "  backup       Create a backup of data"
  echo "  update       Pull latest code and rebuild"
  echo ""
  exit 0
fi

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
  echo "Error: docker is not installed"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose is not installed"
  exit 1
fi

# Execute command
case "$1" in
  start)
    echo "Starting containers..."
    docker-compose up -d --build
    echo "Containers started successfully!"
    ;;
  stop)
    echo "Stopping containers..."
    docker-compose down
    echo "Containers stopped successfully!"
    ;;
  restart)
    echo "Restarting containers..."
    docker-compose down
    docker-compose up -d
    echo "Containers restarted successfully!"
    ;;
  logs)
    echo "Showing logs..."
    docker-compose logs -f
    ;;
  status)
    echo "Container status:"
    docker-compose ps
    ;;
  scale)
    if [ -z "$2" ]; then
      echo "Error: Please specify the number of worker instances"
      exit 1
    fi
    echo "Scaling worker to $2 instances..."
    docker-compose up -d --scale worker=$2
    echo "Worker scaled successfully!"
    ;;
  backup)
    echo "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    # Generate timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup MongoDB
    echo "Backing up MongoDB..."
    docker-compose exec -T mongo mongodump --archive > backups/mongo_$TIMESTAMP.archive
    
    # Backup uploads directory
    echo "Backing up uploads..."
    docker cp $(docker-compose ps -q app):/app/uploads backups/uploads_$TIMESTAMP
    
    echo "Backup completed! Files saved in backups/ directory"
    ;;
  update)
    echo "Updating application..."
    git pull
    docker-compose down
    docker-compose up -d --build
    echo "Application updated successfully!"
    ;;
  *)
    echo "Unknown command: $1"
    echo "Use './deploy.sh --help' for usage information"
    exit 1
    ;;
esac 