# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./

# Install production dependencies
RUN npm install --production --no-cache

# Copy source files
COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"] 