import { Router } from 'express';
import { uploadFiles } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, bucket } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/rfq', bucket('rfq'), upload.array('files', 10), uploadFiles);
router.post('/quotation', bucket('quotation'), upload.array('files', 10), uploadFiles);
router.post('/verification', bucket('verification'), upload.array('files', 10), uploadFiles);
router.post('/logo', bucket('logos'), upload.single('file'), uploadFiles);
router.post('/message', bucket('messages'), upload.array('files', 5), uploadFiles);

export default router;
