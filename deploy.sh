#!/bin/bash

# AWS Deployment Script
# This script helps deploy the WMS to an AWS EC2 instance

set -e

echo "🚀 WMS Deployment Script for AWS"
echo "================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

# Load environment variables
source .env.production

echo "📋 Pre-deployment checklist:"
echo "1. ✓ Environment file loaded"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "2. ✓ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo "3. ✓ Docker Compose is installed"

echo ""
echo "🔨 Building and deploying services..."
echo ""

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml --env-file .env.production build

echo "▶️  Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if containers are running
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🗄️  Applying database migrations..."
docker exec wms-postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-wms_db} -f /docker-entrypoint-initdb.d/migrations/add_suppliers_and_formats.sql 2>/dev/null || echo "Migrations already applied or not needed"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 Access Information:"
echo "   Frontend: http://your-server-ip"
echo "   Backend API: http://your-server-ip:5000"
echo ""
echo "🔍 Useful Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔐 Next Steps:"
echo "   1. Configure your domain DNS to point to this server"
echo "   2. Set up SSL certificate with Let's Encrypt"
echo "   3. Update CORS_ORIGIN in .env.production"
echo "   4. Change default admin password"
echo ""
