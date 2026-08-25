import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { orderService } from '../services/order.service.js';

const ctx = (req) => ({ user: req.user, companyId: req.companyId, supplierId: req.supplierId });

export const issue = asyncHandler(async (req, res) =>
  created(res, await orderService.awardAndIssuePo(req.body, ctx(req)), 'Purchase order issued'));

export const list = asyncHandler(async (req, res) =>
  paginated(res, await orderService.list(req.query, ctx(req))));

export const getOne = asyncHandler(async (req, res) =>
  ok(res, await orderService.getById(req.params.id, ctx(req))));

export const updateStatus = asyncHandler(async (req, res) =>
  ok(res, await orderService.updateStatus(req.params.id, req.body, ctx(req)), 'Order status updated'));

export const cancel = asyncHandler(async (req, res) =>
  ok(res, await orderService.cancel(req.params.id, req.body, ctx(req)), 'Order cancelled'));

export const review = asyncHandler(async (req, res) =>
  created(res, await orderService.review(req.params.id, req.body, ctx(req)), 'Thanks for rating this supplier'));
