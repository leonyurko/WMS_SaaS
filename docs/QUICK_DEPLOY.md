# Quick Start Guide - AWS Deployment

## For First-Time AWS Deployment

### Option 1: AWS Lightsail (Easiest - Recommended for Beginners)

**Cost**: ~$10-20/month

1. **Create Lightsail Instance** (5 minutes)
   - Go to: https://lightsail.aws.amazon.com/
   - Click "Create instance"
   - Select: Linux/Unix → Ubuntu 22.04 LTS
   - Choose plan: $10/month (2GB RAM) or higher
   - Name it: `wms-server`
   - Click "Create instance"

2. **Configure Networking** (2 minutes)
   - Wait for instance to start
   - Click on your instance
   - Go to "Networking" tab
   - Under Firewall, add rules:
     - Application: Custom, Protocol: TCP, Port: 80
     - Application: Custom, Protocol: TCP, Port: 443
     - Application: Custom, Protocol: TCP, Port: 5000

3. **Connect to Your Server** (1 minute)
   - Click "Connect using SSH" button in Lightsail console
   - Or download SSH key and use your terminal

4. **Install Docker** (5 minutes)
   ```bash
   # Run these commands one by one:
   sudo apt update
   sudo apt install -y docker.io docker-compose git
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```

5. **Upload Your Application** (5 minutes)
   
   **Method A - Using Git** (Recommended):
   ```bash
   # On your local Windows machine first:
   # 1. Create a GitHub account if you don't have one
   # 2. Create a new private repository called "wms"
   # 3. In PowerShell:
   cd C:\Users\Leon\Desktop\SaaS
   git init
   git add .
   git commit -m "Initial deployment"
   git remote add origin https://github.com/YOUR_USERNAME/wms.git
   git push -u origin main
   
   # Then on your Lightsail server:
   git clone https://github.com/YOUR_USERNAME/wms.git
   cd wms
   ```

   **Method B - Direct Upload**:
   ```bash
   # On your Windows machine (PowerShell):
   # Download the SSH key from Lightsail
   # Then run:
   scp -i LightsailDefaultKey.pem -r C:\Users\Leon\Desktop\SaaS ubuntu@YOUR_SERVER_IP:~/wms
   
   # On server:
   cd wms
   ```

6. **Configure Environment** (3 minutes)
   ```bash
   # On server:
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   **Edit these required fields**:
   ```
   DB_PASSWORD=ChooseAStrongPassword123!
   JWT_SECRET=ThisIsAVeryLongRandomSecretKeyMinimum32Characters!
   CORS_ORIGIN=http://YOUR_SERVER_IP
   
   # Email (use your Gmail):
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=your-gmail-app-password
   EMAIL_FROM=youremail@gmail.com
   ```
   
   Save: `Ctrl+O`, `Enter`, `Ctrl+X`

7. **Deploy** (5 minutes)
   ```bash
   # Make deploy script executable
   chmod +x deploy.sh
   
   # Run deployment
   ./deploy.sh
   ```

8. **Access Your Application** (1 minute)
   - Get your server IP from Lightsail console
   - Open browser: `http://YOUR_SERVER_IP`
   - Login with default credentials:
     - Username: `admin`
     - Password: `admin123`
   - **IMPORTANT**: Change password immediately!

### Gmail App Password Setup (for Email Functionality)

1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Select app: "Mail", Device: "Other (Custom name)"
5. Name it: "WMS System"
6. Click "Generate"
7. Copy the 16-character password
8. Use this in your `.env.production` file as `SMTP_PASS`

---

## Option 2: AWS EC2 (More Control)

**Cost**: ~$30-50/month

### Quick EC2 Setup:

1. **Launch EC2 Instance**
   - Go to: https://console.aws.amazon.com/ec2/
   - Click "Launch Instance"
   - Name: `wms-server`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: `t3.medium` (2 vCPU, 4GB RAM)
   - Key pair: Create new or select existing
   - Security group: Create new with ports 22, 80, 443, 5000
   - Storage: 30GB gp3
   - Click "Launch Instance"

2. **Connect to EC2**
   ```bash
   # On Windows PowerShell:
   ssh -i path\to\your-key.pem ubuntu@YOUR_EC2_IP
   ```

3. **Follow steps 4-8 from Lightsail guide above**

---

## After Deployment Checklist

### Immediate (Do Now):
- [ ] Change admin password (Login → Users → Edit admin)
- [ ] Test login functionality
- [ ] Add your first inventory item
- [ ] Create a supplier
- [ ] Create an email format template
- [ ] Test placing an order

### Security (Within 24 hours):
- [ ] Set up domain name (optional)
- [ ] Install SSL certificate for HTTPS
- [ ] Review and restrict Security Group rules
- [ ] Set up database backups

### Optional Enhancements:
- [ ] Configure AWS S3 for image storage
- [ ] Set up CloudWatch monitoring
- [ ] Configure auto-scaling (if using EC2)
- [ ] Set up domain with Route 53

---

## Setting Up Domain & SSL (Optional but Recommended)

### 1. Point Domain to Server
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Add A Record: `@` → `YOUR_SERVER_IP`
- Add A Record: `www` → `YOUR_SERVER_IP`
- Wait 5-30 minutes for DNS propagation

### 2. Install SSL Certificate
```bash
# On your server:
sudo apt install -y certbot

# Stop nginx temporarily
docker stop wms-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory
mkdir -p ~/wms/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/wms/ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/wms/ssl/private.key
sudo chown -R ubuntu:ubuntu ~/wms/ssl

# Update CORS origin
cd ~/wms
nano .env.production
# Change CORS_ORIGIN to: https://yourdomain.com

# Edit nginx.conf to enable SSL section (uncomment lines)
nano nginx.conf

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### 3. Set Up Auto-Renewal
```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart wms-nginx'") | crontab -
```

---

## Troubleshooting

### Can't access the site?
```bash
# Check if containers are running
docker ps

# View logs
docker logs wms-frontend
docker logs wms-backend
docker logs wms-postgres

# Restart everything
cd ~/wms
docker-compose -f docker-compose.prod.yml restart
```

### Database issues?
```bash
# Access database
docker exec -it wms-postgres psql -U postgres -d wms_db

# Check tables
\dt

# Exit
\q
```

### Email not sending?
- Verify Gmail App Password is correct
- Check backend logs: `docker logs wms-backend`
- Test SMTP settings

---

## Support Commands

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker restart wms-backend

# Check disk space
df -h

# Check memory
free -h

# Update application
cd ~/wms
git pull
./deploy.sh

# Backup database
docker exec wms-postgres pg_dump -U postgres wms_db > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i wms-postgres psql -U postgres -d wms_db < backup_20250120.sql
```

---

## Total Time to Deploy

- **Lightsail**: ~25-30 minutes
- **EC2**: ~30-40 minutes
- **With Domain & SSL**: +20-30 minutes

## Need Help?

Common issues and solutions in `AWS_DEPLOYMENT_GUIDE.md`
