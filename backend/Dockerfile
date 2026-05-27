FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the backend source files
COPY . .

# Expose backend port
EXPOSE 3001

# Run the dev/start script
CMD ["node", "app.js"]