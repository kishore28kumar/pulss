import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import routes from './routes';
import { getCorsOrigins } from './config/urls';
import { connectWithRetry, checkConnection, prisma } from '@pulss/database';
import { initializeSocketIO } from './socket/socketHandler';
import adRoutes from './routes/adRoutes';


dotenv.config();

const app = express();
const httpServer = createServer(app);
// Render.com sets PORT automatically, fallback to BACKEND_PORT or 5000
// Convert to number since environment variables are strings
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 5000);

// Log CORS configuration at startup
const corsOrigins = getCorsOrigins();
console.log('[Server] CORS origins configured:', corsOrigins);

// ============================================
// MIDDLEWARE
// ============================================

// Security - Configure helmet to work with CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS - Uses environment-based URL configuration
// Cache allowed origins to avoid recalculating on every request
const allowedCorsOrigins = getCorsOrigins();

// Hardcoded fallback origins for development environment (as safety net)
// These are always allowed regardless of environment variables
const FALLBACK_ORIGINS = [
  'https://pulss-admin-dev.onrender.com',
  'https://pulss-store-dev.onrender.com',
  'https://pulss-admin.onrender.com',
  'https://pulss-storefront.onrender.com',
  // Also include variations that might be used
  'https://pulss-store-dev.onrender.com/',
  'https://pulss-admin-dev.onrender.com/',
];

// Combine allowed origins with fallbacks
const allAllowedOrigins = [...new Set([...allowedCorsOrigins, ...FALLBACK_ORIGINS])];

// Normalize all origins (remove trailing slashes) for consistent matching
const normalizedAllowedOrigins = allAllowedOrigins.map(origin => origin.replace(/\/$/, ''));

console.log('[CORS] Final allowed origins (including fallbacks):', allAllowedOrigins);
console.log('[CORS] Normalized allowed origins:', normalizedAllowedOrigins);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash if present)
      const normalizedOrigin = origin.replace(/\/$/, '');

      // Check if origin is in allowed list (check both original and normalized versions)
      const isAllowed = normalizedAllowedOrigins.includes(normalizedOrigin) ||
        allAllowedOrigins.includes(origin) ||
        allAllowedOrigins.some(allowed => {
          const normalizedAllowed = allowed.replace(/\/$/, '');
          return normalizedAllowed === normalizedOrigin;
        });

      if (isAllowed) {
        return callback(null, true);
      }

      // In development, allow localhost with any port
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      // Log rejected origin for debugging (only first few times to avoid log spam)
      const rejectCount = (global as any).corsRejectCount || 0;
      if (rejectCount < 10) {
        console.warn(`[CORS] Rejected origin: ${origin}`);
        console.log(`[CORS] Normalized origin: ${normalizedOrigin}`);
        console.log(`[CORS] Allowed origins:`, allAllowedOrigins);
        (global as any).corsRejectCount = rejectCount + 1;
      }

      // For production, reject unknown origins
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    } catch (error) {
      // If there's an error in the callback, log it but allow the request to prevent breaking CORS entirely
      console.error('[CORS] Error in origin callback:', error);
      callback(null, true); // Fallback to allowing the request
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false, // CORS middleware handles preflight and doesn't pass to next
  optionsSuccessStatus: 204,
};

// Apply CORS middleware FIRST - it handles OPTIONS automatically
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly as a fallback (in case CORS middleware doesn't catch it)
// This runs AFTER CORS middleware to ensure we catch any OPTIONS requests that weren't handled
app.options('*', (req: express.Request, res: express.Response): void => {
  const origin = req.headers.origin;

  // Log OPTIONS request for debugging (only first few)
  const optionsLogCount = (global as any).optionsLogCount || 0;
  if (optionsLogCount < 5) {
    console.log(`[CORS Preflight] OPTIONS ${req.path}`, { origin, headers: req.headers });
    (global as any).optionsLogCount = optionsLogCount + 1;
  }

  // Always set CORS headers for OPTIONS requests if origin is present and allowed
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allAllowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin || allowed === origin;
    }) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

    if (isAllowed) {
      // Set headers if not already set by CORS middleware
      if (!res.getHeader('Access-Control-Allow-Origin')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      if (!res.getHeader('Access-Control-Allow-Credentials')) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      if (!res.getHeader('Access-Control-Allow-Methods')) {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      }
      if (!res.getHeader('Access-Control-Allow-Headers')) {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Requested-With');
      }
      if (!res.getHeader('Access-Control-Max-Age')) {
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      res.status(204).end();
      return;
    } else {
      // Origin not allowed - log for debugging
      if (optionsLogCount < 5) {
        console.warn(`[CORS Preflight] Origin not allowed: ${origin}`);
        console.log(`[CORS Preflight] Allowed origins:`, allAllowedOrigins);
      }
    }
  }

  // If no origin or not allowed, respond with 204 but without CORS headers
  // Browser will reject this, which is correct behavior
  res.status(204).end();
});

