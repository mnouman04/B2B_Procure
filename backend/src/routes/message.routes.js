import { Router } from 'express';
import * as controller from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  startConversationSchema, sendMessageSchema, conversationQuerySchema,
} from '../validators/message.validator.js';

const router = Router();
router.use(authenticate);

router
  .route('/conversations')
  .get(validate({ query: conversationQuerySchema }), controller.listConversations)
  .post(validate({ body: startConversationSchema }), controller.start);

router.get('/conversations/:id', validate({ params: idParam }), controller.getConversation);

router
  .route('/conversations/:id/messages')
  .get(validate({ params: idParam }), controller.listMessages)
  .post(validate({ params: idParam, body: sendMessageSchema }), controller.send);

export default router;
