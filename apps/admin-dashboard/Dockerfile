# Admin Dashboard Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/admin-dashboard/package*.json ./apps/admin-dashboard/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm install

# Development stage
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/admin-dashboard

EXPOSE 3001

CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app

# Accept build arguments for environment variables (with defaults)
ARG NEXT_PUBLIC_API_URL
ARG DEPLOY_ENV
ARG NEXT_PUBLIC_TENANT_SLUG

# Set as environment variables for the build
# Use ARG value if provided, otherwise keep empty (will be set by Render's env vars)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV DEPLOY_ENV=${DEPLOY_ENV}
ENV NEXT_PUBLIC_TENANT_SLUG=${NEXT_PUBLIC_TENANT_SLUG}

# Debug: Print environment variables during build
RUN echo "=== Build Environment Variables ===" && \
    echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-NOT_SET}" && \
    echo "DEPLOY_ENV=${DEPLOY_ENV:-NOT_SET}" && \
    echo "NEXT_PUBLIC_TENANT_SLUG=${NEXT_PUBLIC_TENANT_SLUG:-NOT_SET}" && \
    echo "==================================="

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
WORKDIR /app/packages/types
RUN npm run build

# Build admin dashboard
WORKDIR /app/apps/admin-dashboard
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy the entire monorepo structure to maintain local package references
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin-dashboard/.next ./apps/admin-dashboard/.next
COPY --from=builder /app/apps/admin-dashboard/public ./apps/admin-dashboard/public
COPY --from=builder /app/apps/admin-dashboard/package*.json ./apps/admin-dashboard/
COPY --from=builder /app/apps/admin-dashboard/next.config.js ./apps/admin-dashboard/

WORKDIR /app/apps/admin-dashboard

EXPOSE 3001

CMD ["npm", "start"]

