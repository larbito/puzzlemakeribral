# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY .npmrc ./

# Install production dependencies
RUN npm ci --only=production --no-audit

# Copy source files
COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"] 