# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install essential build dependencies and debugging tools
RUN apk add --no-cache git curl

# Show environment information
RUN node -v && npm -v

# Copy package files and install dependencies first
COPY package*.json ./
COPY .npmrc ./

# Clean install dependencies with debug output
RUN npm install --verbose

# Copy configuration files
COPY tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./

# Show copied files for debugging
RUN ls -la

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Show full directory structure for debugging
RUN find . -type f | sort

# Set environment variables for build
ENV VITE_SUPABASE_URL="https://sqyvdlyjgxaeikubvmuo.supabase.co"
ENV VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXZkbHlqZ3hhZWlrdWJ2bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTU2MTUsImV4cCI6MjA2MTk3MTYxNX0.jvo6xNthP9VZeO0D12zkEtcFr58lEgJRws6ZAWQG_aI"
ENV VITE_OPENAI_API_KEY=""
ENV NODE_ENV="production"

# First run tsc to check for TypeScript errors
RUN npx tsc --noEmit

# Then run the build with full output
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for healthcheck and debugging tools
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Add debugging command to check nginx config on startup
RUN echo '#!/bin/sh\nnginx -t\nexec nginx -g "daemon off;"' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"] 