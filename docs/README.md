# 🏭 Warehouse Management SaaS

Modern cloud-native warehouse management system built for efficiency and scalability.

## 🎯 Project Overview

**Timeline:** 14 Days  
**Users:** 10 Concurrent Users  
**Architecture:** Three-tier SaaS (React + Node.js + PostgreSQL)

## 📋 Features

- ✅ Centralized inventory management
- ✅ Barcode generation and mobile scanning
- ✅ Automatic stock deduction
- ✅ Low-stock email alerts
- ✅ Transaction tracking with reasons
- ✅ Image storage per item
- ✅ Role-based access control

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- html5-qrcode (Barcode Scanner)
- Axios (API Client)

### Backend
- Node.js 18+ + Express
- PostgreSQL 14+
- JWT Authentication
- Multer (Image Upload)
- node-cron (Scheduled Tasks)
- qrcode (Barcode Generation)

### Infrastructure
- AWS S3 (Image Storage)
- AWS SES/SendGrid (Email Notifications)
- Docker (Containerization)
- PostgreSQL RDS (Production)

## 📂 Project Structure

```
ServerFarmSaaS/
├── backend/              # Node.js API Server
│   ├── src/
│   │   ├── config/       # Database, AWS, Email config
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers
│   ├── tests/
│   └── package.json
├── frontend/             # React Web App
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API calls
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Helpers
│   └── package.json
├── database/             # SQL schemas
├── docs/                 # Documentation
└── docker-compose.yml    # Local dev environment
```

## 🗄️ Database Schema

### Users Table (10 users)
- id, username, email, password_hash, role, created_at

### Inventory Table
- id, name, location, category, sub_category, shelf
- description, image_url, barcode, current_stock
- min_threshold, created_at, updated_at

### Transactions Table
- id, item_id, user_id, quantity, reason
- transaction_type, timestamp

### Categories Table
- id, name, description

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS Account (S3, SES)

### Installation
```bash
# Clone and install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Initialize database
npm run db:migrate

# Start development servers
npm run dev
```

## 📧 Contact

Project Manager: [Your Name]  
Development Period: Nov 18 - Dec 2, 2025
