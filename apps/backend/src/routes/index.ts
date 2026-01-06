import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import cartRoutes from './cartRoutes';
import stripeRoutes from './stripeRoutes';
import customerRoutes from './customerRoutes';
import staffRoutes from './staffRoutes';
import analyticsRoutes from './analyticsRoutes';
import reportRoutes from './reportRoutes';
import uploadRoutes from './uploadRoutes';
import chatRoutes from './chatRoutes';

const router = Router();

// Routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/cart', cartRoutes);
router.use('/stripe', stripeRoutes);
router.use('/staff', staffRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);

export default router;
