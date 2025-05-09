# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install essential build dependencies
RUN apk add --no-cache git

# Copy package files and install dependencies first
COPY package*.json ./
COPY .npmrc ./

# Clean install dependencies
RUN npm ci || (echo "Clean install failed, trying with legacy peer deps" && npm install --legacy-peer-deps)

# Copy configuration files
COPY tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Set environment variables for build
ENV VITE_SUPABASE_URL="https://sqyvdlyjgxaeikubvmuo.supabase.co"
ENV VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXZkbHlqZ3hhZWlrdWJ2bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTU2MTUsImV4cCI6MjA2MTk3MTYxNX0.jvo6xNthP9VZeO0D12zkEtcFr58lEgJRws6ZAWQG_aI"
ENV VITE_OPENAI_API_KEY=""
ENV NODE_ENV="production"

# Build the app with detailed error output
RUN npm run build --verbose || (echo "Build failed with error:" && cat /tmp/build-error.log && ls -la && exit 1)

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