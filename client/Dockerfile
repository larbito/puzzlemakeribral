# Build stage
FROM node:18-alpine as build

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy all configuration files first
COPY package.json package-lock.json .npmrc ./
COPY tsconfig.json tsconfig.app.json vite.config.ts postcss.config.js tailwind.config.js ./

# Install ALL dependencies (including dev dependencies)
RUN set -eux \
    && echo "Installing dependencies..." \
    && npm install --legacy-peer-deps --no-audit \
    && npm install -g vite typescript \
    || (echo "npm install failed" && ls -la && cat npm-debug.log && exit 1)

# Copy the rest of the source files
COPY . .

# Debug information before build
RUN set -eux \
    && echo "Listing directory contents:" \
    && ls -la \
    && echo "Node version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Build the app with verbose logging
RUN set -eux \
    && echo "Starting build process..." \
    && npm run build --verbose \
    || (echo "Build failed. Directory contents:" && ls -la && echo "Error log:" && cat npm-debug.log 2>/dev/null || true && exit 1)

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