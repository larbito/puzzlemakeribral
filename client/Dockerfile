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

# Production stage - simple nginx setup
FROM nginx:alpine

# Install curl for debugging
RUN apk add --no-cache curl

# Create a test index.html in case build fails
RUN echo "<html><body>App is running</body></html>" > /usr/share/nginx/html/index.html

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Force HTTP/1.1 in main nginx.conf
RUN sed -i 's/listen 80;/listen 80; http2 off;/' /etc/nginx/nginx.conf

# Verify our setup - this runs during build
RUN nginx -t && \
    echo "Nginx configuration valid" && \
    echo "Files in /usr/share/nginx/html:" && \
    ls -la /usr/share/nginx/html && \
    echo "Content of nginx config:" && \
    cat /etc/nginx/conf.d/default.conf && \
    echo "Content of main nginx config:" && \
    cat /etc/nginx/nginx.conf

# Create a debug script
RUN echo '#!/bin/sh\n\
echo "Checking OS and network..."\n\
uname -a\n\
ip addr show || echo "No ip command"\n\
echo "Checking health endpoint with HTTP/1.1..."\n\
curl -v --http1.1 http://localhost/health || echo "Health check failed"\n\
echo "Checking root directory..."\n\
ls -la /usr/share/nginx/html\n\
echo "Checking nginx config..."\n\
cat /etc/nginx/conf.d/default.conf\n\
echo "Checking nginx process list..."\n\
ps aux | grep nginx || echo "No process info available"\n\
echo "Starting nginx with debug log level..."\n\
exec nginx -g "daemon off; error_log /dev/stdout debug;"' > /entrypoint.sh && \
chmod +x /entrypoint.sh

# Expose port
EXPOSE 80

# Start nginx with debugging
CMD ["/entrypoint.sh"] 