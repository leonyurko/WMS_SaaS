# Warehouse Management SaaS - Setup & Deployment Guide

## 📋 Overview
Complete guide to set up, run, and deploy the Warehouse Management System.

---

## 📋 Overview
-ServerFarm Notification Email Details:
```
serverfarmnotifications@gmail.com
sf123mail!noti
```


## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Docker & Docker Compose (optional but recommended)

### Option 1: Docker Compose (Recommended)
```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - PostgreSQL: localhost:5432
```

### Option 2: Manual Setup

#### 1. Database Setup
```powershell
# Create database
psql -U postgres
CREATE DATABASE wms_db;
\c wms_db

# Run schema
psql -U postgres -d wms_db -f backend/src/database/schema.sql

# (Optional) Add sample data
psql -U postgres -d wms_db -f backend/src/database/seed-data.sql
```

#### 2. Backend Setup
```powershell
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start server
npm run dev  # Development with hot reload
# OR
npm start    # Production
```

**Backend runs on:** http://localhost:5000

#### 3. Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit VITE_API_URL if backend is not on localhost:5000

# Start dev server
npm run dev  # Development
# OR
npm run build && npm run preview  # Production preview
```

**Frontend runs on:** http://localhost:3000

---

## 🔑 Default Login Credentials

### After Running Seed Data:
| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | password123 | Admin | Full system access |
| john.doe | password123 | Manager | Manage inventory & users |
| jane.smith | password123 | Staff | Basic inventory operations |
| mike.wilson | password123 | Staff | Basic inventory operations |

---

## 📦 Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wms_db
DB_USER=postgres
DB_PASSWORD=your-db-password

# AWS S3 (for image uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=wms-inventory-images

# Email (for low-stock alerts)
EMAIL_FROM=noreply@yourcompany.com

# AWS SES
AWS_SES_REGION=us-east-1

# OR SendGrid (alternative)
SENDGRID_API_KEY=your-sendgrid-key

# OR SMTP (alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cron Jobs
LOW_STOCK_CHECK_CRON=0 9 * * *  # Daily at 9 AM
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🏗️ Project Structure

```
ServerFarmSaaS/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & AWS configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Sequelize ORM models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Email & cron jobs
│   │   ├── database/        # SQL schema & seeds
│   │   └── server.js        # Express app entry
│   ├── uploads/             # Temporary file storage
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, shared components
│   │   ├── pages/           # Dashboard, Inventory, Transactions, Scanner, Users
│   │   ├── services/        # API client (axios)
│   │   ├── stores/          # Zustand state management
│   │   ├── App.jsx          # Routes & auth guards
│   │   └── main.jsx         # React entry
│   ├── public/              # Static assets
│   ├── package.json
│   └── .env
├── docker-compose.yml
├── docs/
│   └── API.md               # Complete API documentation
└── README.md
```

---

## 🔧 Development Workflow

### Running Tests
```powershell
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

### Database Management
```powershell
# Reset database
psql -U postgres -d wms_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U postgres -d wms_db -f backend/src/database/schema.sql

# View tables
psql -U postgres -d wms_db -c "\dt"

# Check low stock alerts
psql -U postgres -d wms_db -c "SELECT * FROM v_low_stock_items;"
```

### API Testing
```powershell
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin123!"}'

# Get inventory (replace TOKEN)
curl http://localhost:5000/api/inventory `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ☁️ Cloud Deployment

### AWS Deployment Architecture
```
User → CloudFront (CDN)
        ↓
     S3 (Frontend Static Files)
        ↓
     ALB (Load Balancer)
        ↓
     ECS Fargate (Backend API Containers)
        ↓
     RDS PostgreSQL (Database)
        ↓
     S3 (Image Storage)
```

### Step 1: Database (AWS RDS)
```powershell
# Create RDS PostgreSQL instance
aws rds create-db-instance `
  --db-instance-identifier wms-db `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 14.10 `
  --master-username admin `
  --master-user-password YourSecurePassword123! `
  --allocated-storage 20 `
  --vpc-security-group-ids sg-xxxxx `
  --publicly-accessible

# Get endpoint
aws rds describe-db-instances --db-instance-identifier wms-db --query 'DBInstances[0].Endpoint.Address'

