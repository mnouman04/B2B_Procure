import { ApiError } from '../utils/ApiError.js';
import { nextSequence } from '../utils/sequence.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { env } from '../config/env.js';
import {
  quotationRepository, rfqRepository, supplierRepository,
} from '../repositories/index.js';
import { QUOTATION_STATUS, RFQ_STATUS, ROLES } from '../config/constants.js';
import { QuotationScorer } from '../strategies/QuotationScorer.js';
import { eventBus, DomainEvents } from '../events/EventBus.js';

const POPULATE = [
  { path: 'supplier', select: 'name nameAr slug logo rating location verified onTimeDeliveryRate' },
  { path: 'rfq', select: 'rfqNumber title status requiredDeliveryDate deliveryLocation company buyer items' },
];

class QuotationService {
  /** Submit Quotation screen. */
  async create(dto, { user, supplierId }) {
    const rfq = await rfqRepository.findById(dto.rfq);
    if (!rfq) throw ApiError.notFound('RFQ');
    if (![RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED].includes(rfq.status)) {
      throw ApiError.badRequest('This RFQ is no longer accepting quotations');
    }

    const invited = rfq.invitedSuppliers.some((i) => String(i.supplier) === String(supplierId));
    if (!invited && rfq.visibility !== 'public') {
      throw ApiError.forbidden('You were not invited to quote on this RFQ');
    }

    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier?.verified) {
      throw ApiError.forbidden('Your company must be verified before submitting quotations');
    }

    const existing = await quotationRepository.findBySupplierAndRfq(supplierId, rfq._id);
    if (existing && existing.status !== QUOTATION_STATUS.DRAFT) {
      throw ApiError.conflict('You have already submitted a quotation for this RFQ — revise it instead');
    }

    this.#assertItemsMatchRfq(dto.items, rfq);

    const doc = existing || new quotationRepository.model({
      quoteNumber: await nextSequence('QT'),
      rfq: rfq._id,
      supplier: supplierId,
    });

    Object.assign(doc, {
      submittedBy: user._id,
      items: dto.items,
      deliveryDays: dto.deliveryDays,
      warrantyYears: dto.warrantyYears,
      paymentTerms: dto.paymentTerms,
      validUntil: dto.validUntil ?? null,
      incoterms: dto.incoterms,
      discount: dto.discount,
      terms: dto.terms,
      notes: dto.notes,
      attachments: dto.attachments,
      vatRate: env.vatRate,
      currency: rfq.currency || env.currency,
      status: dto.status,
    });

    if (dto.status === QUOTATION_STATUS.SUBMITTED) doc.submittedAt = new Date();
    await doc.save();

    if (dto.status === QUOTATION_STATUS.SUBMITTED) {
      await this.#afterSubmit(doc, rfq, supplier);
    }

