import { ApiError } from '../utils/ApiError.js';
import { nextSequence } from '../utils/sequence.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { env } from '../config/env.js';
import { runInTransaction, opts } from '../utils/transaction.js';
import {
  purchaseOrderRepository, quotationRepository, rfqRepository,
  supplierRepository, companyRepository, reviewRepository,
} from '../repositories/index.js';
import {
  PO_STATUS, PO_FLOW, QUOTATION_STATUS, RFQ_STATUS, ROLES,
} from '../config/constants.js';
import { QuotationScorer } from '../strategies/QuotationScorer.js';
import { eventBus, DomainEvents } from '../events/EventBus.js';

const POPULATE = [
  { path: 'supplier', select: 'name nameAr slug logo rating location contact verified' },
  { path: 'company', select: 'name nameAr logo address' },
  { path: 'buyer', select: 'firstName lastName email jobTitle' },
  { path: 'rfq', select: 'rfqNumber title category' },
  { path: 'quotation', select: 'quoteNumber totalPrice deliveryDays matchScore warrantyYears' },
];

/**
 * Purchase Orders + Orders & Delivery.
 *
 * Awarding a quotation is the single transition that closes the RFQ, rejects
 * every rival quote and issues the PO — kept in one place so the states can
 * never drift apart.
 */
