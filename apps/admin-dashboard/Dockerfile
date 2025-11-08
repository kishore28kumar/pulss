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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

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

