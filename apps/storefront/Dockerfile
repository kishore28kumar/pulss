# Storefront Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/storefront/package*.json ./apps/storefront/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm install

# Development stage
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/storefront

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/storefront

RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/storefront/.next ./.next
COPY --from=builder /app/apps/storefront/public ./public
COPY --from=builder /app/apps/storefront/package*.json ./
COPY --from=builder /app/apps/storefront/next.config.js ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]

