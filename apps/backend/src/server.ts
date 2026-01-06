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
import { connectWithRetry, checkConnection } from '@pulss/database';
import { initializeSocketIO } from './socket/socketHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.BACKEND_PORT || 5000;

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

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Normalize origin (remove trailing slash if present)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check if origin is in allowed list (also check normalized versions)
    const isAllowed = allowedCorsOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin || allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow localhost with any port
      if (process.env.NODE_ENV !== 'production' && origin?.includes('localhost')) {
        callback(null, true);
      } else {
        // Log rejected origin for debugging (only first few times to avoid log spam)
        const rejectCount = (global as any).corsRejectCount || 0;
        if (rejectCount < 10) {
          console.warn(`[CORS] Rejected origin: ${origin}`);
          console.log(`[CORS] Allowed origins:`, allowedCorsOrigins);
          (global as any).corsRejectCount = rejectCount + 1;
        }
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler as fallback (though cors middleware should handle it)
app.options('*', cors(corsOptions));

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
app.use((req, res, next) => {
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

app.use('/api', routes);

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

httpServer.listen(PORT, () => {
  console.log(`🚀 Pulss Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io server initialized`);
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

