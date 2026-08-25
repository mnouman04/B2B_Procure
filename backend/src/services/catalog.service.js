import { ApiError } from '../utils/ApiError.js';
import { categoryRepository, supplierRepository, productRepository } from '../repositories/index.js';
import { VERIFICATION_STATUS, UNITS, SECTORS, MATCHING_STRATEGIES } from '../config/constants.js';
import { CITY_COORDS } from '../utils/geo.js';

/** Categories, cities and the global search behind the home-page search bar. */
class CatalogService {
  async categoryTree() {
    const roots = await categoryRepository.findRoots();
    const children = await categoryRepository.find({ parent: { $ne: null }, isActive: true }, { lean: true, sort: 'order name' });
    const byParent = children.reduce((acc, c) => {
      const key = String(c.parent);
      (acc[key] ||= []).push(c);
      return acc;
    }, {});
    return roots.map((r) => ({ ...r, children: byParent[String(r._id)] || [] }));
  }

  async popularCategories(limit = 8) {
    const roots = await categoryRepository.findRoots();
    const counts = await supplierRepository.aggregate([
      { $match: { status: VERIFICATION_STATUS.VERIFIED, isActive: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', suppliers: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.suppliers]));
    return roots
      .map((r) => ({ ...r, supplierCount: map[String(r._id)] || 0 }))
      .sort((a, b) => a.order - b.order || b.supplierCount - a.supplierCount)
      .slice(0, limit);
  }

  async subCategories(parentId) {
    const parent = await categoryRepository.findById(parentId);
    if (!parent) throw ApiError.notFound('Category');
    return categoryRepository.findChildren(parentId);
  }

  /** Home-page search across suppliers, products and categories. */
  async search(term, { limit = 5 } = {}) {
    const q = String(term || '').trim();
    if (q.length < 2) return { suppliers: [], products: [], categories: [] };
    const rx = { $regex: q, $options: 'i' };

    const [suppliers, products, categories] = await Promise.all([
      supplierRepository.find(
        { status: VERIFICATION_STATUS.VERIFIED, isActive: true, $or: [{ name: rx }, { nameAr: rx }, { tags: rx }] },
        { limit, lean: true, select: 'name nameAr slug logo location rating primaryCategory', sort: '-rating.average' },
      ),
      productRepository.find(
        { isActive: true, $or: [{ name: rx }, { nameAr: rx }, { description: rx }] },
        { limit, lean: true, select: 'name nameAr slug supplier category unit priceFrom', populate: [{ path: 'supplier', select: 'name slug logo' }] },
      ),
      categoryRepository.find({ isActive: true, $or: [{ name: rx }, { nameAr: rx }] }, { limit, lean: true, select: 'name nameAr slug icon' }),
    ]);

    return { suppliers, products, categories };
  }

  /** Static reference data the frontend forms need. */
  reference() {
    return {
      units: UNITS,
      sectors: SECTORS,
      cities: Object.keys(CITY_COORDS),
      strategies: Object.values(MATCHING_STRATEGIES),
      paymentTerms: ['Advance', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days'],
      incoterms: ['EXW', 'FOB', 'CIF', 'DAP', 'DDP'],
    };
  }
}

export const catalogService = new CatalogService();
