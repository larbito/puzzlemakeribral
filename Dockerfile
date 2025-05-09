# Build stage for client
FROM node:18-alpine AS client-builder

# Set npm config to avoid issues
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

WORKDIR /build
COPY client/package*.json ./
COPY .npmrc ./

# Install dependencies without any extras
RUN npm install --production=false --no-package-lock

# Build client
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder

# Set npm config
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

WORKDIR /build
COPY server/package*.json ./
COPY .npmrc ./

# Install only production dependencies
RUN npm install --production --no-package-lock

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files
COPY --from=server-builder /build/node_modules ./node_modules
COPY server/src ./src
COPY --from=client-builder /build/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"] 