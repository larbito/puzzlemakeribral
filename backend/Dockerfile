FROM node:18-bullseye

# Install Inkscape, Xvfb and related dependencies for headless operation
RUN apt-get update && apt-get install -y \
    inkscape \
    xvfb \
    dbus-x11 \
    potrace \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to optimize for headless operation
ENV INKSCAPE_USE_PIPE=1
ENV INKSCAPE_NO_INTERACTIVE=1
ENV DISPLAY=:99

# Create wrapper script for running Inkscape with virtual display and resource limits
RUN echo '#!/bin/bash\nxvfb-run -a --server-args="-screen 0 1280x1024x24" nice -n 19 inkscape "$@"' > /usr/local/bin/inkscape-headless \
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