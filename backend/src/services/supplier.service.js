import { ApiError } from '../utils/ApiError.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { coordsForCity } from '../utils/geo.js';
import {
  supplierRepository, productRepository, reviewRepository,
  purchaseOrderRepository, categoryRepository,
} from '../repositories/index.js';
import { VERIFICATION_STATUS, PO_STATUS, ROLES } from '../config/constants.js';
import { eventBus, DomainEvents } from '../events/EventBus.js';

const LIST_SELECT =
  'name nameAr slug logo tagline primaryCategory categories location rating verified status ' +
  'onTimeDeliveryRate complianceRate projectsCompleted employees foundedYear featured coverageAreas avgLeadTimeDays';

class SupplierService {
  /** Browse Suppliers / directory. */
  async list(query) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query.sort, '-featured -rating.average');
    const filter = { isActive: true };

    if (query.verified !== false) filter.status = VERIFICATION_STATUS.VERIFIED;
    if (query.category) filter.categories = query.category;
    if (query.city) filter.$or = [{ 'location.city': query.city }, { coverageAreas: query.city }];
    if (query.minRating) filter['rating.average'] = { $gte: Number(query.minRating) };
    if (query.featured) filter.featured = true;
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { nameAr: { $regex: query.q, $options: 'i' } },
        { tags: { $regex: query.q, $options: 'i' } },
      ];
    }

    return supplierRepository.paginate(filter, {
      page, limit, skip, sort, lean: true, select: LIST_SELECT,
      populate: [{ path: 'primaryCategory', select: 'name nameAr slug icon' }],
    });
  }

  topRated(limit = 4) {
    return supplierRepository.topRated(limit);
  }

  /** Supplier Profile screen — full public record with tabs' data. */
  async getPublicProfile(idOrSlug) {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const supplier = isId
      ? await supplierRepository.findById(idOrSlug, {
          populate: [
            { path: 'primaryCategory', select: 'name nameAr slug icon' },
            { path: 'categories', select: 'name nameAr slug icon' },
          ],
        })
      : await supplierRepository.findBySlug(idOrSlug);

    if (!supplier || !supplier.isActive) throw ApiError.notFound('Supplier');

    const [products, reviews, completedOrders] = await Promise.all([
      productRepository.find({ supplier: supplier._id, isActive: true }, { lean: true, limit: 24 }),
      reviewRepository.find(
        { supplier: supplier._id, isPublic: true },
        { lean: true, limit: 20, populate: [{ path: 'company', select: 'name nameAr logo' }] },
      ),
      purchaseOrderRepository.count({ supplier: supplier._id, status: PO_STATUS.COMPLETED }),
    ]);

    // Documents are internal — expose only which credentials exist and are verified.
    const publicSupplier = supplier.toObject({ virtuals: true });
    publicSupplier.documents = (publicSupplier.documents || [])
      .filter((d) => d.status === VERIFICATION_STATUS.VERIFIED)
      .map((d) => ({ type: d.type, name: d.name, verified: true }));

    return { supplier: publicSupplier, products, reviews, completedOrders };
  }

  /** The supplier's own record, documents included. */
  async getOwn(supplierId) {
    const supplier = await supplierRepository.findById(supplierId, {
      populate: [
        { path: 'primaryCategory', select: 'name nameAr slug icon' },
        { path: 'categories', select: 'name nameAr slug icon' },
      ],
    });
    if (!supplier) throw ApiError.notFound('Supplier');
    return supplier;
  }

  async update(supplierId, dto) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw ApiError.notFound('Supplier');

    if (dto.categories?.length) {
      const found = await categoryRepository.count({ _id: { $in: dto.categories } });
      if (found !== dto.categories.length) throw ApiError.badRequest('One or more categories are unknown');
    }
    if (dto.location?.city && dto.location.lat == null) {
      const coords = coordsForCity(dto.location.city);
      if (coords) Object.assign(dto.location, coords);
    }

    Object.entries(dto).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'contact' || key === 'location') Object.assign(supplier[key], value);
      else supplier[key] = value;
    });
    await supplier.save();
    return this.getOwn(supplierId);
  }

  /** Vendor Verification — upload CR, VAT, IBAN, accreditations. */
  async addDocument(supplierId, dto) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw ApiError.notFound('Supplier');

    supplier.documents.push({ ...dto, status: VERIFICATION_STATUS.PENDING });
    if (supplier.status === VERIFICATION_STATUS.REJECTED) {
      supplier.status = VERIFICATION_STATUS.PENDING;
    }
    await supplier.save();
    return supplier.documents.at(-1);
  }

  async removeDocument(supplierId, documentId) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw ApiError.notFound('Supplier');
    const doc = supplier.documents.id(documentId);
    if (!doc) throw ApiError.notFound('Document');
    if (doc.status === VERIFICATION_STATUS.VERIFIED) {
      throw ApiError.badRequest('A verified document cannot be removed');
    }
    doc.deleteOne();
    await supplier.save();
    return { deleted: true };
  }

  /** Submits the profile for admin review. */
  async submitForVerification(supplierId) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw ApiError.notFound('Supplier');

    const required = ['commercial_registration', 'vat_certificate', 'iban_letter'];
    const present = new Set(supplier.documents.map((d) => d.type));
    const missing = required.filter((t) => !present.has(t));
    if (missing.length) {
      throw ApiError.badRequest(
        `Upload these documents before submitting: ${missing.map((m) => m.replace(/_/g, ' ')).join(', ')}`,
      );
    }

    supplier.status = VERIFICATION_STATUS.UNDER_REVIEW;
    await supplier.save();
    return supplier;
  }

  /** Admin decision on a supplier's verification. */
  async decideVerification(supplierId, { status, reason, documentDecisions = [] }, actor) {
    if (actor.role !== ROLES.ADMIN) throw ApiError.forbidden('Only administrators can verify suppliers');

    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw ApiError.notFound('Supplier');

    documentDecisions.forEach(({ documentId, status: docStatus, note }) => {
      const doc = supplier.documents.id(documentId);
      if (doc) {
        doc.status = docStatus;
        doc.reviewNote = note || '';
      }
    });

    supplier.status = status;
    supplier.verified = status === VERIFICATION_STATUS.VERIFIED;
    supplier.verifiedAt = supplier.verified ? new Date() : null;
    supplier.rejectionReason = status === VERIFICATION_STATUS.REJECTED ? reason : '';
    await supplier.save();

    eventBus.publish(DomainEvents.SUPPLIER_VERIFICATION_CHANGED, { supplier, status, reason });
    return supplier;
  }

  // ── Catalogue ────────────────────────────────────────────────
  listProducts(supplierId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    return productRepository.paginate(
      { supplier: supplierId },
      { page, limit, skip, lean: true, populate: [{ path: 'category', select: 'name nameAr slug' }] },
    );
  }

  addProduct(supplierId, dto) {
    return productRepository.create({ ...dto, supplier: supplierId });
  }

  async updateProduct(supplierId, productId, dto) {
    const product = await productRepository.updateOne({ _id: productId, supplier: supplierId }, dto);
    if (!product) throw ApiError.notFound('Product');
    return product;
  }

  async removeProduct(supplierId, productId) {
    const deleted = await productRepository.deleteMany({ _id: productId, supplier: supplierId });
    if (!deleted.deletedCount) throw ApiError.notFound('Product');
    return { deleted: true };
  }
}

export const supplierService = new SupplierService();
