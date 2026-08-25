/**
 * Scores submitted quotations against each other so the "Compare Quotations"
 * screen can show a composite Match Score plus the Best Price / Best Match /
 * Fastest Delivery badges from the brief.
 *
 * Scoring is relative to the peer set: the cheapest offer gets full price
 * marks, the fastest gets full delivery marks, and so on.
 */
const WEIGHTS = { price: 35, compliance: 30, delivery: 20, rating: 10, warranty: 5 };

const normaliseLowerIsBetter = (value, min, max) => {
  if (max === min) return 1;
  return (max - value) / (max - min);
};

export class QuotationScorer {
  /**
   * @param {Array} quotations Plain or hydrated quotations with a populated `supplier`.
   * @returns {Array} the same quotations with `matchScore`, `scoreBreakdown` and `badges`.
   */
  static score(quotations = []) {
    if (!quotations.length) return [];

    const prices = quotations.map((q) => q.totalPrice || 0);
    const days = quotations.map((q) => q.deliveryDays || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDays = Math.min(...days);
    const maxDays = Math.max(...days);
    const maxWarranty = Math.max(...quotations.map((q) => q.warrantyYears || 0), 1);

    const scored = quotations.map((q) => {
      const supplierRating = q.supplier?.rating?.average ?? 0;
      const parts = {
        price: normaliseLowerIsBetter(q.totalPrice || 0, minPrice, maxPrice),
        compliance: (q.qualityCompliance ?? 100) / 100,
        delivery: normaliseLowerIsBetter(q.deliveryDays || 0, minDays, maxDays),
        rating: supplierRating / 5,
        warranty: (q.warrantyYears || 0) / maxWarranty,
      };
      const total = Object.entries(WEIGHTS).reduce((s, [k, w]) => s + parts[k] * w, 0);
      const breakdown = Object.fromEntries(
        Object.entries(parts).map(([k, v]) => [k, Math.round(v * 100)]),
      );
      return {
        ...(typeof q.toObject === 'function' ? q.toObject({ virtuals: true }) : q),
        matchScore: Math.round(Math.max(0, Math.min(100, total))),
        scoreBreakdown: breakdown,
        badges: [],
      };
    });

    // Award the three headline badges from the brief.
    const tag = (list, predicate, badge) => {
      const winner = list.reduce((best, cur) => (predicate(cur, best) ? cur : best), list[0]);
      if (winner) winner.badges.push(badge);
    };
    tag(scored, (c, b) => (c.totalPrice || 0) < (b.totalPrice || 0), 'best_price');
    tag(scored, (c, b) => (c.deliveryDays || 0) < (b.deliveryDays || 0), 'fastest');
    tag(scored, (c, b) => c.matchScore > b.matchScore, 'best_match');

    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }

  /** Savings versus the most expensive offer — feeds "Average Savings" analytics. */
  static savingsAgainstHighest(quotations, chosen) {
    if (!quotations.length || !chosen) return 0;
    const highest = Math.max(...quotations.map((q) => q.totalPrice || 0));
    return Math.max(0, +(highest - (chosen.totalPrice || 0)).toFixed(2));
  }
}
