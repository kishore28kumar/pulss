import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// For Prisma 7+, you can use adapter or accelerateUrl here
// For Prisma 5, DATABASE_URL from .env is used automatically
// Prisma Client will read DATABASE_URL from environment variables
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Use event-based logging to filter out non-critical connection errors
    log: process.env.NODE_ENV === 'development' 
      ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
      : [{ emit: 'event', level: 'error' }],
    // Prisma 7+ example:
    // adapter: postgresAdapter(process.env.DATABASE_URL),
    // or: accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
  });

// Handle Prisma log events with filtering for non-critical errors
prisma.$on('error' as never, (e: any) => {
  const message = e.message || String(e);
  
  // Filter out connection closed errors - these are normal connection pool cleanup
  // Prisma automatically reconnects on the next query
  if (
    message.includes('Error in PostgreSQL connection') &&
    (message.includes('kind: Closed') || message.includes('Closed'))
  ) {
    // This is a connection pool cleanup, not a critical error
    // Connection will be automatically re-established on next query
    return;
  }
  
  // Log actual errors
  console.error('[Prisma error]:', message);
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log(`[Prisma query]: ${e.query} - ${e.duration}ms`);
  });
  
  prisma.$on('warn' as never, (e: any) => {
    console.warn('[Prisma warn]:', e.message || String(e));
  });
}

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

// Health check function - tests database connection
export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('⚠️  Database connection health check failed:', error);
    return false;
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

