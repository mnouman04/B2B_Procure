import { z } from 'zod';
import { objectId, paginationQuery } from './common.validator.js';
import { PO_STATUS } from '../config/constants.js';

export const createPoSchema = z.object({
  quotationId: objectId,
  expectedDeliveryDate: z.coerce.date().optional(),
  paymentTerms: z.string().trim().optional(),
  notes: z.string().trim().optional().default(''),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(PO_STATUS),
  note: z.string().trim().optional().default(''),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
});

export const orderListQuerySchema = paginationQuery.extend({
  status: z.string().optional(),
  supplier: objectId.optional(),
});

export const reviewSchema = z.object({
  scores: z.object({
    quality: z.coerce.number().int().min(1).max(5),
    delivery: z.coerce.number().int().min(1).max(5),
    communication: z.coerce.number().int().min(1).max(5),
    pricing: z.coerce.number().int().min(1).max(5),
  }),
  title: z.string().trim().optional().default(''),
  comment: z.string().trim().optional().default(''),
});
