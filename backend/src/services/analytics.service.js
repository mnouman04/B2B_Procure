import mongoose from 'mongoose';
import {
  rfqRepository, quotationRepository, purchaseOrderRepository,
  supplierRepository, companyRepository, notificationRepository,
  userRepository, categoryRepository,
} from '../repositories/index.js';
import { RFQ_STATUS, QUOTATION_STATUS, PO_STATUS, VERIFICATION_STATUS } from '../config/constants.js';

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const startOfYear = () => new Date(new Date().getFullYear(), 0, 1);
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Buyer Dashboard, Supplier Dashboard, Procurement Analytics and the
 * Admin Dashboard all read through this one service.
 */
class AnalyticsService {
  // ── Buyer ─────────────────────────────────────────────────────
  async buyerDashboard(companyId) {
    const company = oid(companyId);

    const [activeRfqs, quotesReceived, pendingOrders, spendAgg, recentRfqs, topSuppliers, savingsAgg] =
      await Promise.all([
        rfqRepository.count({ company, status: { $in: [RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED] } }),
        quotationRepository.aggregate([
          { $lookup: { from: 'rfqs', localField: 'rfq', foreignField: '_id', as: 'r' } },
          { $unwind: '$r' },
          { $match: { 'r.company': company, status: { $ne: QUOTATION_STATUS.DRAFT } } },
          { $count: 'total' },
        ]),
        purchaseOrderRepository.count({
          company,
          status: { $in: [PO_STATUS.ISSUED, PO_STATUS.APPROVED, PO_STATUS.PROCESSING, PO_STATUS.SHIPPED] },
        }),
        purchaseOrderRepository.aggregate([
          { $match: { company, createdAt: { $gte: startOfYear() }, status: { $ne: PO_STATUS.CANCELLED } } },
          { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
        ]),
        rfqRepository.find(
          { company },
          {
            limit: 5, sort: '-createdAt', lean: true,
            populate: [{ path: 'category', select: 'name nameAr' }],
            select: 'rfqNumber title status quotesCount createdAt requiredDeliveryDate category',
          },
        ),
        purchaseOrderRepository.aggregate([
          { $match: { company, status: { $ne: PO_STATUS.CANCELLED } } },
          { $group: { _id: '$supplier', spend: { $sum: '$total' }, orders: { $sum: 1 } } },
          { $sort: { spend: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 's' } },
          { $unwind: '$s' },
          { $project: { _id: 1, spend: 1, orders: 1, name: '$s.name', nameAr: '$s.nameAr', logo: '$s.logo', rating: '$s.rating.average' } },
        ]),
        companyRepository.findById(company, { lean: true, select: 'stats name' }),
      ]);

    const spendByCategory = await purchaseOrderRepository.aggregate([
      { $match: { company, status: { $ne: PO_STATUS.CANCELLED } } },
      { $lookup: { from: 'rfqs', localField: 'rfq', foreignField: '_id', as: 'r' } },
      { $unwind: '$r' },
      { $group: { _id: '$r.category', total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $project: { _id: 1, total: 1, name: '$c.name', nameAr: '$c.nameAr' } },
    ]);

    const totalSpend = spendAgg[0]?.total ?? 0;
    const savings = savingsAgg?.stats?.savings ?? 0;

    return {
      stats: {
        activeRfqs,
        quotesReceived: quotesReceived[0]?.total ?? 0,
        pendingOrders,
        totalSpend,
        totalSavings: savings,
        savingsPercent: totalSpend ? Math.round((savings / (totalSpend + savings)) * 100) : 0,
      },
      recentRfqs,
      topSuppliers,
      spendByCategory: this.#withShare(spendByCategory, 'total'),
      spendTotal: spendByCategory.reduce((s, c) => s + c.total, 0),
    };
  }

  // ── Supplier ──────────────────────────────────────────────────
  async supplierDashboard(supplierId) {
    const supplier = oid(supplierId);
    const supplierDoc = await supplierRepository.findById(supplier, { lean: true });

    const [newRfqs, myQuotes, activeOrders, salesAgg, recentRfqs, quotesByStatus] = await Promise.all([
      rfqRepository.count({
        'invitedSuppliers.supplier': supplier,
        status: { $in: [RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED] },
      }),
      quotationRepository.count({ supplier, status: { $ne: QUOTATION_STATUS.DRAFT } }),
      purchaseOrderRepository.count({
        supplier,
        status: { $in: [PO_STATUS.ISSUED, PO_STATUS.APPROVED, PO_STATUS.PROCESSING, PO_STATUS.SHIPPED] },
      }),
      purchaseOrderRepository.aggregate([
        { $match: { supplier, createdAt: { $gte: monthsAgo(0) }, status: { $ne: PO_STATUS.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      rfqRepository.find(
        {
          'invitedSuppliers.supplier': supplier,
          status: { $in: [RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED] },
        },
        {
          limit: 5, sort: '-publishedAt', lean: true,
          select: 'rfqNumber title publishedAt requiredDeliveryDate deliveryLocation quotesCount',
        },
      ),
      quotationRepository.aggregate([
        { $match: { supplier, status: { $ne: QUOTATION_STATUS.DRAFT } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(quotesByStatus.map((r) => [r._id, r.count]));

    return {
      stats: {
        newRfqs,
        quotesSubmitted: myQuotes,
        activeOrders,
        monthlySales: salesAgg[0]?.total ?? 0,
        rating: supplierDoc?.rating?.average ?? 0,
        winRate: supplierDoc?.stats?.quotesSubmitted
          ? Math.round((supplierDoc.stats.quotesWon / supplierDoc.stats.quotesSubmitted) * 100)
          : 0,
      },
      recentRfqs,
      quotePerformance: [
        { key: 'submitted', label: 'Under review', count: statusMap[QUOTATION_STATUS.SUBMITTED] ?? 0 },
        { key: 'accepted', label: 'Accepted', count: statusMap[QUOTATION_STATUS.ACCEPTED] ?? 0 },
        { key: 'rejected', label: 'Rejected', count: statusMap[QUOTATION_STATUS.REJECTED] ?? 0 },
        { key: 'shortlisted', label: 'Shortlisted', count: statusMap[QUOTATION_STATUS.SHORTLISTED] ?? 0 },
      ],
      verification: {
        status: supplierDoc?.status,
        verified: supplierDoc?.verified,
        documents: (supplierDoc?.documents || []).length,
      },
    };
  }

  // ── Procurement Analytics ─────────────────────────────────────
  async procurementAnalytics(companyId, { months = 12 } = {}) {
    const company = oid(companyId);
    const since = monthsAgo(months - 1);

    const [monthlySpend, byCategory, bySupplier, cycle, company_] = await Promise.all([
      purchaseOrderRepository.aggregate([
        { $match: { company, createdAt: { $gte: since }, status: { $ne: PO_STATUS.CANCELLED } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            spend: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      purchaseOrderRepository.aggregate([
        { $match: { company, status: { $ne: PO_STATUS.CANCELLED } } },
        { $lookup: { from: 'rfqs', localField: 'rfq', foreignField: '_id', as: 'r' } },
        { $unwind: '$r' },
        { $group: { _id: '$r.category', spend: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'c' } },
        { $unwind: '$c' },
        { $project: { spend: 1, orders: 1, name: '$c.name', nameAr: '$c.nameAr' } },
        { $sort: { spend: -1 } },
      ]),
      purchaseOrderRepository.aggregate([
        { $match: { company, status: { $ne: PO_STATUS.CANCELLED } } },
        {
          $group: {
            _id: '$supplier',
            spend: { $sum: '$total' },
            orders: { $sum: 1 },
            avgOrder: { $avg: '$total' },
          },
        },
        { $sort: { spend: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 's' } },
        { $unwind: '$s' },
        {
          $project: {
            spend: 1, orders: 1, avgOrder: 1,
            name: '$s.name', nameAr: '$s.nameAr', logo: '$s.logo',
            rating: '$s.rating.average', onTime: '$s.onTimeDeliveryRate',
          },
        },
      ]),
      rfqRepository.aggregate([
        { $match: { company, status: RFQ_STATUS.AWARDED, publishedAt: { $ne: null } } },
        { $project: { days: { $divide: [{ $subtract: ['$closedAt', '$publishedAt'] }, 86400000] } } },
        { $group: { _id: null, avgDays: { $avg: '$days' }, count: { $sum: 1 } } },
      ]),
      companyRepository.findById(company, { lean: true, select: 'stats' }),
    ]);

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalSpend = byCategory.reduce((s, c) => s + c.spend, 0);
    const savings = company_?.stats?.savings ?? 0;

    return {
      summary: {
        totalSpend,
        totalOrders: byCategory.reduce((s, c) => s + c.orders, 0),
        savings,
        savingsPercent: totalSpend ? Math.round((savings / (totalSpend + savings)) * 100) : 0,
        avgSourcingCycleDays: Math.max(0, Math.round(cycle[0]?.avgDays ?? 0)),
        suppliersEngaged: bySupplier.length,
      },
      monthlySpend: monthlySpend.map((m) => ({
        label: `${labels[m._id.m - 1]} ${String(m._id.y).slice(2)}`,
        spend: +m.spend.toFixed(2),
        orders: m.orders,
      })),
      byCategory: this.#withShare(byCategory, 'spend'),
      bySupplier,
    };
  }

  // ── Admin ─────────────────────────────────────────────────────
  async adminDashboard() {
    const [companies, suppliers, pendingSuppliers, rfqs, quotes, orders, gmvAgg, recentSuppliers, users] =
      await Promise.all([
        companyRepository.count({}),
        supplierRepository.count({ status: VERIFICATION_STATUS.VERIFIED }),
        supplierRepository.count({
          status: { $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.UNDER_REVIEW] },
        }),
        rfqRepository.count({}),
        quotationRepository.count({ status: { $ne: QUOTATION_STATUS.DRAFT } }),
        purchaseOrderRepository.count({}),
        purchaseOrderRepository.aggregate([
          { $match: { status: { $ne: PO_STATUS.CANCELLED } } },
          { $group: { _id: null, gmv: { $sum: '$total' }, commission: { $sum: '$commission' } } },
        ]),
        supplierRepository.find(
          { status: { $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.UNDER_REVIEW] } },
          { limit: 8, sort: '-createdAt', lean: true, select: 'name nameAr logo status location createdAt documents' },
        ),
        userRepository.count({}),
      ]);

    const rfqByStatus = await rfqRepository.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const topCategories = await rfqRepository.aggregate([
      { $group: { _id: '$category', rfqs: { $sum: 1 } } },
      { $sort: { rfqs: -1 } },
      { $limit: 6 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $project: { rfqs: 1, name: '$c.name', nameAr: '$c.nameAr' } },
    ]);

    return {
      stats: {
        companies, suppliers, pendingSuppliers, rfqs, quotes, orders, users,
        gmv: gmvAgg[0]?.gmv ?? 0,
        commission: gmvAgg[0]?.commission ?? 0,
      },
      rfqByStatus: rfqByStatus.map((r) => ({ status: r._id, count: r.count })),
      pendingVerifications: recentSuppliers.map((s) => ({
        ...s,
        documentCount: (s.documents || []).length,
        documents: undefined,
      })),
      topCategories,
    };
  }

  /** Home page hero counters. */
  async platformStats() {
    const [suppliers, companies, completedRfqs, savingsAgg] = await Promise.all([
      supplierRepository.count({ status: VERIFICATION_STATUS.VERIFIED, isActive: true }),
      companyRepository.count({}),
      rfqRepository.count({ status: { $in: [RFQ_STATUS.AWARDED, RFQ_STATUS.CLOSED] } }),
      companyRepository.aggregate([
        { $group: { _id: null, savings: { $sum: '$stats.savings' }, spend: { $sum: '$stats.totalSpend' } } },
      ]),
    ]);

    const { savings = 0, spend = 0 } = savingsAgg[0] || {};
    return {
      verifiedSuppliers: suppliers,
      companiesServed: companies,
      rfqsCompleted: completedRfqs,
      averageSavings: spend ? Math.round((savings / (spend + savings)) * 100) : 18,
    };
  }

  #withShare(rows, field) {
    const total = rows.reduce((s, r) => s + (r[field] || 0), 0) || 1;
    return rows.map((r) => ({ ...r, share: Math.round(((r[field] || 0) / total) * 100) }));
  }
}

export const analyticsService = new AnalyticsService();
