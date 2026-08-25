import { z } from 'zod';
import { objectId, attachment, paginationQuery } from './common.validator.js';

export const startConversationSchema = z.object({
  supplierId: objectId.optional(),
  companyId: objectId.optional(),
  participantId: objectId.optional(),
  rfqId: objectId.nullable().optional(),
  purchaseOrderId: objectId.nullable().optional(),
  subject: z.string().trim().optional().default(''),
  body: z.string().trim().min(1, 'Write a message'),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Write a message'),
  attachments: z.array(attachment).default([]),
});

export const conversationQuerySchema = paginationQuery;
