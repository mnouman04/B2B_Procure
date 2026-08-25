import { Router } from 'express';
import * as controller from '../controllers/supplier.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize, requireSupplier } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  supplierListQuerySchema, updateSupplierSchema, addDocumentSchema,
  verifySupplierSchema, productSchema,
} from '../validators/supplier.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// ── Public directory ────────────────────────────────────────────
router.get('/', optionalAuth, validate({ query: supplierListQuerySchema }), controller.list);
router.get('/top-rated', controller.topRated);

// ── The signed-in supplier's own record ─────────────────────────
router.get('/me', authenticate, authorize(ROLES.SUPPLIER), requireSupplier, controller.myProfile);
router.patch(
  '/me',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  validate({ body: updateSupplierSchema }),
  controller.updateMyProfile,
);

// Vendor Verification
router.post(
  '/me/documents',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  validate({ body: addDocumentSchema }),
  controller.addDocument,
);
router.delete(
  '/me/documents/:documentId',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  controller.removeDocument,
);
router.post(
  '/me/submit-verification',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  controller.submitVerification,
);

// Products & Services catalogue
router.get('/me/products', authenticate, authorize(ROLES.SUPPLIER), requireSupplier, controller.listProducts);
router.post(
  '/me/products',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  validate({ body: productSchema }),
  controller.addProduct,
);
router.patch(
  '/me/products/:productId',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  validate({ body: productSchema.partial() }),
  controller.updateProduct,
);
router.delete(
  '/me/products/:productId',
  authenticate, authorize(ROLES.SUPPLIER), requireSupplier,
  controller.removeProduct,
);

// ── Admin verification decision ─────────────────────────────────
router.post(
  '/:id/verification',
  authenticate, authorize(ROLES.ADMIN),
  validate({ params: idParam, body: verifySupplierSchema }),
  controller.decideVerification,
);

// ── Public profile (kept last so it never shadows /me) ──────────
router.get('/:idOrSlug', optionalAuth, controller.publicProfile);

export default router;
