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

## 3. Environment Configuration
Since you have committed `.env.production` to the repository, you can simply copy it to `.env` on the server.

```bash
cp .env.production .env
```

> [!WARNING]
> **Security Note**: Since your secrets are now in the git repository, ensure your repository is **Private**. If you ever make it public, you must rotate all secrets (DB password, JWT secret, AWS keys).

### Verify Values
Check that the values in `.env` are correct for your production environment:
```bash
cat .env
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
