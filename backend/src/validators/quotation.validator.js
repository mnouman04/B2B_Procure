import { z } from 'zod';
import { objectId, attachment, paginationQuery } from './common.validator.js';
import { QUOTATION_STATUS } from '../config/constants.js';

const quoteItem = z.object({
  rfqItemId: objectId,
  name: z.string().trim().min(1),
  brand: z.string().trim().optional().default(''),
  quantity: z.coerce.number().positive(),
  unit: z.string().optional().default('pcs'),
  unitPrice: z.coerce.number().nonnegative('Unit price is required'),
  specCompliance: z.coerce.number().min(0).max(100).default(100),
  notes: z.string().trim().optional().default(''),
});

export const createQuotationSchema = z.object({
  rfq: objectId,
  items: z.array(quoteItem).min(1, 'Price at least one item'),
  deliveryDays: z.coerce.number().int().min(1, 'Delivery time is required'),
  warrantyYears: z.coerce.number().min(0).default(1),
  paymentTerms: z.string().trim().default('30 Days'),
  validUntil: z.coerce.date().nullable().optional(),
  incoterms: z.string().trim().default('DDP'),
  discount: z.coerce.number().nonnegative().default(0),
  terms: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
  attachments: z.array(attachment).default([]),
  status: z.enum([QUOTATION_STATUS.DRAFT, QUOTATION_STATUS.SUBMITTED]).default(QUOTATION_STATUS.DRAFT),
});

export const updateQuotationSchema = createQuotationSchema.partial().omit({ rfq: true });

export const reviseQuotationSchema = z.object({
  items: z.array(quoteItem).optional(),
  deliveryDays: z.coerce.number().int().min(1).optional(),
  discount: z.coerce.number().nonnegative().optional(),
  note: z.string().trim().min(1, 'Explain what changed in this revision'),
});

export const rejectQuotationSchema = z.object({
  reason: z.string().trim().min(3, 'Give the supplier a reason'),
});

export const quotationListQuerySchema = paginationQuery.extend({
  status: z.string().optional(),
  rfq: objectId.optional(),
});
