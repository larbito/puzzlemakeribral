# Use Node.js LTS
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY .npmrc ./

# Clean install dependencies
RUN npm install --legacy-peer-deps
WORKDIR /app/client
RUN npm install --legacy-peer-deps
WORKDIR /app/server
RUN npm install --legacy-peer-deps

# Return to app root
WORKDIR /app

# Copy the rest of the application
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Return to app root
WORKDIR /app

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"] 