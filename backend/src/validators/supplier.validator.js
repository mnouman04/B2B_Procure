import { z } from 'zod';
import { objectId, paginationQuery } from './common.validator.js';
import { DOCUMENT_TYPES, VERIFICATION_STATUS, UNITS } from '../config/constants.js';

export const supplierListQuerySchema = paginationQuery.extend({
  category: objectId.optional(),
  city: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verified: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(2).optional(),
  nameAr: z.string().trim().optional(),
  tagline: z.string().trim().optional(),
  about: z.string().trim().optional(),
  aboutAr: z.string().trim().optional(),
  logo: z.string().optional(),
  categories: z.array(objectId).optional(),
  primaryCategory: objectId.optional(),
  tags: z.array(z.string()).optional(),
  vatNumber: z.string().trim().optional(),
  iban: z.string().trim().optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      contactPerson: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      address: z.string().optional(),
      lat: z.coerce.number().nullable().optional(),
      lng: z.coerce.number().nullable().optional(),
    })
    .optional(),
  coverageAreas: z.array(z.string()).optional(),
  certifications: z
    .array(z.object({ name: z.string(), issuer: z.string().optional(), year: z.coerce.number().optional() }))
    .optional(),
  pastProjects: z
    .array(
      z.object({
        name: z.string(),
        client: z.string().optional(),
        year: z.coerce.number().optional(),
        value: z.coerce.number().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  foundedYear: z.coerce.number().optional(),
  employees: z.coerce.number().optional(),
  avgLeadTimeDays: z.coerce.number().optional(),
});

export const addDocumentSchema = z.object({
  type: z.nativeEnum(DOCUMENT_TYPES),
  name: z.string().trim().min(2),
  url: z.string().min(1),
  number: z.string().trim().optional().default(''),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const verifySupplierSchema = z.object({
  status: z.enum([
    VERIFICATION_STATUS.VERIFIED,
    VERIFICATION_STATUS.REJECTED,
    VERIFICATION_STATUS.UNDER_REVIEW,
    VERIFICATION_STATUS.SUSPENDED,
  ]),
  reason: z.string().trim().optional().default(''),
  documentDecisions: z
    .array(z.object({ documentId: objectId, status: z.string(), note: z.string().optional() }))
    .optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2),
  nameAr: z.string().trim().optional().default(''),
  category: objectId,
  description: z.string().trim().optional().default(''),
  specifications: z.array(z.object({ key: z.string(), value: z.string(), unit: z.string().optional() })).default([]),
  unit: z.enum(UNITS).default('pcs'),
  priceFrom: z.coerce.number().nonnegative().nullable().optional(),
  priceTo: z.coerce.number().nonnegative().nullable().optional(),
  minOrderQuantity: z.coerce.number().positive().default(1),
  leadTimeDays: z.coerce.number().int().nonnegative().default(7),
  images: z.array(z.string()).default([]),
});
