import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { supplierService } from '../services/supplier.service.js';

export const list = asyncHandler(async (req, res) =>
  paginated(res, await supplierService.list(req.query)));

export const topRated = asyncHandler(async (req, res) =>
  ok(res, await supplierService.topRated(Number(req.query.limit) || 4)));

export const publicProfile = asyncHandler(async (req, res) =>
  ok(res, await supplierService.getPublicProfile(req.params.idOrSlug)));

export const myProfile = asyncHandler(async (req, res) =>
  ok(res, await supplierService.getOwn(req.supplierId)));

export const updateMyProfile = asyncHandler(async (req, res) =>
  ok(res, await supplierService.update(req.supplierId, req.body), 'Profile updated'));

export const addDocument = asyncHandler(async (req, res) =>
  created(res, await supplierService.addDocument(req.supplierId, req.body), 'Document uploaded'));

export const removeDocument = asyncHandler(async (req, res) =>
  ok(res, await supplierService.removeDocument(req.supplierId, req.params.documentId), 'Document removed'));

export const submitVerification = asyncHandler(async (req, res) =>
  ok(res, await supplierService.submitForVerification(req.supplierId), 'Submitted for verification'));

export const decideVerification = asyncHandler(async (req, res) =>
  ok(res, await supplierService.decideVerification(req.params.id, req.body, req.user), 'Verification updated'));

export const listProducts = asyncHandler(async (req, res) =>
  paginated(res, await supplierService.listProducts(req.params.id || req.supplierId, req.query)));

export const addProduct = asyncHandler(async (req, res) =>
  created(res, await supplierService.addProduct(req.supplierId, req.body), 'Product added'));

export const updateProduct = asyncHandler(async (req, res) =>
  ok(res, await supplierService.updateProduct(req.supplierId, req.params.productId, req.body), 'Product updated'));

export const removeProduct = asyncHandler(async (req, res) =>
  ok(res, await supplierService.removeProduct(req.supplierId, req.params.productId), 'Product removed'));
