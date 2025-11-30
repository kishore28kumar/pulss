import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import routes from './routes';
import { getCorsOrigins } from './config/urls';
import { connectWithRetry } from '@pulss/database';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

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
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getCorsOrigins();
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow localhost with any port
        if (process.env.NODE_ENV !== 'production' && origin?.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

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

// Tenant resolution (extract tenant from subdomain or header)
app.use(tenantMiddleware);

// ============================================
// ROUTES
// ============================================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Pulss API is running' });
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

app.listen(PORT, () => {
  console.log(`🚀 Pulss Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;

