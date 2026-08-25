import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { catalogService } from '../services/catalog.service.js';

export const categoryTree = asyncHandler(async (_req, res) =>
  ok(res, await catalogService.categoryTree()));

export const popularCategories = asyncHandler(async (req, res) =>
  ok(res, await catalogService.popularCategories(Number(req.query.limit) || 8)));

export const subCategories = asyncHandler(async (req, res) =>
  ok(res, await catalogService.subCategories(req.params.id)));

export const search = asyncHandler(async (req, res) =>
  ok(res, await catalogService.search(req.query.q, { limit: Number(req.query.limit) || 5 })));

export const reference = asyncHandler(async (_req, res) =>
  ok(res, catalogService.reference()));
