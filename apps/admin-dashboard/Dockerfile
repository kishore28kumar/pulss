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

RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/admin-dashboard/.next ./.next
COPY --from=builder /app/apps/admin-dashboard/public ./public
COPY --from=builder /app/apps/admin-dashboard/package*.json ./
COPY --from=builder /app/apps/admin-dashboard/next.config.js ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001

CMD ["npm", "start"]

