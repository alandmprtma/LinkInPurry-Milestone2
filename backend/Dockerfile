# Base image with build tools
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY .env.example ./.env.

ENV PORT = 3000

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Create the 'uploads' directory and set permissions
RUN mkdir -p frontend/public/pfp

# Expose the backend port
EXPOSE 3000

# Use "npm run dev" for development, "npm start" for production
CMD [ "npm", "run", "dev" ]
