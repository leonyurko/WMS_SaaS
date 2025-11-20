# Multi-stage build for Node.js backend

# Stage 1: Development
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy application code
COPY . .

# Development stage
CMD ["npm", "run", "dev"]

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/codes

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "src/server.js"]
