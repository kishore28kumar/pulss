# Backend Dockerfile
# Use Debian-based image for better OpenSSL compatibility
FROM node:18-slim AS base

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm install

# Development stage
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/backend

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy the entire monorepo structure to maintain local package references
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/

WORKDIR /app/apps/backend

EXPOSE 5000

CMD ["npm", "start"]