    return this.getById(doc._id, { user, supplierId });
  }

  async update(id, dto, { user, supplierId }) {
    const quote = await this.#loadOwned(id, supplierId);
    if (quote.status !== QUOTATION_STATUS.DRAFT) {
      throw ApiError.badRequest('Only draft quotations can be edited — submit a revision instead');
    }
    const rfq = await rfqRepository.findById(quote.rfq);
    if (dto.items) this.#assertItemsMatchRfq(dto.items, rfq);

    Object.assign(quote, dto);
    if (dto.status === QUOTATION_STATUS.SUBMITTED) quote.submittedAt = new Date();
    await quote.save();

    if (dto.status === QUOTATION_STATUS.SUBMITTED) {
      const supplier = await supplierRepository.findById(supplierId);
      await this.#afterSubmit(quote, rfq, supplier);
    }
    return this.getById(id, { user, supplierId });
  }

  /** e-negotiation: a supplier improves a live offer and the trail is kept. */
  async revise(id, dto, { user, supplierId }) {
    const quote = await this.#loadOwned(id, supplierId);
    if (![QUOTATION_STATUS.SUBMITTED, QUOTATION_STATUS.SHORTLISTED].includes(quote.status)) {
      throw ApiError.badRequest('Only a live quotation can be revised');
    }

    quote.revisions.push({
      totalPrice: quote.totalPrice,
      deliveryDays: quote.deliveryDays,
      note: dto.note,
      by: user._id,
      at: new Date(),
    });
    if (dto.items) quote.items = dto.items;
    if (dto.deliveryDays != null) quote.deliveryDays = dto.deliveryDays;
    if (dto.discount != null) quote.discount = dto.discount;
    await quote.save();

    await this.#rescore(quote.rfq);
    return this.getById(id, { user, supplierId });
  }

  async withdraw(id, { supplierId }) {
    const quote = await this.#loadOwned(id, supplierId);
    if (quote.status === QUOTATION_STATUS.ACCEPTED) {
      throw ApiError.badRequest('An accepted quotation cannot be withdrawn');
    }
    quote.status = QUOTATION_STATUS.WITHDRAWN;
    await quote.save();
    await rfqRepository.incrementQuotes(quote.rfq, -1);
    await this.#rescore(quote.rfq);
    return quote;
  }

  async shortlist(id, ctx) {
    const quote = await this.#loadForBuyer(id, ctx);
    quote.status = QUOTATION_STATUS.SHORTLISTED;
    await quote.save();
    return quote;
  }

  async reject(id, { reason }, ctx) {
    const quote = await this.#loadForBuyer(id, ctx);
    if (quote.status === QUOTATION_STATUS.ACCEPTED) {
      throw ApiError.badRequest('This quotation has already been accepted');
    }
    quote.status = QUOTATION_STATUS.REJECTED;
    quote.rejectionReason = reason;
    quote.decidedAt = new Date();
    await quote.save();
    eventBus.publish(DomainEvents.QUOTATION_REJECTED, { quotation: quote, reason });
    return quote;
  }

  async list(query, { user, companyId, supplierId }) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query.sort, '-submittedAt');
    const filter = {};

    if (user.role === ROLES.SUPPLIER) filter.supplier = supplierId;
    if (user.role === ROLES.BUYER) {
      const rfqIds = await rfqRepository.distinct('_id', { company: companyId });
      filter.rfq = { $in: rfqIds };
      filter.status = { $ne: QUOTATION_STATUS.DRAFT };
    }
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.rfq) filter.rfq = query.rfq;

    return quotationRepository.paginate(filter, { page, limit, skip, sort, populate: POPULATE, lean: true });
  }

  async getById(id, { user, companyId, supplierId } = {}) {
    const quote = await quotationRepository.findById(id, { populate: POPULATE });
    if (!quote) throw ApiError.notFound('Quotation');
    if (user?.role === ROLES.SUPPLIER && String(quote.supplier?._id ?? quote.supplier) !== String(supplierId)) {
      throw ApiError.forbidden('This quotation belongs to another supplier');
    }
    if (user?.role === ROLES.BUYER) {
      const rfq = await rfqRepository.findById(quote.rfq?._id ?? quote.rfq);
      if (String(rfq?.company) !== String(companyId)) {
        throw ApiError.forbidden('This quotation belongs to another company');
      }
    }
    return quote;
  }

  async #afterSubmit(quote, rfq, supplier) {
    await rfqRepository.updateById(rfq._id, {
      $inc: { quotesCount: 1 },
      $set: { status: RFQ_STATUS.QUOTED },
    });
    await supplierRepository.updateById(supplier._id, { $inc: { 'stats.quotesSubmitted': 1 } });
    await this.#rescore(rfq._id);
    eventBus.publish(DomainEvents.QUOTATION_SUBMITTED, { quotation: quote, rfq, supplier });
  }

  /** Recomputes every quote's relative score whenever the peer set changes. */
  async #rescore(rfqId) {
    const quotes = await quotationRepository.findForRfq(rfqId, { onlySubmitted: true });
    const scored = QuotationScorer.score(quotes);
    await Promise.all(
      scored.map((q) =>
        quotationRepository.updateById(q._id, {
          matchScore: q.matchScore,
          scoreBreakdown: q.scoreBreakdown,
        }),
      ),
    );
    return scored;
  }

  #assertItemsMatchRfq(items, rfq) {
    const valid = new Set((rfq.items || []).map((i) => String(i._id)));
    const unknown = items.find((i) => !valid.has(String(i.rfqItemId)));
    if (unknown) throw ApiError.badRequest(`"${unknown.name}" does not correspond to an item on this RFQ`);
  }

  async #loadOwned(id, supplierId) {
    const quote = await quotationRepository.findById(id);
    if (!quote) throw ApiError.notFound('Quotation');
    if (String(quote.supplier) !== String(supplierId)) {
      throw ApiError.forbidden('This quotation belongs to another supplier');
    }
    return quote;
  }

  async #loadForBuyer(id, { user, companyId }) {
    const quote = await quotationRepository.findById(id);
    if (!quote) throw ApiError.notFound('Quotation');
    if (user.role === ROLES.ADMIN) return quote;
    const rfq = await rfqRepository.findById(quote.rfq);
    if (String(rfq?.company) !== String(companyId)) {
      throw ApiError.forbidden('This quotation belongs to another company');
    }
    return quote;
  }
}

export const quotationService = new QuotationService();