# Connect and run schema
psql -h wms-db.xxxxx.us-east-1.rds.amazonaws.com -U admin -d postgres -f backend/src/database/schema.sql
```

### Step 2: Backend (AWS ECS Fargate)
```powershell
# Build and push Docker image
cd backend
docker build -t wms-backend .

# Tag for ECR
aws ecr create-repository --repository-name wms-backend
docker tag wms-backend:latest xxxxx.dkr.ecr.us-east-1.amazonaws.com/wms-backend:latest
docker push xxxxx.dkr.ecr.us-east-1.amazonaws.com/wms-backend:latest

# Create ECS task definition & service (use AWS Console or Terraform)
```

### Step 3: Frontend (S3 + CloudFront)
```powershell
cd frontend

# Build production bundle
npm run build

# Create S3 bucket
aws s3 mb s3://wms-frontend-yourcompany

# Enable static website hosting
aws s3 website s3://wms-frontend-yourcompany --index-document index.html

# Upload build
aws s3 sync dist/ s3://wms-frontend-yourcompany --delete

# Create CloudFront distribution
aws cloudfront create-distribution --origin-domain-name wms-frontend-yourcompany.s3-website-us-east-1.amazonaws.com
```

### Step 4: S3 Image Storage
```powershell
# Create private bucket for inventory images
aws s3 mb s3://wms-inventory-images-yourcompany

# Configure CORS
aws s3api put-bucket-cors --bucket wms-inventory-images-yourcompany --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["https://yourapp.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }]
}
```

---

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET in production
- [ ] Use strong database passwords
- [ ] Enable AWS IAM roles for ECS tasks
- [ ] Restrict S3 bucket access policies
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Configure CORS properly
- [ ] Enable rate limiting on API
- [ ] Regular security audits with `npm audit`
- [ ] Implement database backups
- [ ] Use environment variables (never commit .env)

---

## 📊 Monitoring & Logs

### Application Logs
```powershell
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# AWS CloudWatch (if using ECS)
aws logs tail /ecs/wms-backend --follow
```

### Database Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- View recent transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Check low stock items
SELECT * FROM v_low_stock_items;
```

---

## 🆘 Troubleshooting

### Backend won't start
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Check .env database credentials
- Ensure schema is loaded: `psql -U postgres -d wms_db -c "\dt"`

### Frontend can't connect to API
- Verify VITE_API_URL in frontend/.env
- Check backend is running: `curl http://localhost:5000/health`
- Check browser console for CORS errors

### Camera scanner not working
- Ensure HTTPS (camera requires secure context)
- Check browser permissions
- Try manual barcode entry as fallback

### Email alerts not sending
- Verify email configuration in backend/.env
- Check AWS SES sending limits
- Test with: `node backend/src/services/emailService.js`

---

## 📈 Performance Optimization

### Database
- Indexes are already created in schema.sql
- Use connection pooling (configured in database.js)
- Regular VACUUM ANALYZE: `psql -U postgres -d wms_db -c "VACUUM ANALYZE;"`

### Backend
- Enable caching for inventory list
- Use PM2 for process management: `pm2 start server.js -i max`
- Optimize image uploads with compression

### Frontend
- Static assets cached by CloudFront
- Code splitting already enabled (Vite)
- Lazy load dashboard components

---

## 📞 Support & Maintenance

### Backup Database
```powershell
# Local backup
pg_dump -U postgres wms_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d wms_db < backup_20240101.sql

# AWS RDS automated backups (enable in console)
```

### Update Dependencies
```powershell
# Check outdated packages
cd backend && npm outdated
cd frontend && npm outdated

# Update safely
npm update
npm audit fix
```

---

## 🎯 Next Steps

1. **Customize branding**: Update colors in frontend/tailwind.config.js
2. **Add reports**: Create analytics dashboard page
3. **Mobile app**: Build React Native scanner app
4. **Integrations**: Connect to existing ERP/accounting systems
5. **Multi-tenant**: Add company_id to support multiple warehouses

---

## 📝 License
Proprietary - All rights reserved

## 🤝 Contributors
Developed by Leon with Senior Solutions Architect guidance
