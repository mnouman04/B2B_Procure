import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

export const idParam = z.object({ id: objectId });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sort: z.string().optional(),
  q: z.string().trim().optional(),
});

export const attachment = z.object({
  name: z.string(),
  url: z.string(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
});

export const specification = z.object({
  key: z.string().min(1, 'Specification name is required'),
  value: z.string().min(1, 'Specification value is required'),
  unit: z.string().optional().default(''),
});
