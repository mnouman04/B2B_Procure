import { z } from 'zod';
import { objectId, attachment, specification, paginationQuery } from './common.validator.js';
import { UNITS, RFQ_STATUS, MATCHING_STRATEGIES } from '../config/constants.js';

const rfqItem = z.object({
  name: z.string().trim().min(2, 'Item name is required'),
  description: z.string().trim().optional().default(''),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit: z.enum(UNITS).default('pcs'),
  specifications: z.array(specification).default([]),
  targetPrice: z.coerce.number().nonnegative().nullable().optional(),
  attachments: z.array(attachment).default([]),
});

const deliveryLocation = z.object({
  city: z.string().trim().min(2, 'Delivery city is required'),
  region: z.string().trim().optional().default(''),
  country: z.string().trim().default('Saudi Arabia'),
  address: z.string().trim().optional().default(''),
  lat: z.coerce.number().nullable().optional(),
  lng: z.coerce.number().nullable().optional(),
});

export const createRfqSchema = z.object({
  title: z.string().trim().min(3, 'RFQ title is required'),
  category: objectId,
  subCategory: objectId.nullable().optional(),
  projectName: z.string().trim().optional().default(''),
  deliveryLocation,
  requiredDeliveryDate: z.coerce.date({ required_error: 'Required delivery date is missing' }),
  quotationDeadline: z.coerce.date().nullable().optional(),
  items: z.array(rfqItem).min(1, 'Add at least one item to the RFQ'),
  attachments: z.array(attachment).default([]),
  notes: z.string().trim().optional().default(''),
  budget: z.coerce.number().nonnegative().nullable().optional(),
  paymentTerms: z.string().trim().default('30 Days'),
  warrantyRequired: z.coerce.number().nonnegative().default(0),
  visibility: z.enum(['invited', 'public']).default('invited'),
  status: z.enum([RFQ_STATUS.DRAFT, RFQ_STATUS.PUBLISHED]).default(RFQ_STATUS.DRAFT),
});

export const updateRfqSchema = createRfqSchema.partial();

export const publishRfqSchema = z.object({
  supplierIds: z.array(objectId).default([]),
  strategy: z.nativeEnum(MATCHING_STRATEGIES).default(MATCHING_STRATEGIES.BEST_MATCH),
  autoInviteLimit: z.coerce.number().int().min(1).max(50).default(12),
  quotationDeadline: z.coerce.date().nullable().optional(),
});

export const matchQuerySchema = paginationQuery.extend({
  strategy: z.nativeEnum(MATCHING_STRATEGIES).default(MATCHING_STRATEGIES.BEST_MATCH),
  city: z.string().trim().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const rfqListQuerySchema = paginationQuery.extend({
  status: z.string().optional(),
  category: objectId.optional(),
  city: z.string().optional(),
});

export const awardSchema = z.object({
  quotationId: objectId,
  note: z.string().trim().optional().default(''),
});
