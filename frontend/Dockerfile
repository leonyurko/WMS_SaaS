# Multi-stage build for React frontend

# Stage 1: Development
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Development stage
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Production build
FROM node:18-alpine AS production-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Accept build arguments
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build application
RUN npm run build

# Stage 3: Production with nginx
FROM nginx:alpine AS production

# Copy built files from production-builder
COPY --from=production-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
