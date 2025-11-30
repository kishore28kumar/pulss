import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// For Prisma 7+, you can use adapter or accelerateUrl here
// For Prisma 5, DATABASE_URL from .env is used automatically
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Prisma 7+ example:
    // adapter: postgresAdapter(process.env.DATABASE_URL),
    // or: accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';

