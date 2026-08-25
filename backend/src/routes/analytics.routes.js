import { Router } from 'express';
import * as controller from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, requireCompany, requireSupplier } from '../middleware/rbac.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Home page counters — public.
router.get('/platform', controller.platformStats);

router.get(
  '/buyer/dashboard',
  authenticate, authorize(ROLES.BUYER, ROLES.ADMIN), requireCompany,
  controller.buyerDashboard,
);

router.get(
  '/buyer/procurement',
  authenticate, authorize(ROLES.BUYER, ROLES.ADMIN), requireCompany,
  controller.procurement,
);

router.get(
  '/supplier/dashboard',
  authenticate, authorize(ROLES.SUPPLIER, ROLES.ADMIN), requireSupplier,
  controller.supplierDashboard,
);

router.get('/admin/dashboard', authenticate, authorize(ROLES.ADMIN), controller.adminDashboard);

export default router;
