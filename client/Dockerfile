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

# Production stage - dual server approach
FROM node:18-alpine

WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx curl

# Copy healthcheck server
COPY healthcheck.js /app/healthcheck.js

# Create directory for nginx static files
RUN mkdir -p /usr/share/nginx/html

# Copy built files for the app
COPY --from=build /app/dist /usr/share/nginx/html

# Create a basic nginx config
RUN echo 'server {\n\
    listen 80 default_server;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/http.d/default.conf

# Validate nginx config
RUN nginx -t

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Starting health check server on port 8080..."\n\
node /app/healthcheck.js &\n\
HEALTH_PID=$!\n\
\n\
# Wait a moment for health check server to start\n\
sleep 2\n\
\n\
# Verify health server is responding\n\
echo "Testing health check server:"\n\
curl -v http://localhost:8080 || echo "WARNING: Health check server not responding"\n\
\n\
# Start nginx\n\
echo "Starting nginx..."\n\
nginx -g "daemon off;" &\n\
NGINX_PID=$!\n\
\n\
# Monitor both processes\n\
echo "Monitoring servers (nginx_pid=$NGINX_PID, health_pid=$HEALTH_PID)"\n\
wait $NGINX_PID\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose both ports
EXPOSE 80 8080

# Set environment variables
ENV HEALTH_PORT=8080

# Start both servers
CMD ["/app/entrypoint.sh"] 