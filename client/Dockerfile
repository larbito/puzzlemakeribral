# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy the entire client directory
COPY . .

# Install dependencies using clean install
RUN npm ci --no-audit

# Build
RUN npm run build

# Serve using a lightweight server
FROM nginx:alpine

# Copy built files
COPY --from=0 /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 