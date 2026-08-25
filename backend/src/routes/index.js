import { Router } from 'express';
import authRoutes from './auth.routes.js';
import catalogRoutes from './catalog.routes.js';
import supplierRoutes from './supplier.routes.js';
import rfqRoutes from './rfq.routes.js';
import quotationRoutes from './quotation.routes.js';
import orderRoutes from './order.routes.js';
import messageRoutes from './message.routes.js';
import notificationRoutes from './notification.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'PROCURIO API is running', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/quotations', quotationRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);

export default router;
