import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { ROLES, VERIFICATION_STATUS } from '../config/constants.js';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/companies', controller.companies);
router.patch(
  '/companies/:id/status',
  validate({ params: idParam, body: z.object({ status: z.nativeEnum(VERIFICATION_STATUS) }) }),
  controller.setCompanyStatus,
);

router.get('/suppliers', controller.suppliers);
router.get('/verification-queue', controller.verificationQueue);

router.get('/users', controller.users);
router.patch(
  '/users/:id/active',
  validate({ params: idParam, body: z.object({ isActive: z.boolean() }) }),
  controller.setUserActive,
);

router.get('/rfqs', controller.rfqs);
router.get('/commissions', controller.commissions);
router.get('/commissions/totals', controller.commissionTotals);

const categoryBody = z.object({
  name: z.string().trim().min(2),
  nameAr: z.string().trim().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  parent: z.string().nullable().optional(),
  order: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

router.post('/categories', validate({ body: categoryBody }), controller.createCategory);
router.patch('/categories/:id', validate({ params: idParam, body: categoryBody.partial() }), controller.updateCategory);
router.delete('/categories/:id', validate({ params: idParam }), controller.removeCategory);

export default router;
