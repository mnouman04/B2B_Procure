import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { quotationService } from '../services/quotation.service.js';

const ctx = (req) => ({ user: req.user, companyId: req.companyId, supplierId: req.supplierId });

export const create = asyncHandler(async (req, res) =>
  created(res, await quotationService.create(req.body, ctx(req)), 'Quotation saved'));

export const update = asyncHandler(async (req, res) =>
  ok(res, await quotationService.update(req.params.id, req.body, ctx(req)), 'Quotation updated'));

export const revise = asyncHandler(async (req, res) =>
  ok(res, await quotationService.revise(req.params.id, req.body, ctx(req)), 'Revised offer submitted'));

export const withdraw = asyncHandler(async (req, res) =>
  ok(res, await quotationService.withdraw(req.params.id, ctx(req)), 'Quotation withdrawn'));

export const shortlist = asyncHandler(async (req, res) =>
  ok(res, await quotationService.shortlist(req.params.id, ctx(req)), 'Quotation shortlisted'));

export const reject = asyncHandler(async (req, res) =>
  ok(res, await quotationService.reject(req.params.id, req.body, ctx(req)), 'Quotation rejected'));

export const list = asyncHandler(async (req, res) =>
  paginated(res, await quotationService.list(req.query, ctx(req))));

export const getOne = asyncHandler(async (req, res) =>
  ok(res, await quotationService.getById(req.params.id, ctx(req))));
