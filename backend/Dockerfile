FROM node:18-bullseye

# Install Inkscape
RUN apt-get update && apt-get install -y \
    inkscape \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Inkscape installation
RUN inkscape --version

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port for the app
EXPOSE 3000

# Run the app
CMD ["npm", "start"] 