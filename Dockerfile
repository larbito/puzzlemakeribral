# Use Node.js LTS
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY .npmrc ./

# Install dependencies with error handling
RUN echo "Installing root dependencies..." && \
    npm install --legacy-peer-deps --no-audit || exit 1

WORKDIR /app/client
RUN echo "Installing client dependencies..." && \
    npm install --legacy-peer-deps --no-audit || exit 1

WORKDIR /app/server
RUN echo "Installing server dependencies..." && \
    npm install --legacy-peer-deps --no-audit || exit 1

# Return to app root
WORKDIR /app

# Copy the rest of the application
COPY . .

# Build client with error handling
WORKDIR /app/client
RUN echo "Building client..." && \
    npm run build || exit 1

# Return to app root
WORKDIR /app

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"] 