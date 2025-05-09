# Build stage for client
FROM node:18-alpine AS client

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app/client
COPY client/package*.json ./
COPY .npmrc ./

# Install client dependencies
RUN npm install

# Build client
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server

WORKDIR /app/server
COPY server/package*.json ./
COPY .npmrc ./

# Install server dependencies
RUN npm install --production

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy server files and dependencies
COPY --from=server /app/server/node_modules ./node_modules
COPY server/src ./src
COPY --from=client /app/client/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"] 