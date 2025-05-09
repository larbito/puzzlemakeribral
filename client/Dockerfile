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

# Install necessary tools
RUN apk add --no-cache curl bash netcat-openbsd

# Create a health check file
RUN mkdir -p /health && \
    echo "healthy" > /health/index.html

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a separate health check server script
RUN echo '#!/bin/bash\n\
while true; do\n\
  echo -e "HTTP/1.1 200 OK\\r\\nContent-Length: 8\\r\\nContent-Type: text/plain\\r\\n\\r\\nhealthy\\n" | nc -l -p 8080\n\
done' > /health-server.sh && \
chmod +x /health-server.sh

# Create an entrypoint script
RUN echo '#!/bin/bash\n\
# Start the health check server in the background\n\
echo "Starting health check server on port 8080..."\n\
/health-server.sh &\n\
\n\
# Test that health server is working\n\
sleep 1\n\
echo "Testing health server:"\n\
curl -v http://localhost:8080 || echo "Health server not responding"\n\
\n\
# Start nginx in the foreground\n\
echo "Starting nginx..."\n\
exec nginx -g "daemon off;"' > /entrypoint.sh && \
chmod +x /entrypoint.sh

# Expose ports
EXPOSE 80 8080

# Start services
CMD ["/entrypoint.sh"] 