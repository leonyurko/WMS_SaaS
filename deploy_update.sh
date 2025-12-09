#!/bin/bash

echo "Starting deployment..."

# 1. Pull latest changes
echo "Pulling latest changes from git..."
git pull

# 2. Rebuild and restart containers
# We rebuild to ensure the latest code (especially backend) is included in the image
echo "Rebuilding and restarting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Wait for backend to be ready (simple sleep, or wait-for-it methodology)
echo "Waiting for backend service to be ready..."
sleep 10

# 4. Run database migration inside the backend container
echo "Running database migration..."
docker-compose -f docker-compose.prod.yml exec -T backend node run_migration.js

echo "Deployment completed successfully!"
