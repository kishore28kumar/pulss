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

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG DEPLOY_ENV
ARG NEXT_PUBLIC_TENANT_SLUG
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Set as environment variables for the build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV DEPLOY_ENV=${DEPLOY_ENV}
ENV NEXT_PUBLIC_TENANT_SLUG=${NEXT_PUBLIC_TENANT_SLUG}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
WORKDIR /app/packages/types
RUN npm run build

# Build storefront
WORKDIR /app/apps/storefront
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy the entire monorepo structure to maintain local package references
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/storefront/.next ./apps/storefront/.next
COPY --from=builder /app/apps/storefront/public ./apps/storefront/public
COPY --from=builder /app/apps/storefront/package*.json ./apps/storefront/
COPY --from=builder /app/apps/storefront/next.config.js ./apps/storefront/

WORKDIR /app/apps/storefront

EXPOSE 3000

CMD ["npm", "start"]

