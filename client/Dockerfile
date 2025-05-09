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

# Install curl and other debugging tools
RUN apk add --no-cache curl busybox-extras

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Verify nginx config and directory structure
RUN nginx -t && \
    ls -la /usr/share/nginx/html && \
    cat /etc/nginx/conf.d/default.conf

# Create healthcheck script
RUN echo '#!/bin/sh\n\
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health)\n\
if [ "$response" = "200" ]; then\n\
    exit 0\n\
else\n\
    echo "Healthcheck failed with status $response"\n\
    exit 1\n\
fi' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Checking nginx configuration..."\n\
nginx -t\n\
echo "Starting nginx..."\n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"] 