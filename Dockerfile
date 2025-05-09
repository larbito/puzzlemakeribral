# Build stage for client
FROM node:18-alpine AS client-build-v1

WORKDIR /app/client

# Copy only package files first
COPY client/package.json ./package.json
COPY client/package-lock.json ./package-lock.json
COPY .npmrc ./.npmrc

# Install dependencies with --no-cache flag
RUN npm install --no-cache

# Copy client source
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./index.html
COPY client/vite.config.ts ./vite.config.ts
COPY client/tsconfig.json ./tsconfig.json
COPY client/tailwind.config.js ./tailwind.config.js
COPY client/postcss.config.js ./postcss.config.js

# Build client
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-build-v1

WORKDIR /app/server

# Copy only package files first
COPY server/package.json ./package.json
COPY server/package-lock.json ./package-lock.json
COPY .npmrc ./.npmrc

# Install only production dependencies
RUN npm install --production --no-cache

# Copy server source
COPY server/src ./src

# Final stage
FROM node:18-alpine AS production-v1

WORKDIR /app

# Copy built files from previous stages
COPY --from=server-build-v1 /app/server/node_modules ./node_modules
COPY --from=server-build-v1 /app/server/src ./src
COPY --from=client-build-v1 /app/client/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"] 