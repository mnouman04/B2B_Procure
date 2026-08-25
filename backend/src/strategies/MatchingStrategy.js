import { distanceKm, coordsForCity } from '../utils/geo.js';

/**
 * Strategy pattern — supplier matching.
 *
 * Each concrete strategy weights the same feature vector differently, so the
 * buyer can re-sort the "Supplier Matching" screen (Best Match / Nearest /
 * Highest Rated / …) without the service layer changing at all.
 */
export class MatchingStrategy {
  /** @returns {{weights: Record<string, number>, label: string}} */
  get weights() { throw new Error('weights must be implemented'); }
  get label() { return this.constructor.name; }

  /**
   * Normalised 0..1 features for a supplier against an RFQ.
   */
  features(supplier, rfq, context = {}) {
    const wantedCategories = [rfq.category, rfq.subCategory].filter(Boolean).map(String);
    const supplierCategories = (supplier.categories || []).map(String);
    const categoryHits = wantedCategories.filter((c) => supplierCategories.includes(c)).length;
    const category = wantedCategories.length ? categoryHits / wantedCategories.length : 0;

    const city = rfq.deliveryLocation?.city;
    const from = supplier.location?.lat != null
      ? { lat: supplier.location.lat, lng: supplier.location.lng }
      : coordsForCity(supplier.location?.city);
    const to = rfq.deliveryLocation?.lat != null
      ? { lat: rfq.deliveryLocation.lat, lng: rfq.deliveryLocation.lng }
      : coordsForCity(city);
    const km = distanceKm(from, to);
    // 0 km → 1.0, 1000 km → 0.0
    const proximity = km == null ? 0.5 : Math.max(0, 1 - km / 1000);
    const covers =
      supplier.location?.city === city ||
      (supplier.coverageAreas || []).includes(city) ||
      (supplier.coverageAreas || []).includes('All');

    const rating = (supplier.rating?.average || 0) / 5;
    const reliability = (supplier.onTimeDeliveryRate || 0) / 100;
    const compliance = (supplier.complianceRate || 0) / 100;
    const verified = supplier.verified ? 1 : 0;

    // Can the supplier's typical lead time hit the requested date?
    const daysAvailable = rfq.requiredDeliveryDate
      ? Math.max(1, Math.ceil((new Date(rfq.requiredDeliveryDate) - Date.now()) / 86400000))
      : 30;
    const speed = Math.max(0, Math.min(1, daysAvailable / Math.max(1, supplier.avgLeadTimeDays || 14)));

    // priceIndex 100 = market average; 70 → cheap, 130 → expensive.
    const price = Math.max(0, Math.min(1, (130 - (supplier.priceIndex ?? 100)) / 60));

    const capacity = Math.min(1, (supplier.projectsCompleted || 0) / 300);
    const responsiveness = Math.max(0, 1 - (supplier.responseTimeHours || 24) / 72);

    return {
      raw: { distanceKm: km, covers },
      category,
      proximity: covers ? Math.max(proximity, 0.7) : proximity,
      rating,
      reliability,
      compliance,
      verified,
      speed,
      price,
      capacity,
      responsiveness,
      ...context,
    };
  }

  score(supplier, rfq, context = {}) {
    const f = this.features(supplier, rfq, context);
    const w = this.weights;
    const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    const weighted = Object.entries(w).reduce((sum, [key, weight]) => sum + (f[key] ?? 0) * weight, 0);
    const score = Math.round((weighted / totalWeight) * 100);
    return {
      score: Math.max(0, Math.min(100, score)),
      distanceKm: f.raw.distanceKm,
      breakdown: Object.fromEntries(
        Object.keys(w).map((k) => [k, Math.round((f[k] ?? 0) * 100)]),
      ),
    };
  }

  /** Hard filter applied before scoring. Override to exclude candidates outright. */
  isEligible(supplier, rfq) {
    const wanted = [rfq.category, rfq.subCategory].filter(Boolean).map(String);
    const has = (supplier.categories || []).map(String);
    return wanted.some((c) => has.includes(c));
  }
}

/** Balanced default — what the "Best Match" sort uses. */
export class BestMatchStrategy extends MatchingStrategy {
  get label() { return 'Best Match'; }
  get weights() {
    return {
      category: 30, proximity: 15, rating: 15, reliability: 12,
      compliance: 8, verified: 8, speed: 6, price: 6,
    };
  }
}

/** Favours suppliers that historically price below market. */
export class BestPriceStrategy extends MatchingStrategy {
  get label() { return 'Best Price'; }
  get weights() {
    return { price: 40, category: 25, rating: 10, reliability: 10, verified: 8, proximity: 7 };
  }
}

/** Favours short lead times and nearby suppliers. */
export class FastestDeliveryStrategy extends MatchingStrategy {
  get label() { return 'Fastest Delivery'; }
  get weights() {
    return { speed: 35, proximity: 25, category: 20, reliability: 12, verified: 8 };
  }
}

export class HighestRatedStrategy extends MatchingStrategy {
  get label() { return 'Highest Rated'; }
  get weights() {
    return { rating: 40, reliability: 20, compliance: 15, category: 15, verified: 10 };
  }
}

export class NearestStrategy extends MatchingStrategy {
  get label() { return 'Nearest'; }
  get weights() {
    return { proximity: 55, category: 25, verified: 10, rating: 10 };
  }
}
