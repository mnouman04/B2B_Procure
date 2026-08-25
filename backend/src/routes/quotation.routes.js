import { Router } from 'express';
import * as controller from '../controllers/quotation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, requireCompany, requireSupplier } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  createQuotationSchema, updateQuotationSchema, reviseQuotationSchema,
  rejectQuotationSchema, quotationListQuerySchema,
} from '../validators/quotation.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router
  .route('/')
  .get(validate({ query: quotationListQuerySchema }), controller.list)
  .post(
    authorize(ROLES.SUPPLIER, ROLES.ADMIN),
    requireSupplier,
    validate({ body: createQuotationSchema }),
    controller.create,
  );

router
  .route('/:id')
  .get(validate({ params: idParam }), controller.getOne)
  .patch(
    authorize(ROLES.SUPPLIER, ROLES.ADMIN),
    requireSupplier,
    validate({ params: idParam, body: updateQuotationSchema }),
    controller.update,
  );

// Supplier side
router.post(
  '/:id/revise',
  authorize(ROLES.SUPPLIER, ROLES.ADMIN),
  requireSupplier,
  validate({ params: idParam, body: reviseQuotationSchema }),
  controller.revise,
);
router.post(
  '/:id/withdraw',
  authorize(ROLES.SUPPLIER, ROLES.ADMIN),
  requireSupplier,
  validate({ params: idParam }),
  controller.withdraw,
);

// Buyer side
router.post(
  '/:id/shortlist',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam }),
  controller.shortlist,
);
router.post(
  '/:id/reject',
  authorize(ROLES.BUYER, ROLES.ADMIN),
  requireCompany,
  validate({ params: idParam, body: rejectQuotationSchema }),
  controller.reject,
);

export default router;
