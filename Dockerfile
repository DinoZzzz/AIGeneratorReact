# Build stage - using specific node version to bust Railway cache
FROM node:20.18-alpine AS builder

WORKDIR /app

# Install git and curl for Sentry CLI
RUN apk add --no-cache git curl bash

# Declare build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG=digitando-digital
ARG SENTRY_PROJECT=javascript-react

# Set environment variables from build arguments
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

# Install Sentry CLI
RUN curl -sL https://sentry.io/get-cli/ | bash

# Copy package files from ai-generator-web
# Cache bust: 2026-02-03-v1
COPY ai-generator-web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from ai-generator-web
COPY ai-generator-web/ ./

# Build the app (will now have access to VITE_* env vars)
RUN npm run build

# Create Sentry release using package.json version (no git required)
RUN if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
    VERSION=$(node -p "require('./package.json').version") && \
    sentry-cli releases new "$VERSION" && \
    sentry-cli releases finalize "$VERSION" && \
    echo "Sentry release $VERSION created successfully"; \
    else echo "Skipping Sentry release (no auth token)"; fi

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
