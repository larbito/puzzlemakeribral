# Build stage for client
FROM oven/bun:1 as client-builder

WORKDIR /build
COPY client/package*.json ./
COPY .npmrc ./

# Install dependencies
RUN bun install --no-save

# Build client
COPY client/ ./
RUN bun run build

# Build stage for server
FROM oven/bun:1 as server-builder

WORKDIR /build
COPY server/package*.json ./
COPY .npmrc ./

# Install only production dependencies
RUN bun install --production --no-save

# Final stage
FROM oven/bun:1

WORKDIR /app

# Copy only necessary files
COPY --from=server-builder /build/node_modules ./node_modules
COPY server/src ./src
COPY --from=client-builder /build/dist ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["bun", "src/index.js"] 