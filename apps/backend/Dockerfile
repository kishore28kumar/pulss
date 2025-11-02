# Backend Dockerfile
FROM node:18-alpine AS base

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

WORKDIR /app/apps/backend

RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 5000

CMD ["npm", "start"]

