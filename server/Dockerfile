# Build stage
FROM node:18-alpine

WORKDIR /app

# Copy the entire server directory
COPY . .

# Install production dependencies using clean install
RUN npm ci --only=production --no-audit

EXPOSE 3000

CMD ["node", "src/index.js"] 