class OrderService {
  async awardAndIssuePo({ quotationId, expectedDeliveryDate, paymentTerms, notes }, { user, companyId }) {
    const quotation = await quotationRepository.findById(quotationId, {
      populate: [{ path: 'supplier' }],
    });
    if (!quotation) throw ApiError.notFound('Quotation');
    if (quotation.status === QUOTATION_STATUS.ACCEPTED) {
      throw ApiError.conflict('This quotation has already been awarded');
    }

    const rfq = await rfqRepository.findById(quotation.rfq);
    if (!rfq) throw ApiError.notFound('RFQ');
    if (user.role !== ROLES.ADMIN && String(rfq.company) !== String(companyId)) {
      throw ApiError.forbidden('This RFQ belongs to another company');
    }
    if (rfq.status === RFQ_STATUS.AWARDED) throw ApiError.conflict('This RFQ has already been awarded');

    const rivals = await quotationRepository.findForRfq(rfq._id, { onlySubmitted: true });
    const savings = QuotationScorer.savingsAgainstHighest(rivals, quotation);

    const poNumber = await nextSequence('PO');
    const subtotal = quotation.subtotal;
    const vatAmount = quotation.vatAmount;
    const total = quotation.totalPrice;

    const po = await runInTransaction(async (session) => {
      const [created] = await purchaseOrderRepository.model.create(
        [{
          poNumber,
          rfq: rfq._id,
          quotation: quotation._id,
          buyer: rfq.buyer,
          company: rfq.company,
          supplier: quotation.supplier._id,
          items: quotation.items.map((i) => ({
            name: i.name,
            brand: i.brand,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          subtotal,
          vatRate: quotation.vatRate,
          vatAmount,
          total,
          currency: quotation.currency,
          commission: +(total * env.commissionRate).toFixed(2),
          paymentTerms: paymentTerms || quotation.paymentTerms,
          warrantyYears: quotation.warrantyYears,
          deliveryLocation: {
            city: rfq.deliveryLocation.city,
            region: rfq.deliveryLocation.region,
            country: rfq.deliveryLocation.country,
            address: rfq.deliveryLocation.address,
          },
          expectedDeliveryDate:
            expectedDeliveryDate ||
            new Date(Date.now() + quotation.deliveryDays * 86400000),
          status: PO_STATUS.ISSUED,
          timeline: [{ status: PO_STATUS.ISSUED, note: notes || 'Purchase order issued', by: user._id }],
        }],
        opts(session),
      );

      await quotationRepository.model.updateOne(
        { _id: quotation._id },
        { status: QUOTATION_STATUS.ACCEPTED, decidedAt: new Date() },
        opts(session),
      );
      await quotationRepository.model.updateMany(
        { rfq: rfq._id, _id: { $ne: quotation._id }, status: { $in: [QUOTATION_STATUS.SUBMITTED, QUOTATION_STATUS.SHORTLISTED] } },
        { status: QUOTATION_STATUS.REJECTED, rejectionReason: 'Another supplier was selected', decidedAt: new Date() },
        opts(session),
      );
      await rfqRepository.model.updateOne(
        { _id: rfq._id },
        { status: RFQ_STATUS.AWARDED, awardedQuotation: quotation._id, closedAt: new Date() },
        opts(session),
      );

      return created;
    });

    await companyRepository.updateById(rfq.company, {
      $inc: { 'stats.orderCount': 1, 'stats.totalSpend': total, 'stats.savings': savings },
    });

    eventBus.publish(DomainEvents.QUOTATION_ACCEPTED, { quotation, rfq });
    eventBus.publish(DomainEvents.RFQ_AWARDED, { rfq, quotation, savings });
    eventBus.publish(DomainEvents.PO_ISSUED, { po });

    for (const rival of rivals) {
      if (String(rival._id) !== String(quotation._id)) {
        eventBus.publish(DomainEvents.QUOTATION_REJECTED, {
          quotation: rival,
          reason: 'Another supplier was selected',
        });
      }
    }

    return this.getById(po._id, { user, companyId });
  }

  /** Order status transitions: Approved → Processing → Shipped → Delivered. */
  async updateStatus(id, { status, note, carrier, trackingNumber }, { user, companyId, supplierId }) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po) throw ApiError.notFound('Purchase order');

    const isBuyer = String(po.company) === String(companyId);
    const isSupplier = String(po.supplier) === String(supplierId);
    if (user.role !== ROLES.ADMIN && !isBuyer && !isSupplier) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    this.#assertTransition(po.status, status, { isBuyer, isSupplier, isAdmin: user.role === ROLES.ADMIN });

    po.status = status;
    po.timeline.push({ status, note: note || '', by: user._id, at: new Date() });

    if (status === PO_STATUS.SHIPPED) {
      po.shipment.shippedAt = new Date();
      if (carrier) po.shipment.carrier = carrier;
      if (trackingNumber) po.shipment.trackingNumber = trackingNumber;
    }
    if (status === PO_STATUS.DELIVERED) {
      po.actualDeliveryDate = new Date();
    }
    if (status === PO_STATUS.COMPLETED) {
      await supplierRepository.updateById(po.supplier, {
        $inc: { 'stats.ordersCompleted': 1, 'stats.totalSales': po.total },
      });
      await this.#refreshOnTimeRate(po.supplier);
    }

    await po.save();
    eventBus.publish(DomainEvents.PO_STATUS_CHANGED, { po, status });
    return this.getById(id, { user, companyId, supplierId });
  }

  async list(query, { user, companyId, supplierId }) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query.sort);
    const filter = {};

