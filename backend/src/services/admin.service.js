import { ApiError } from '../utils/ApiError.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import {
  companyRepository, supplierRepository, userRepository,
  rfqRepository, purchaseOrderRepository, categoryRepository,
} from '../repositories/index.js';
import { VERIFICATION_STATUS, PO_STATUS } from '../config/constants.js';

/** Admin Dashboard — companies, suppliers, requests, commissions and reports. */
class AdminService {
  listCompanies(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.q) filter.name = { $regex: query.q, $options: 'i' };
    return companyRepository.paginate(filter, {
      page, limit, skip, sort: parseSort(query.sort), lean: true,
      populate: [{ path: 'owner', select: 'firstName lastName email' }],
    });
  }

  listSuppliers(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.q) filter.name = { $regex: query.q, $options: 'i' };
    return supplierRepository.paginate(filter, {
      page, limit, skip, sort: parseSort(query.sort), lean: true,
      populate: [{ path: 'primaryCategory', select: 'name nameAr' }],
    });
  }

  /** Vendor Verification queue with full document detail. */
  async verificationQueue(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    return supplierRepository.paginate(
      { status: { $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.UNDER_REVIEW] } },
      {
        page, limit, skip, sort: 'createdAt', lean: true,
        populate: [
          { path: 'primaryCategory', select: 'name nameAr' },
          { path: 'owner', select: 'firstName lastName email phone' },
        ],
      },
    );
  }

  listUsers(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.q) {
      filter.$or = [
        { firstName: { $regex: query.q, $options: 'i' } },
        { lastName: { $regex: query.q, $options: 'i' } },
        { email: { $regex: query.q, $options: 'i' } },
      ];
    }
    return userRepository.paginate(filter, {
      page, limit, skip, sort: parseSort(query.sort), lean: true,
      populate: [
        { path: 'company', select: 'name' },
        { path: 'supplier', select: 'name' },
      ],
    });
  }

  async setUserActive(userId, isActive) {
    const user = await userRepository.updateById(userId, { isActive });
    if (!user) throw ApiError.notFound('User');
    return user;
  }

  async setCompanyStatus(companyId, status) {
    const company = await companyRepository.updateById(companyId, {
      status,
      verified: status === VERIFICATION_STATUS.VERIFIED,
    });
    if (!company) throw ApiError.notFound('Company');
    return company;
  }

  listRfqs(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.q) filter.$or = [
      { rfqNumber: { $regex: query.q, $options: 'i' } },
      { title: { $regex: query.q, $options: 'i' } },
    ];
    return rfqRepository.paginate(filter, {
      page, limit, skip, sort: parseSort(query.sort), lean: true,
      populate: [
        { path: 'company', select: 'name nameAr logo' },
        { path: 'category', select: 'name nameAr' },
      ],
    });
  }

  /** Commission report per completed order. */
  async commissions(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = { status: { $ne: PO_STATUS.CANCELLED } };
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const [result, totals] = await Promise.all([
      purchaseOrderRepository.paginate(filter, {
        page, limit, skip, sort: '-createdAt', lean: true,
        select: 'poNumber total commission currency status createdAt company supplier',
        populate: [
          { path: 'company', select: 'name nameAr' },
          { path: 'supplier', select: 'name nameAr' },
        ],
      }),
      purchaseOrderRepository.aggregate([
        { $match: filter },
        { $group: { _id: null, gmv: { $sum: '$total' }, commission: { $sum: '$commission' }, orders: { $sum: 1 } } },
      ]),
    ]);

    return { ...result, totals: totals[0] || { gmv: 0, commission: 0, orders: 0 } };
  }

  // ── Category management ──────────────────────────────────────
  createCategory(dto) {
    return categoryRepository.create(dto);
  }

  async updateCategory(id, dto) {
    const category = await categoryRepository.updateById(id, dto);
    if (!category) throw ApiError.notFound('Category');
    return category;
  }

  async removeCategory(id) {
    const inUse = await supplierRepository.count({ categories: id });
    if (inUse) throw ApiError.badRequest(`${inUse} supplier(s) still use this category`);
    const deleted = await categoryRepository.deleteById(id);
    if (!deleted) throw ApiError.notFound('Category');
    return { deleted: true };
  }
}

export const adminService = new AdminService();
