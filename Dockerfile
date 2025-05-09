# Build stage for client
FROM node:18-alpine AS client-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set up client build
WORKDIR /client-build
COPY client/package*.json ./
COPY .npmrc ./
RUN npm install --legacy-peer-deps --no-audit

# Build client
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set up server
WORKDIR /server-build
COPY server/package*.json ./
COPY .npmrc ./
RUN npm install --legacy-peer-deps --no-audit --production

# Final stage
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy server from server-builder
COPY --from=server-builder /server-build/node_modules ./node_modules
COPY server/ ./

# Copy client build from client-builder
COPY --from=client-builder /client-build/dist ./public

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/index.js"] 