FROM node:20-alpine

WORKDIR /app

# 1. Copy package manifests first for caching layers
COPY package*.json ./

# 2. Install dependencies (npm ci is faster and ensures clean lockfile alignment)
RUN npm ci

# 3. Copy the rest of the source code
COPY . .

# 4. Compile the Next.js application (requires the copied source code)
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]