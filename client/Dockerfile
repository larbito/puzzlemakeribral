# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./

# Install dependencies
RUN npm install --no-cache

# Copy source files
COPY . .

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