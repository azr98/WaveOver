FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app (including src/, app/, public/, etc.)
COPY . .

# Set environment variable for Clerk
ARG NEXT_APP_CLERK_PUBLISHABLE_KEY
ENV NEXT_APP_CLERK_PUBLISHABLE_KEY=$NEXT_APP_CLERK_PUBLISHABLE_KEY

# Expose the dev port
EXPOSE 3000

# Start Next.js in dev mode, listening on all interfaces
CMD ["npm", "run", "dev"]