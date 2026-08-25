import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, requireCompany } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  createPoSchema, updateStatusSchema, orderListQuerySchema, reviewSchema,
} from '../validators/order.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router
  .route('/')
  .get(validate({ query: orderListQuerySchema }), controller.list)
  .post(
    authorize(ROLES.BUYER, ROLES.ADMIN),
    requireCompany,
    validate({ body: createPoSchema }),
    controller.issue,
  );

router.get('/:id', validate({ params: idParam }), controller.getOne);

// Orders & Delivery: Approved → Processing → Shipped → Delivered
router.patch(
  '/:id/status',
  validate({ params: idParam, body: updateStatusSchema }),
  controller.updateStatus,
);

router.post(
  '/:id/cancel',
  validate({ params: idParam, body: z.object({ reason: z.string().trim().min(3) }) }),
  controller.cancel,
);

router.post(
  '/:id/review',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam, body: reviewSchema }),
  controller.review,
);

export default router;
