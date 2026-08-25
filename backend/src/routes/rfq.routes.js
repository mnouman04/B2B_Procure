import { Router } from 'express';
import * as controller from '../controllers/rfq.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, requireCompany } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  createRfqSchema, updateRfqSchema, publishRfqSchema,
  matchQuerySchema, rfqListQuerySchema,
} from '../validators/rfq.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.get('/strategies', controller.strategies);

router
  .route('/')
  .get(validate({ query: rfqListQuerySchema }), controller.list)
  .post(
    authorize(ROLES.BUYER, ROLES.ADMIN),
    requireCompany,
    validate({ body: createRfqSchema }),
    controller.create,
  );

router
  .route('/:id')
  .get(validate({ params: idParam }), controller.getOne)
  .patch(
    authorize(ROLES.BUYER, ROLES.ADMIN),
    requireCompany,
    validate({ params: idParam, body: updateRfqSchema }),
    controller.update,
  )
  .delete(
    authorize(ROLES.BUYER, ROLES.ADMIN),
    requireCompany,
    validate({ params: idParam }),
    controller.remove,
  );

// Supplier Matching — "We found N verified suppliers"
router.get(
  '/:id/matches',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam, query: matchQuerySchema }),
  controller.matches,
);

router.post(
  '/:id/publish',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam, body: publishRfqSchema }),
  controller.publish,
);

// Compare Quotations
router.get('/:id/comparison', validate({ params: idParam }), controller.comparison);

router.post(
  '/:id/close',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam }),
  controller.close,
);

export default router;
