import { ApiError } from '../utils/ApiError.js';
import { nextSequence } from '../utils/sequence.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { coordsForCity } from '../utils/geo.js';
import { rfqRepository, quotationRepository, categoryRepository } from '../repositories/index.js';
import { RFQ_STATUS, QUOTATION_STATUS, ROLES } from '../config/constants.js';
import { matchingService } from './matching.service.js';
import { QuotationScorer } from '../strategies/QuotationScorer.js';
import { eventBus, DomainEvents } from '../events/EventBus.js';

const POPULATE = [
  { path: 'category', select: 'name nameAr slug icon' },
  { path: 'subCategory', select: 'name nameAr slug' },
  { path: 'buyer', select: 'firstName lastName email jobTitle avatar' },
  { path: 'company', select: 'name nameAr logo sector address' },
];

class RfqService {
  async create(dto, { user, companyId }) {
    const category = await categoryRepository.findById(dto.category);
    if (!category) throw ApiError.badRequest('Unknown category');

    const coords = coordsForCity(dto.deliveryLocation.city) || {};
    const rfqNumber = await nextSequence('RFQ');

    const estimatedValue = dto.items.reduce(
      (sum, i) => sum + (i.targetPrice || 0) * (i.quantity || 0),
      0,
    );

    const rfq = await rfqRepository.create({
      ...dto,
      rfqNumber,
      buyer: user._id,
      company: companyId,
      deliveryLocation: {
        ...dto.deliveryLocation,
        lat: dto.deliveryLocation.lat ?? coords.lat ?? null,
        lng: dto.deliveryLocation.lng ?? coords.lng ?? null,
      },
      estimatedValue,
      publishedAt: dto.status === RFQ_STATUS.PUBLISHED ? new Date() : null,
    });

    if (dto.status === RFQ_STATUS.PUBLISHED) {
      return this.publish(rfq._id, {}, { user, companyId });
    }
    return this.getById(rfq._id, { user, companyId });
  }

  async update(id, dto, { user, companyId }) {
    const rfq = await this.#loadOwned(id, { user, companyId });
    if (![RFQ_STATUS.DRAFT, RFQ_STATUS.PUBLISHED].includes(rfq.status)) {
      throw ApiError.badRequest(`An RFQ that is "${rfq.status}" can no longer be edited`);
    }
    if (rfq.status === RFQ_STATUS.PUBLISHED && rfq.quotesCount > 0) {
      throw ApiError.badRequest('Suppliers have already quoted — create a revision instead of editing');
    }
    Object.assign(rfq, dto);
    await rfq.save();
    return this.getById(id, { user, companyId });
  }

  /**
   * Publishes the RFQ and invites suppliers: either the explicit list the buyer
   * picked on the Supplier Matching screen, or the top auto-matched suppliers.
   */
  async publish(id, { supplierIds = [], strategy, autoInviteLimit = 12, quotationDeadline } = {}, ctx) {
    const rfq = await this.#loadOwned(id, ctx);
    if (rfq.status === RFQ_STATUS.AWARDED || rfq.status === RFQ_STATUS.CLOSED) {
      throw ApiError.badRequest('This RFQ is already closed');
    }

    let invited;
    if (supplierIds.length) {
      const { matches } = await matchingService.findMatches(rfq, { strategy, limit: 100 });
      const byId = new Map(matches.map((m) => [String(m.supplier._id), m]));
      invited = supplierIds.map((sid) => ({
        supplier: sid,
        matchScore: byId.get(String(sid))?.matchScore ?? 0,
        distanceKm: byId.get(String(sid))?.distanceKm ?? null,
        invitedAt: new Date(),
      }));
    } else {
      invited = await matchingService.autoInvite(rfq, { limit: autoInviteLimit, strategy });
    }

    if (!invited.length) {
      throw ApiError.badRequest('No verified suppliers match this RFQ yet. Try widening the category or location.');
    }

    rfq.invitedSuppliers = invited;
    rfq.status = RFQ_STATUS.PUBLISHED;
    rfq.publishedAt = rfq.publishedAt || new Date();
    if (quotationDeadline) rfq.quotationDeadline = quotationDeadline;
    await rfq.save();

    eventBus.publish(DomainEvents.RFQ_PUBLISHED, { rfq, invited });
    return this.getById(id, ctx);
  }

