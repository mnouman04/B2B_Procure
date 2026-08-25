import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { adminService } from '../services/admin.service.js';

export const companies = asyncHandler(async (req, res) =>
  paginated(res, await adminService.listCompanies(req.query)));

export const suppliers = asyncHandler(async (req, res) =>
  paginated(res, await adminService.listSuppliers(req.query)));

export const verificationQueue = asyncHandler(async (req, res) =>
  paginated(res, await adminService.verificationQueue(req.query)));

export const users = asyncHandler(async (req, res) =>
  paginated(res, await adminService.listUsers(req.query)));

export const rfqs = asyncHandler(async (req, res) =>
  paginated(res, await adminService.listRfqs(req.query)));

export const commissions = asyncHandler(async (req, res) => {
  const result = await adminService.commissions(req.query);
  return paginated(res, result, 'OK');
});

export const commissionTotals = asyncHandler(async (req, res) => {
  const result = await adminService.commissions({ ...req.query, limit: 1 });
  return ok(res, result.totals);
});

export const setUserActive = asyncHandler(async (req, res) =>
  ok(res, await adminService.setUserActive(req.params.id, req.body.isActive), 'User updated'));

export const setCompanyStatus = asyncHandler(async (req, res) =>
  ok(res, await adminService.setCompanyStatus(req.params.id, req.body.status), 'Company updated'));

export const createCategory = asyncHandler(async (req, res) =>
  created(res, await adminService.createCategory(req.body), 'Category created'));

export const updateCategory = asyncHandler(async (req, res) =>
  ok(res, await adminService.updateCategory(req.params.id, req.body), 'Category updated'));

export const removeCategory = asyncHandler(async (req, res) =>
  ok(res, await adminService.removeCategory(req.params.id), 'Category removed'));
