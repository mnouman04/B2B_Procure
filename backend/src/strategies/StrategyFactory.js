import { MATCHING_STRATEGIES } from '../config/constants.js';
import {
  BestMatchStrategy, BestPriceStrategy, FastestDeliveryStrategy,
  HighestRatedStrategy, NearestStrategy,
} from './MatchingStrategy.js';

/**
 * Factory pattern — resolves a strategy key from the request into a concrete
 * strategy instance. Registering a new sort order is a one-line change here.
 */
const registry = new Map([
  [MATCHING_STRATEGIES.BEST_MATCH, BestMatchStrategy],
  [MATCHING_STRATEGIES.BEST_PRICE, BestPriceStrategy],
  [MATCHING_STRATEGIES.FASTEST_DELIVERY, FastestDeliveryStrategy],
  [MATCHING_STRATEGIES.HIGHEST_RATED, HighestRatedStrategy],
  [MATCHING_STRATEGIES.NEAREST, NearestStrategy],
]);

const cache = new Map();

export class StrategyFactory {
  static create(key = MATCHING_STRATEGIES.BEST_MATCH) {
    const Cls = registry.get(key) || registry.get(MATCHING_STRATEGIES.BEST_MATCH);
    if (!cache.has(Cls)) cache.set(Cls, new Cls());
    return cache.get(Cls);
  }

  static register(key, Cls) { registry.set(key, Cls); }

  static available() {
    return [...registry.entries()].map(([key, Cls]) => ({ key, label: new Cls().label }));
  }
}