    if (user.role === ROLES.BUYER) filter.company = companyId;
    if (user.role === ROLES.SUPPLIER) filter.supplier = supplierId;
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.supplier) filter.supplier = query.supplier;
    if (query.q) filter.poNumber = { $regex: query.q, $options: 'i' };

    return purchaseOrderRepository.paginate(filter, {
      page, limit, skip, sort, populate: POPULATE, lean: true,
    });
  }

  async getById(id, { user, companyId, supplierId } = {}) {
    const po = await purchaseOrderRepository.findById(id, { populate: POPULATE });
    if (!po) throw ApiError.notFound('Purchase order');
    if (user && user.role !== ROLES.ADMIN) {
      const mine =
        String(po.company?._id ?? po.company) === String(companyId) ||
        String(po.supplier?._id ?? po.supplier) === String(supplierId);
      if (!mine) throw ApiError.forbidden('This order does not belong to you');
    }
    return po;
  }

  async cancel(id, { reason }, ctx) {
    const po = await this.getById(id, ctx);
    if ([PO_STATUS.SHIPPED, PO_STATUS.DELIVERED, PO_STATUS.COMPLETED].includes(po.status)) {
      throw ApiError.badRequest('An order that has shipped can no longer be cancelled');
    }
    return this.updateStatus(id, { status: PO_STATUS.CANCELLED, note: reason }, ctx);
  }

  /** Supplier evaluation, available once an order is delivered. */
  async review(id, dto, { user, companyId }) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po) throw ApiError.notFound('Purchase order');
    if (String(po.company) !== String(companyId)) throw ApiError.forbidden('This order belongs to another company');
    if (![PO_STATUS.DELIVERED, PO_STATUS.COMPLETED].includes(po.status)) {
      throw ApiError.badRequest('You can rate a supplier once the order has been delivered');
    }
    if (po.rated) throw ApiError.conflict('You have already rated this order');

    const review = await reviewRepository.create({
      supplier: po.supplier,
      company: po.company,
      author: user._id,
      purchaseOrder: po._id,
      scores: dto.scores,
      title: dto.title,
      comment: dto.comment,
    });

    po.rated = true;
    await po.save();
    await this.#refreshRating(po.supplier);
    eventBus.publish(DomainEvents.REVIEW_CREATED, { supplier: po.supplier, review });
    return review;
  }

  #assertTransition(from, to, { isBuyer, isSupplier, isAdmin }) {
    if (to === PO_STATUS.CANCELLED) return;
    if (from === PO_STATUS.CANCELLED) throw ApiError.badRequest('This order was cancelled');

    const fromIdx = PO_FLOW.indexOf(from);
    const toIdx = PO_FLOW.indexOf(to);
    if (toIdx < 0) throw ApiError.badRequest(`Unknown order status "${to}"`);
    if (toIdx <= fromIdx) throw ApiError.badRequest(`An order cannot move from "${from}" back to "${to}"`);
    if (toIdx > fromIdx + 1) {
      throw ApiError.badRequest(`"${to}" comes after "${PO_FLOW[fromIdx + 1]}" — advance one step at a time`);
    }

    if (isAdmin) return;
    // The supplier drives fulfilment; the buyer approves and closes the order.
    const supplierOwned = [PO_STATUS.PROCESSING, PO_STATUS.SHIPPED, PO_STATUS.DELIVERED];
    const buyerOwned = [PO_STATUS.APPROVED, PO_STATUS.COMPLETED];
    if (supplierOwned.includes(to) && !isSupplier) {
      throw ApiError.forbidden(`Only the supplier can mark this order as "${to}"`);
    }
    if (buyerOwned.includes(to) && !isBuyer) {
      throw ApiError.forbidden(`Only the buyer can mark this order as "${to}"`);
    }
  }

  async #refreshRating(supplierId) {
    const agg = await reviewRepository.aggregateForSupplier(supplierId);
    if (!agg) return;
    await supplierRepository.updateById(supplierId, {
      'rating.average': +agg.average.toFixed(1),
      'rating.count': agg.count,
      'rating.breakdown.quality': +agg.quality.toFixed(1),
      'rating.breakdown.delivery': +agg.delivery.toFixed(1),
      'rating.breakdown.communication': +agg.communication.toFixed(1),
      'rating.breakdown.pricing': +agg.pricing.toFixed(1),
    });
  }

  async #refreshOnTimeRate(supplierId) {
    const orders = await purchaseOrderRepository.find(
      { supplier: supplierId, status: { $in: [PO_STATUS.DELIVERED, PO_STATUS.COMPLETED] } },
      { lean: true },
    );
    if (!orders.length) return;
    const onTime = orders.filter(
      (o) => o.actualDeliveryDate && new Date(o.actualDeliveryDate) <= new Date(o.expectedDeliveryDate),
    ).length;
    await supplierRepository.updateById(supplierId, {
      onTimeDeliveryRate: Math.round((onTime / orders.length) * 100),
    });
  }
}

export const orderService = new OrderService();
