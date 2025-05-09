# Build stage
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies with legacy peer deps and error handling
RUN set -eux \
    && npm install --legacy-peer-deps --only=production --no-audit \
    || (cat npm-debug.log && exit 1)

# Copy source files
COPY src ./src

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/index.js"] 