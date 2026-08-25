import { supplierRepository } from '../repositories/index.js';
import { StrategyFactory } from '../strategies/StrategyFactory.js';
import { MATCHING_STRATEGIES } from '../config/constants.js';

/**
 * Supplier Matching — "We found 12 verified suppliers".
 *
 * Delegates all ranking to a Strategy instance, so the endpoint's `strategy`
 * query parameter is the only thing that changes between sort orders.
 */
class MatchingService {
  /**
   * @param {object} rfq  Hydrated or plain RFQ document.
   * @param {object} options `{ strategy, limit, city, minRating, verifiedOnly }`
   */
  async findMatches(rfq, options = {}) {
    const {
      strategy: strategyKey = MATCHING_STRATEGIES.BEST_MATCH,
      limit = 12,
      city,
      minRating = 0,
      verifiedOnly = true,
    } = options;

    const strategy = StrategyFactory.create(strategyKey);

    const categoryIds = [rfq.category, rfq.subCategory]
      .filter(Boolean)
      .map((c) => (c._id ? c._id : c));

    const candidates = await supplierRepository.findCandidates({
      categoryIds,
      city: city || rfq.deliveryLocation?.city,
      includeUnverified: !verifiedOnly,
    });

    const rfqPlain = typeof rfq.toObject === 'function' ? rfq.toObject({ virtuals: true }) : rfq;

    const ranked = candidates
      .filter((s) => (s.rating?.average || 0) >= minRating)
      .filter((s) => strategy.isEligible(s, rfqPlain))
      .map((supplier) => {
        const { score, distanceKm, breakdown } = strategy.score(supplier, rfqPlain);
        return { supplier, matchScore: score, distanceKm, breakdown };
      })
      .sort((a, b) => b.matchScore - a.matchScore || (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

    return {
      strategy: { key: strategyKey, label: strategy.label },
      totalFound: ranked.length,
      matches: ranked.slice(0, limit),
    };
  }

  /** Picks the invite list when a buyer publishes an RFQ without choosing suppliers. */
  async autoInvite(rfq, { limit = 12, strategy = MATCHING_STRATEGIES.BEST_MATCH } = {}) {
    const { matches } = await this.findMatches(rfq, { strategy, limit, verifiedOnly: true });
    return matches.map((m) => ({
      supplier: m.supplier._id,
      matchScore: m.matchScore,
      distanceKm: m.distanceKm,
      invitedAt: new Date(),
    }));
  }

  availableStrategies() {
    return StrategyFactory.available();
  }
}

export const matchingService = new MatchingService();
