FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app (including src/, app/, public/, etc.)
COPY . .

# Set environment variable for Clerk (Next.js expects NEXT_PUBLIC_ prefix for client-side usage)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Set environment variable for Clerk (Next.js expects CLERK_ prefix for backend usage)
ARG CLERK_SECRET_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Expose the dev port
EXPOSE 3000

# Start Next.js in dev mode, listening on all interfaces
CMD ["npm", "run", "dev"]