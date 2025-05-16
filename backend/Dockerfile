FROM node:18-bullseye

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