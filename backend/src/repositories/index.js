import { BaseRepository } from './BaseRepository.js';
import {
  User, Company, Supplier, Category, Product,
  RFQ, Quotation, PurchaseOrder, Conversation, Message, Notification, Review,
} from '../models/index.js';
import { RFQ_STATUS, QUOTATION_STATUS, VERIFICATION_STATUS } from '../config/constants.js';

class UserRepository extends BaseRepository {
  findByEmail(email, { withPassword = false } = {}) {
    const q = this.model.findOne({ email: String(email).toLowerCase().trim() });
    return withPassword ? q.select('+password') : q;
  }
  findWithOrg(id) {
    return this.model.findById(id).populate('company').populate('supplier');
  }
}

class CompanyRepository extends BaseRepository {
  findByCr(crNumber) { return this.model.findOne({ crNumber }); }
}

class SupplierRepository extends BaseRepository {
  findBySlug(slug) {
    return this.model.findOne({ slug }).populate('primaryCategory').populate('categories');
  }
  findByCr(crNumber) { return this.model.findOne({ crNumber }); }

  /** Candidate pool for the matching engine: active, verified, in-category suppliers. */
  findCandidates({ categoryIds = [], city, includeUnverified = false } = {}) {
    const filter = { isActive: true };
    if (!includeUnverified) filter.status = VERIFICATION_STATUS.VERIFIED;
    if (categoryIds.length) filter.categories = { $in: categoryIds };
    if (city) filter.$or = [{ 'location.city': city }, { coverageAreas: city }, { coverageAreas: 'All' }];
    return this.model.find(filter).populate('primaryCategory').lean();
  }

  topRated(limit = 4) {
    return this.model
      .find({ isActive: true, status: VERIFICATION_STATUS.VERIFIED })
      .sort({ featured: -1, 'rating.average': -1, 'rating.count': -1 })
      .limit(limit)
      .populate('primaryCategory')
      .lean();
  }
}

class CategoryRepository extends BaseRepository {
  findRoots() { return this.model.find({ parent: null, isActive: true }).sort('order name').lean(); }
  findChildren(parentId) { return this.model.find({ parent: parentId, isActive: true }).sort('order name').lean(); }
  findBySlug(slug) { return this.model.findOne({ slug }); }
}

class RFQRepository extends BaseRepository {
  findByNumber(rfqNumber) { return this.model.findOne({ rfqNumber }); }

  /** RFQs a given supplier may quote on: publicly open, or where they were invited. */
  openForSupplier(supplierId, extraFilter = {}) {
    return {
      status: { $in: [RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED] },
      $or: [{ visibility: 'public' }, { 'invitedSuppliers.supplier': supplierId }],
      ...extraFilter,
    };
  }

  incrementQuotes(rfqId, by = 1) {
    return this.model.findByIdAndUpdate(rfqId, { $inc: { quotesCount: by } }, { new: true });
  }
}

class QuotationRepository extends BaseRepository {
  findByNumber(quoteNumber) { return this.model.findOne({ quoteNumber }); }

  findForRfq(rfqId, { onlySubmitted = true } = {}) {
    const filter = { rfq: rfqId };
    if (onlySubmitted) {
      filter.status = {
        $in: [
          QUOTATION_STATUS.SUBMITTED, QUOTATION_STATUS.SHORTLISTED,
          QUOTATION_STATUS.ACCEPTED, QUOTATION_STATUS.REJECTED,
        ],
      };
    }
    return this.model.find(filter).populate('supplier').sort('-matchScore');
  }

  findBySupplierAndRfq(supplierId, rfqId) {
    return this.model.findOne({ supplier: supplierId, rfq: rfqId });
  }
}

class PurchaseOrderRepository extends BaseRepository {
  findByNumber(poNumber) { return this.model.findOne({ poNumber }); }
}

class ConversationRepository extends BaseRepository {
  findBetween(participantIds, { rfq = null } = {}) {
    return this.model.findOne({ participants: { $all: participantIds, $size: participantIds.length }, rfq });
  }
  forUser(userId) { return this.model.find({ participants: userId }).sort('-updatedAt'); }
}

class MessageRepository extends BaseRepository {}

class NotificationRepository extends BaseRepository {
  unreadCount(userId) { return this.model.countDocuments({ user: userId, read: false }); }
  markAllRead(userId) {
    return this.model.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
  }
}

class ReviewRepository extends BaseRepository {
  /** Recomputes a supplier's rolling rating from all of its reviews. */
  async aggregateForSupplier(supplierId) {
    const [row] = await this.model.aggregate([
      { $match: { supplier: supplierId } },
      {
        $group: {
          _id: '$supplier',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          quality: { $avg: '$scores.quality' },
          delivery: { $avg: '$scores.delivery' },
          communication: { $avg: '$scores.communication' },
          pricing: { $avg: '$scores.pricing' },
        },
      },
    ]);
    return row || null;
  }
}

class ProductRepository extends BaseRepository {}

export const userRepository = new UserRepository(User);
export const companyRepository = new CompanyRepository(Company);
export const supplierRepository = new SupplierRepository(Supplier);
export const categoryRepository = new CategoryRepository(Category);
export const productRepository = new ProductRepository(Product);
export const rfqRepository = new RFQRepository(RFQ);
export const quotationRepository = new QuotationRepository(Quotation);
export const purchaseOrderRepository = new PurchaseOrderRepository(PurchaseOrder);
export const conversationRepository = new ConversationRepository(Conversation);
export const messageRepository = new MessageRepository(Message);
export const notificationRepository = new NotificationRepository(Notification);
export const reviewRepository = new ReviewRepository(Review);
