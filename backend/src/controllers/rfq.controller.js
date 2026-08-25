import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { rfqService } from '../services/rfq.service.js';
import { matchingService } from '../services/matching.service.js';
import { ROLES } from '../config/constants.js';

const ctx = (req) => ({ user: req.user, companyId: req.companyId, supplierId: req.supplierId });

export const create = asyncHandler(async (req, res) =>
  created(res, await rfqService.create(req.body, ctx(req)), 'RFQ created'));

export const update = asyncHandler(async (req, res) =>
  ok(res, await rfqService.update(req.params.id, req.body, ctx(req)), 'RFQ updated'));

export const publish = asyncHandler(async (req, res) =>
  ok(res, await rfqService.publish(req.params.id, req.body, ctx(req)), 'RFQ published to matched suppliers'));

export const list = asyncHandler(async (req, res) =>
  paginated(res, await rfqService.list(req.query, ctx(req))));

export const getOne = asyncHandler(async (req, res) => {
  const rfq = await rfqService.getById(req.params.id, ctx(req));
  if (req.user.role === ROLES.SUPPLIER) await rfqService.markViewed(rfq._id, req.supplierId);
  return ok(res, rfq);
});

export const matches = asyncHandler(async (req, res) =>
  ok(res, await rfqService.matches(req.params.id, req.query, ctx(req))));

export const comparison = asyncHandler(async (req, res) =>
  ok(res, await rfqService.comparison(req.params.id, ctx(req))));

export const close = asyncHandler(async (req, res) =>
  ok(res, await rfqService.close(req.params.id, ctx(req)), 'RFQ closed'));

export const remove = asyncHandler(async (req, res) =>
  ok(res, await rfqService.remove(req.params.id, ctx(req)), 'RFQ deleted'));

export const strategies = asyncHandler(async (_req, res) =>
  ok(res, matchingService.availableStrategies()));
