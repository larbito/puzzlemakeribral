FROM node:18-bullseye

# Create app directory
WORKDIR /app

# Install system dependencies required for Sharp (libvips)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libvips-dev \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
COPY package*.json ./

# Force Sharp to use pre-built binaries instead of compiling from source
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

RUN npm install

# Bundle app source
COPY . .

# Expose port for the app
EXPOSE 3000

# Run the app
CMD ["npm", "start"] 