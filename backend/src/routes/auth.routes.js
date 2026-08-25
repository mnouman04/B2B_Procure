import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  loginSchema, registerCompanySchema, registerSupplierSchema,
  refreshSchema, changePasswordSchema, updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts — try again in a few minutes' },
});

router.post('/register/company', authLimiter, validate({ body: registerCompanySchema }), controller.registerCompany);
router.post('/register/supplier', authLimiter, validate({ body: registerSupplierSchema }), controller.registerSupplier);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshSchema }), controller.refresh);
router.post('/logout', controller.logout);

router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), controller.updateProfile);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), controller.changePassword);

export default router;
