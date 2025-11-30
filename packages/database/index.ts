import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// For Prisma 7+, you can use adapter or accelerateUrl here
// For Prisma 5, DATABASE_URL from .env is used automatically
// Prisma Client will read DATABASE_URL from environment variables
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Prisma 7+ example:
    // adapter: postgresAdapter(process.env.DATABASE_URL),
    // or: accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection retry helper function
export async function connectWithRetry(maxRetries = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connection established');
      return;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, errorMessage);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error('❌ Failed to connect to database after all retries');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMessage}`);
      }
    }
  }
}

// Graceful disconnect
export async function disconnect(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnect();
  });
  
  process.on('SIGINT', async () => {
    await disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await disconnect();
    process.exit(0);
  });
}

export * from '@prisma/client';

