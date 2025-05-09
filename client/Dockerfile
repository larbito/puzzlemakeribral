# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install essential build dependencies
RUN apk add --no-cache git

# Copy package files and install dependencies first
COPY package*.json ./
COPY .npmrc ./
RUN npm install

# Copy configuration files
COPY tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the app
RUN npm run build || (echo "Build failed" && npm run build --verbose && exit 1)

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 