// Ensure CORS headers are always set (even if CORS middleware fails)
// This runs AFTER CORS middleware as a backup
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  // For OPTIONS requests, ensure headers are set (backup in case CORS middleware failed)
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin && !res.getHeader('Access-Control-Allow-Origin')) {
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allAllowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return normalizedAllowed === normalizedOrigin || allowed === origin;
      }) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Requested-With');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
    }
    // Don't call next() for OPTIONS - let it end here
    return;
  }

  // For non-OPTIONS requests, set CORS headers as backup
  const origin = req.headers.origin;
  if (origin && !res.getHeader('Access-Control-Allow-Origin')) {
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allAllowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin || allowed === origin;
    }) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request logging middleware for CORS debugging (only log first few requests)
app.use((req, _res, next) => {
  if ((global as any).requestLogCount === undefined) (global as any).requestLogCount = 0;
  const logCount = (global as any).requestLogCount;
  if (logCount < 10 && req.method === 'OPTIONS') {
    console.log(`[CORS Preflight] ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers'],
    });
    (global as any).requestLogCount = logCount + 1;
  }
  next();
});

// Tenant resolution (extract tenant from subdomain or header)
app.use(tenantMiddleware);

// ============================================
// ROUTES
// ============================================

// Health check endpoint (must be before error handler)
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await checkConnection();
    res.status(200).json({
      status: 'ok',
      message: 'Pulss API is running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CORS is working correctly',
    origin: _req.headers.origin,
    allowedOrigins: allowedCorsOrigins,
  });
});

// Root endpoint for Render health checks
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Pulss API',
    version: '1.0.0'
  });
});

// Health check endpoint with database table verification
app.get('/health', async (_req, res) => {
  try {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: {},
    };

    // Check if critical tables exist
    const tablesToCheck = ['messages', 'broadcasts', 'internal_messages'];
    for (const tableName of tablesToCheck) {
      try {
        // Try a simple query to check if table exists
        if (tableName === 'messages') {
          await prisma.$queryRaw`SELECT 1 FROM messages LIMIT 1`;
        } else if (tableName === 'broadcasts') {
          await prisma.$queryRaw`SELECT 1 FROM broadcasts LIMIT 1`;
        } else if (tableName === 'internal_messages') {
          await prisma.$queryRaw`SELECT 1 FROM internal_messages LIMIT 1`;
        }
        health.tables[tableName] = 'exists';
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.code === 'P2021') {
          health.tables[tableName] = 'missing';
        } else {
          health.tables[tableName] = 'error';
        }
      }
    }

    const missingTables = Object.entries(health.tables)
      .filter(([_, status]) => status === 'missing')
      .map(([table]) => table);

    if (missingTables.length > 0) {
      health.status = 'degraded';
      health.warning = `Missing tables: ${missingTables.join(', ')}. Please run migrations.`;
    }

    res.status(missingTables.length > 0 ? 200 : 200).json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.use('/api', routes);
app.use('/api/ads', adRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

// Initialize database connection (non-blocking)
// Connection will be retried on first query if this fails
if (process.env.DATABASE_URL) {
  connectWithRetry(5, 2000).catch((error) => {
    console.warn('⚠️  Initial database connection failed, will retry on first query:', error.message);
  });
}

// Initialize Socket.io with error handling
try {
  initializeSocketIO(httpServer);
  console.log('✅ Socket.io initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Socket.io:', error);
  // Don't crash - continue without Socket.io if initialization fails
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pulss Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io server initialized`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);

  // Log health check endpoint
  console.log(`💚 Health check: http://localhost:${PORT}/`);
});

// Keep the process alive
httpServer.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // In production, log but don't exit immediately to allow graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    // Give time for logs to be written
    setTimeout(() => process.exit(1), 1000);
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, log but don't exit immediately
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 1000);
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});

export default app;

