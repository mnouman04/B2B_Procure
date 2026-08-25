import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { analyticsService } from '../services/analytics.service.js';

export const buyerDashboard = asyncHandler(async (req, res) =>
  ok(res, await analyticsService.buyerDashboard(req.companyId)));

export const supplierDashboard = asyncHandler(async (req, res) =>
  ok(res, await analyticsService.supplierDashboard(req.supplierId)));

export const procurement = asyncHandler(async (req, res) =>
  ok(res, await analyticsService.procurementAnalytics(req.companyId, {
    months: Number(req.query.months) || 12,
  })));

export const adminDashboard = asyncHandler(async (_req, res) =>
  ok(res, await analyticsService.adminDashboard()));

export const platformStats = asyncHandler(async (_req, res) =>
  ok(res, await analyticsService.platformStats()));
