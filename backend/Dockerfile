FROM node:18-bullseye

# Install Inkscape, Xvfb and related dependencies for headless operation
RUN apt-get update && apt-get install -y \
    inkscape \
    xvfb \
    dbus-x11 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create wrapper script for running Inkscape with virtual display
RUN echo '#!/bin/bash\nxvfb-run -a inkscape "$@"' > /usr/local/bin/inkscape-headless \
    && chmod +x /usr/local/bin/inkscape-headless

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