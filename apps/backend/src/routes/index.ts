import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import cartRoutes from './cartRoutes';
import stripeRoutes from './stripeRoutes';

const router = Router();

// Routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/stripe', stripeRoutes);

export default router;
