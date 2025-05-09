# Build stage
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./
COPY src ./src

# Install production dependencies using clean install
RUN npm ci --only=production --no-audit

EXPOSE 3000

CMD ["node", "src/index.js"] 