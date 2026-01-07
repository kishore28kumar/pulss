import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@pulss/types';
import { prisma } from '@pulss/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  customerId?: string;
}

/**
 * Authenticate WebSocket connection using JWT token
 */
const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    if (decoded.type !== 'access') {
      return next(new Error('Invalid token type'));
    }

    // For customers, the JWT userId is actually the customer ID
    // We need to resolve it to the actual user ID
    if (decoded.role === 'CUSTOMER') {
      const customer = await prisma.customers.findUnique({
        where: { id: decoded.userId },
        select: { id: true, userId: true },
      });

      if (!customer) {
        return next(new Error('Customer not found'));
      }

      // Set the actual user ID for the socket
      socket.userId = customer.userId;
      socket.customerId = customer.id;
    } else {
      // For non-customers, userId is already the user ID
      socket.userId = decoded.userId;
    }

    socket.userRole = decoded.role;
    socket.tenantId = decoded.tenantId;

    next();
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    next(new Error('Authentication failed'));
  }
};

/**
 * Initialize Socket.io server
 */
let ioInstance: SocketIOServer | null = null;

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};

export const initializeSocketIO = (httpServer: HTTPServer) => {
  // Import getCorsOrigins to match Express CORS configuration
  const { getCorsOrigins } = require('../config/urls');
  const allowedOrigins = getCorsOrigins();
  const FALLBACK_ORIGINS = [
    'https://pulss-admin-dev.onrender.com',
    'https://pulss-store-dev.onrender.com',
    'https://pulss-admin.onrender.com',
    'https://pulss-storefront.onrender.com',
  ];
  const allAllowedOrigins = [...new Set([...allowedOrigins, ...FALLBACK_ORIGINS])];
  
  console.log('[Socket.io] Allowed origins:', allAllowedOrigins);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        try {
          // Allow requests with no origin (like mobile apps)
          if (!origin) {
            return callback(null, true);
          }
          
          // Normalize origin (remove trailing slash)
          const normalizedOrigin = origin.replace(/\/$/, '');
          
          // Check if origin is in allowed list
          const isAllowed = allAllowedOrigins.some(allowed => {
            const normalizedAllowed = allowed.replace(/\/$/, '');
            return normalizedAllowed === normalizedOrigin || allowed === origin;
          }) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
          
          if (isAllowed) {
            callback(null, true);
          } else {
            console.warn(`[Socket.io] Rejected origin: ${origin}`);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
          }
        } catch (error) {
          console.error('[Socket.io] Error in origin callback:', error);
          // In development, allow on error; in production, reject
          if (process.env.NODE_ENV === 'development') {
            callback(null, true);
          } else {
            callback(new Error('CORS validation failed'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true, // Allow Engine.IO v3 clients
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room for mail notifications (Super Admin and Admin only)
    if (socket.userRole === 'SUPER_ADMIN' || socket.userRole === 'ADMIN') {
      socket.join(`user:${socket.userId}`);
      console.log(`📧 User ${socket.userId} joined mail room: user:${socket.userId}`);
    }

    // Join tenant room
    socket.on('join-tenant', async (tenantSlug: string) => {
      try {
        // Verify tenant exists and user has access
        if (socket.userRole === 'SUPER_ADMIN') {
          // Super admin can join any tenant
          socket.join(`tenant:${tenantSlug}`);
          console.log(`👑 Super admin ${socket.userId} joined tenant: ${tenantSlug}`);
        } else if (socket.userRole === 'CUSTOMER') {
          // Customers can only join their own tenant
          if (socket.tenantId) {
            // Get tenant slug for room name (consistent with admin rooms)
            const tenant = await prisma.tenants.findUnique({
              where: { id: socket.tenantId },
              select: { slug: true },
            });
            if (tenant) {
              socket.join(`tenant:${tenant.slug}`);
              console.log(`👤 Customer ${socket.userId} joined tenant: ${tenant.slug}`);
            }
          }
        } else {
          // Admins/staff can only join their own tenant
          if (socket.tenantId) {
            // Get tenant slug for room name
            const tenant = await prisma.tenants.findUnique({
              where: { id: socket.tenantId },
              select: { slug: true },
            });
            if (tenant) {
              socket.join(`tenant:${tenant.slug}`);
              console.log(`👔 Admin/Staff ${socket.userId} joined tenant: ${tenant.slug}`);
            }
          }
        }
      } catch (error) {
        console.error('Error joining tenant:', error);
        socket.emit('error', { message: 'Failed to join tenant' });
      }
    });

    // Handle incoming messages
    socket.on('message', async (data: { text: string; tenantId?: string; tenantSlug?: string; customerId?: string }) => {
      try {
        const { text, tenantId, tenantSlug, customerId: messageCustomerId } = data;
        const senderId = socket.userId!;
        const senderRole = socket.userRole!;
        
        // Verify sender exists in database
        const sender = await prisma.users.findUnique({
          where: { id: senderId },
          select: { id: true, role: true },
        });
        
        if (!sender) {
          console.error(`[Socket] Sender not found in database: ${senderId}`);
          socket.emit('error', { message: 'User not found. Please log in again.' });
          return;
        }
        
        // Super Admins can send to any tenant, Admins only to their own tenant
        let targetTenantId: string;
        let targetTenantSlug: string;
        
        if (senderRole === 'SUPER_ADMIN') {
          // Super Admin must provide tenantSlug (which we'll resolve to tenantId)
          const slug = tenantSlug || tenantId; // Accept either slug or ID for backward compatibility
          if (!slug) {
            socket.emit('error', { message: 'Tenant slug is required for Super Admin' });
            return;
          }
          
          // Resolve tenant slug to tenant ID
          const tenant = await prisma.tenants.findUnique({
            where: { slug: slug, status: 'ACTIVE' },
            select: { id: true, slug: true },
          });
          
          if (!tenant) {
            socket.emit('error', { message: 'Tenant not found' });
            return;
          }
          
          targetTenantId = tenant.id;
          targetTenantSlug = tenant.slug;
        } else {
          // Admins/Staff/Customers can only send to their own tenant
          targetTenantId = socket.tenantId!;
          // Get tenant slug for room name
          const tenant = await prisma.tenants.findUnique({
            where: { id: targetTenantId },
            select: { slug: true },
          });
          targetTenantSlug = tenant?.slug || targetTenantId;
        }

        if (!text || !text.trim()) {
          socket.emit('error', { message: 'Message text is required' });
          return;
        }

        if (!targetTenantId) {
          socket.emit('error', { message: 'Tenant ID is required' });
          return;
        }

        // Determine sender type
        let senderType: string;
        if (senderRole === 'CUSTOMER') {
          senderType = 'customer';
        } else if (senderRole === 'SUPER_ADMIN') {
          senderType = 'super_admin';
        } else if (senderRole === 'ADMIN') {
          senderType = 'admin';
        } else {
          senderType = 'staff';
        }

        // Save message to database
        // For customers, customerId is their own customer ID
        // For admins/staff/super_admin, customerId is the customer they're replying to (from data)
        const dbCustomerId: string | null = senderRole === 'CUSTOMER' 
          ? (socket.customerId || null)
          : (messageCustomerId || null);
        
        // Define message type
        type MessageWithSender = {
          id: string;
          text: string;
          senderId: string;
          senderType: string;
          customerId: string | null;
          createdAt: Date;
          readAt: Date | null;
          sender: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            email: string;
            avatar: string | null;
          };
        };
        
        let message: MessageWithSender;
        try {
          const dbMessage = await prisma.messages.create({
            data: {
              text: text.trim(),
              senderId, // This is now the user ID (resolved from customer ID if needed)
              senderType,
              tenantId: targetTenantId,
              customerId: dbCustomerId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          });
          message = {
            id: dbMessage.id,
            text: dbMessage.text,
            senderId: dbMessage.senderId,
            senderType: dbMessage.senderType,
            customerId: dbMessage.customerId,
            createdAt: dbMessage.createdAt,
            readAt: dbMessage.readAt,
            sender: dbMessage.sender,
          };
        } catch (dbError: any) {
          // If table doesn't exist, create a temporary message object for broadcasting
          // but don't save to database
          if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
            console.warn('[Socket] Messages table does not exist yet. Message will not be persisted.');
            // Get sender info from users table
            const sender = await prisma.users.findUnique({
              where: { id: senderId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            });
            
            // Create temporary message object (won't be persisted)
            message = {
              id: `temp_${Date.now()}`,
              text: text.trim(),
              senderId,
              senderType,
              customerId: dbCustomerId,
              createdAt: new Date(),
              readAt: null,
              sender: sender || {
                id: senderId,
                firstName: null,
                lastName: null,
                email: '',
                avatar: null,
              },
            };
          } else {
            throw dbError;
          }
        }

        // Format message for frontend (ensure dates are ISO strings)
        const formattedMessage = {
          id: message.id,
          text: message.text,
          senderId: message.senderId,
          senderType: message.senderType as any,
          customerId: message.customerId,
          createdAt: message.createdAt.toISOString(),
          readAt: message.readAt ? message.readAt.toISOString() : null,
          sender: message.sender,
        };

        // Broadcast to all users in the tenant room (use slug for room name)
        console.log(`📤 Broadcasting message to room: tenant:${targetTenantSlug}`);
        io.to(`tenant:${targetTenantSlug}`).emit('message', formattedMessage);
        
        // Also send to sender (in case they're not in the room yet)
        socket.emit('message', formattedMessage);

        console.log(`💬 Message sent by ${senderId} (${senderRole}) in tenant ${targetTenantSlug}`);
      } catch (error: any) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { tenantId?: string; isTyping: boolean }) => {
      try {
        const { tenantId, isTyping } = data;
        const targetTenantId = tenantId || socket.tenantId!;

        if (!targetTenantId) return;

        // Broadcast typing status to others in the tenant room
        socket.to(`tenant:${targetTenantId}`).emit('typing', {
          userId: socket.userId,
          isTyping,
        });
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  ioInstance = io;
  return io;
};

