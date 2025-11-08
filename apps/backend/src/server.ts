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

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      process.env.ADMIN_URL || 'http://localhost:3001',
      process.env.STOREFRONT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
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

app.listen(PORT, () => {
  console.log(`🚀 Pulss Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

