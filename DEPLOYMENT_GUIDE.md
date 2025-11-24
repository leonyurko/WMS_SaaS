# Deployment Guide

This guide explains how to deploy the Warehouse Management System (WMS) to your AWS EC2 instance.

## Prerequisities
- AWS EC2 instance running (Ubuntu/Linux recommended)
- Docker and Docker Compose installed on the server
- Domain name pointing to your EC2 IP address (optional but recommended for SSL)

## 1. Push Changes
Push your local changes to your git repository:
```bash
git add .
git commit -m "Fix image deletion and deployment config"
git push origin main
```

## 2. Pull on Server
SSH into your EC2 instance and pull the latest changes:
```bash
ssh user@your-ec2-ip
cd /path/to/your/repo
git pull origin main
```

## 3. Environment Configuration (CRITICAL)
You must create a `.env` file on the server. This file is **not** committed to git for security reasons.

Create the file:
```bash
nano .env
```

Paste the following content and **replace the values with your actual secrets**:

```ini
# Database Configuration
DB_NAME=wms_db
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD  # <--- CHANGE THIS
DB_HOST=postgres
DB_PORT=5432

# JWT Secret
JWT_SECRET=YOUR_LONG_RANDOM_SECRET_STRING # <--- CHANGE THIS

# CORS Origin
CORS_ORIGIN=https://your-domain.com # <--- CHANGE THIS to your domain or EC2 IP

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com

# AWS Configuration (Optional - Local storage used if left as is)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=wms-inventory-images

# Frontend API URL
VITE_API_URL=/api
```

## 4. SSL Certificates
Nginx requires SSL certificates to start. You have two options:

### Option A: Generate Self-Signed Certs (Quick, for testing)
Run this command on the server to generate a self-signed certificate:
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key \
  -out ssl/certificate.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Option B: Use Let's Encrypt (Recommended for production)
If you have a domain name, use Certbot to generate valid certificates.
1. Install Certbot.
2. Generate certs.
3. Copy them to the `ssl` directory expected by Docker.

## 5. Deploy
Run the production docker-compose file:

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start
docker-compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 6. Verification
- Check logs: `docker-compose -f docker-compose.prod.yml logs -f backend`
- Visit `https://your-domain.com` (accept the warning if using self-signed certs).

## Note on Docker Compose Files
- `docker-compose.yml`: Used for local development.
- `docker-compose.prod.yml`: Used for production deployment.
Do not delete either; they serve different purposes.
