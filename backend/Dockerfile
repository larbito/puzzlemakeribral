FROM node:18-bullseye-slim

# Create app directory
WORKDIR /app

# Install system dependencies required for Sharp and other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libvips-dev \
    pkg-config \
    build-essential \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
COPY package*.json ./

# Set environment variables to help Sharp installation
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV SHARP_FORCE_GLOBAL_LIBVIPS=false
ENV NODE_ENV=production

# Install dependencies with better error handling
RUN npm ci --only=production --no-audit --no-fund || \
    (echo "Regular install failed, trying without sharp..." && \
     npm install --ignore-scripts && \
     npm install sharp@latest --platform=linux --arch=x64) || \
    (echo "Sharp install failed, continuing without it..." && \
     npm uninstall sharp && \
     npm install)

# Bundle app source
COPY . .

# Expose port for the app
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the app
CMD ["npm", "start"] 