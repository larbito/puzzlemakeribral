# Build stage
FROM node:18-alpine as build

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev dependencies) with better error handling
RUN set -eux \
    && npm install --legacy-peer-deps --no-audit \
    && npm install -g vite typescript \
    || (echo "npm install failed" && cat npm-debug.log && exit 1)

# Copy source files
COPY . .

# Build the app with better error handling
RUN set -eux \
    && echo "Starting build process..." \
    && NODE_ENV=production npm run build \
    || (echo "Build failed" && cat npm-debug.log && ls -la && exit 1)

# Production stage
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 