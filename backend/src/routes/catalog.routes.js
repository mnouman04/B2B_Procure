import { Router } from 'express';
import * as controller from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';

const router = Router();

router.get('/categories', controller.categoryTree);
router.get('/categories/popular', controller.popularCategories);
router.get('/categories/:id/children', validate({ params: idParam }), controller.subCategories);
router.get('/search', controller.search);
router.get('/reference', controller.reference);

export default router;
