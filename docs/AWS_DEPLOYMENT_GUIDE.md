# AWS Deployment Guide - Warehouse Management System

## Prerequisites
- AWS Account
- Domain name (optional but recommended)
- AWS CLI installed on your local machine
- Docker installed locally

## Deployment Options

### Option 1: EC2 Instance (Recommended for Full Control)

#### Step 1: Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. **Choose AMI**: Ubuntu Server 22.04 LTS
3. **Instance Type**: t3.medium or larger (2 vCPU, 4GB RAM minimum)
4. **Security Group**: Create new with these rules:
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (5000) - Optional for direct backend access
5. **Storage**: 30GB+ SSD
6. Create or select a key pair for SSH access

#### Step 2: Connect to Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

#### Step 3: Install Docker on EC2
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installations
docker --version
docker-compose --version
```

#### Step 4: Transfer Your Application
**Option A: Using Git (Recommended)**
```bash
# On your local machine, push to GitHub first
cd C:\Users\Leon\Desktop\SaaS
git init
git add .
git commit -m "Initial commit"
# Create a private GitHub repo and push
git remote add origin https://github.com/yourusername/wms.git
git push -u origin main

# On EC2
git clone https://github.com/yourusername/wms.git
cd wms
```

**Option B: Using SCP**
```bash
# On your local machine (PowerShell)
scp -i your-key.pem -r C:\Users\Leon\Desktop\SaaS ubuntu@your-ec2-public-ip:~/wms
```

#### Step 5: Configure Environment Variables
```bash
# On EC2
cd wms
cp .env.production.example .env.production

# Edit the file with your actual values
nano .env.production
```

**Fill in these critical values:**
- `DB_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ character string
- `CORS_ORIGIN` - Your domain or EC2 public IP
- Email credentials (SMTP_USER, SMTP_PASS)

#### Step 6: Deploy with Docker Compose
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check if containers are running
docker ps

# View logs
docker logs wms-backend
docker logs wms-frontend
docker logs wms-postgres

# Apply database migrations if needed
docker exec wms-postgres psql -U postgres -d wms_db -f /docker-entrypoint-initdb.d/migrations/add_suppliers_and_formats.sql
```

#### Step 7: Configure Domain (Optional)
1. **Point your domain to EC2**:
   - Go to your domain registrar
   - Add an A record pointing to your EC2 public IP

2. **Install SSL Certificate with Let's Encrypt**:
```bash
# On EC2
sudo apt install certbot python3-certbot-nginx -y

# Stop nginx temporarily
docker stop wms-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to your project
sudo mkdir -p ~/wms/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/wms/ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/wms/ssl/private.key
sudo chown -R ubuntu:ubuntu ~/wms/ssl

# Restart nginx
docker start wms-nginx
```

3. **Update nginx.conf** to enable HTTPS (uncomment SSL section)

#### Step 8: Set Up Auto-Renewal for SSL
```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart wms-nginx'") | crontab -
```

---

### Option 2: AWS ECS (Elastic Container Service)

#### Step 1: Create ECR Repositories
```bash
# On your local machine
aws ecr create-repository --repository-name wms-backend
aws ecr create-repository --repository-name wms-frontend
```

#### Step 2: Build and Push Docker Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t wms-backend --target production .
docker tag wms-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wms-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wms-backend:latest

# Build and push frontend
cd ../frontend
docker build -t wms-frontend --target production .
docker tag wms-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wms-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wms-frontend:latest
```

#### Step 3: Create RDS PostgreSQL Database
1. Go to AWS RDS → Create Database
2. Choose PostgreSQL 14
3. Template: Production or Dev/Test
4. DB instance: db.t3.micro (free tier) or larger
5. Set master password
6. Enable public access (or use VPC)
7. Create database

#### Step 4: Create ECS Cluster
1. Go to ECS → Create Cluster
2. Choose EC2 Linux + Networking
3. Configure instance type (t3.medium recommended)
4. Set number of instances

#### Step 5: Create Task Definitions
Create task definitions for backend and frontend services using the ECR images.

---

### Option 3: AWS Lightsail (Easiest, Lower Cost)

#### Step 1: Create Lightsail Instance
1. Go to AWS Lightsail → Create Instance
2. **Platform**: Linux/Unix
3. **Blueprint**: OS Only → Ubuntu 22.04
4. **Instance Plan**: $10/month (2GB RAM) or higher
5. Create instance

#### Step 2: Configure Firewall
- Add rules for ports 80, 443, 5000

#### Step 3: Follow EC2 steps 2-8 above
The process is identical to EC2 once instance is created.

---

## Post-Deployment Checklist

### Security
- [ ] Change default admin password
- [ ] Set strong DB_PASSWORD
- [ ] Set random JWT_SECRET (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Restrict SSH access to your IP only
- [ ] Configure AWS Security Groups properly
- [ ] Enable AWS CloudWatch for monitoring

### Email Configuration
- [ ] Set up Gmail App Password or AWS SES
- [ ] Test email sending functionality
- [ ] Configure low stock alert emails

### Database
- [ ] Create database backup schedule
- [ ] Enable automated RDS backups (if using RDS)
- [ ] Or setup cron job for PostgreSQL backups:
```bash
# Daily backup at 2 AM
0 2 * * * docker exec wms-postgres pg_dump -U postgres wms_db > ~/backups/wms_db_$(date +\%Y\%m\%d).sql
```

### Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Monitor disk space
- [ ] Monitor container health

### Testing
- [ ] Test login functionality
- [ ] Test inventory management
- [ ] Test barcode generation
- [ ] Test supplier email orders
- [ ] Test image uploads
- [ ] Test on mobile devices

---

## Quick Commands Reference

### Docker Management
```bash
# View logs
docker logs wms-backend -f
docker logs wms-frontend -f
docker logs wms-postgres -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Access database
docker exec -it wms-postgres psql -U postgres -d wms_db
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check running containers
docker ps

# Check container resource usage
docker stats
```

---

## Cost Estimation

### AWS Lightsail (Simplest)
- Instance ($10-40/month)
- **Total: ~$10-40/month**

### AWS EC2 (More Control)
- t3.medium EC2 instance: ~$30/month
- 30GB EBS storage: ~$3/month
- Data transfer: ~$5-10/month
- **Total: ~$40-50/month**

### AWS ECS + RDS (Scalable)
- ECS Tasks: ~$30-50/month
- RDS db.t3.micro: ~$15/month
- Load Balancer: ~$20/month
- ECR storage: ~$1/month
- **Total: ~$70-90/month**

---

## Recommended: Start with EC2 or Lightsail

**Best choice for you**: AWS EC2 or Lightsail with the docker-compose setup.

**Pros**:
- Simple deployment
- Full control
- Lower cost
- Easy to backup and restore
- Straightforward scaling

**Next Steps**:
1. Create EC2/Lightsail instance
2. Install Docker & Docker Compose
3. Transfer files via Git or SCP
4. Configure .env.production
5. Run docker-compose up
6. Configure domain and SSL
7. Test thoroughly

Would you like me to help you with any specific step?
