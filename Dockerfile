# Build stage for dependencies
FROM node:18-alpine AS deps

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY .npmrc ./

# Install dependencies
RUN npm ci || npm install

# Build stage for client
FROM node:18-alpine AS client-builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy server files and dependencies
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/src ./src
COPY --from=client-builder /app/client/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"] 