  async list(query, { user, companyId, supplierId }) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query.sort);
    const filter = {};

    if (user.role === ROLES.BUYER) filter.company = companyId;
    if (user.role === ROLES.SUPPLIER) {
      Object.assign(filter, rfqRepository.openForSupplier(supplierId));
    }
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.category) filter.category = query.category;
    if (query.city) filter['deliveryLocation.city'] = query.city;
    if (query.q) filter.title = { $regex: query.q, $options: 'i' };

    return rfqRepository.paginate(filter, { page, limit, skip, sort, populate: POPULATE, lean: true });
  }

  async getById(id, { user, companyId, supplierId } = {}) {
    const rfq = await rfqRepository.findById(id, { populate: POPULATE });
    if (!rfq) throw ApiError.notFound('RFQ');
    this.#assertVisible(rfq, { user, companyId, supplierId });
    return rfq;
  }

  /** Supplier Matching screen. */
  async matches(id, options, ctx) {
    const rfq = await this.#loadOwned(id, ctx);
    return matchingService.findMatches(rfq, options);
  }

  /** Compare Quotations screen — scored and badged. */
  async comparison(id, ctx) {
    const rfq = await this.getById(id, ctx);
    const quotations = await quotationRepository.findForRfq(rfq._id, { onlySubmitted: true });
    const scored = QuotationScorer.score(quotations);

    return {
      rfq,
      quotations: scored,
      summary: {
        count: scored.length,
        lowestPrice: scored.length ? Math.min(...scored.map((q) => q.totalPrice)) : 0,
        highestPrice: scored.length ? Math.max(...scored.map((q) => q.totalPrice)) : 0,
        fastestDelivery: scored.length ? Math.min(...scored.map((q) => q.deliveryDays)) : 0,
        potentialSavings: scored.length
          ? +(Math.max(...scored.map((q) => q.totalPrice)) - Math.min(...scored.map((q) => q.totalPrice))).toFixed(2)
          : 0,
      },
    };
  }

  async close(id, ctx) {
    const rfq = await this.#loadOwned(id, ctx);
    rfq.status = RFQ_STATUS.CLOSED;
    rfq.closedAt = new Date();
    await rfq.save();
    await quotationRepository.updateMany(
      { rfq: rfq._id, status: QUOTATION_STATUS.SUBMITTED },
      { status: QUOTATION_STATUS.REJECTED, rejectionReason: 'RFQ closed by the buyer' },
    );
    eventBus.publish(DomainEvents.RFQ_CLOSED, { rfq });
    return rfq;
  }

  async remove(id, ctx) {
    const rfq = await this.#loadOwned(id, ctx);
    if (rfq.status !== RFQ_STATUS.DRAFT) {
      throw ApiError.badRequest('Only draft RFQs can be deleted — close it instead');
    }
    await rfqRepository.deleteById(id);
    return { deleted: true };
  }

  /** Marks the invitation as seen so buyers can tell who opened the RFQ. */
  async markViewed(id, supplierId) {
    return rfqRepository.updateOne(
      { _id: id, 'invitedSuppliers.supplier': supplierId, 'invitedSuppliers.viewedAt': null },
      { $set: { 'invitedSuppliers.$.viewedAt': new Date() } },
    );
  }

  async #loadOwned(id, { user, companyId } = {}) {
    const rfq = await rfqRepository.findById(id);
    if (!rfq) throw ApiError.notFound('RFQ');
    if (user?.role === ROLES.ADMIN) return rfq;
    if (String(rfq.company) !== String(companyId)) {
      throw ApiError.forbidden('This RFQ belongs to another company');
    }
    return rfq;
  }

  #assertVisible(rfq, { user, companyId, supplierId }) {
    if (!user || user.role === ROLES.ADMIN) return;
    if (user.role === ROLES.BUYER) {
      if (String(rfq.company?._id ?? rfq.company) !== String(companyId)) {
        throw ApiError.forbidden('This RFQ belongs to another company');
      }
      return;
    }
    const invited = (rfq.invitedSuppliers || []).some(
      (i) => String(i.supplier) === String(supplierId),
    );
    if (!invited && rfq.visibility !== 'public') {
      throw ApiError.forbidden('You were not invited to this RFQ');
    }
  }
}

export const rfqService = new RfqService();
