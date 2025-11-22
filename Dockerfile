# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from ai-generator-web
COPY ai-generator-web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from ai-generator-web
COPY ai-generator-web/ ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY ai-generator-web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
