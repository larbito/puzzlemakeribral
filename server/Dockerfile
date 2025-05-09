# Build stage
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache git curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies with better error handling
RUN set -eux \
    && echo "Installing dependencies..." \
    && npm install --legacy-peer-deps --no-audit \
    || (echo "npm install failed" && cat npm-debug.log && exit 1)

# Copy source files
COPY src ./src

# Add healthcheck with increased timeout and better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || (echo "Health check failed" && exit 1)

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Start server with better error handling
CMD ["sh", "-c", "node src/index.js 2>&1 | tee /app/server.log"] 