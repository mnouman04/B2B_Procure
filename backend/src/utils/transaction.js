import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

let supportsTransactions = null;

/**
 * Runs `work(session)` inside a transaction when the deployment supports one
 * (replica set / Atlas) and falls back to a plain sequential run on standalone
 * MongoDB, so the same service code works in every environment.
 *
 * `work` receives `session` which is `null` in the fallback path — pass it
 * straight through to Mongoose, which ignores a null session.
 */
export const runInTransaction = async (work) => {
  if (supportsTransactions === false) return work(null);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    supportsTransactions = true;
    return result;
  } catch (err) {
    const unsupported =
      /Transaction numbers are only allowed|replica set|Transactions are not supported|IllegalOperation/i.test(
        err.message || '',
      );
    if (unsupported && supportsTransactions === null) {
      supportsTransactions = false;
      logger.warn('MongoDB deployment does not support transactions — continuing without them.');
      return work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

/** Mongoose options helper: `opts(session)` → `{ session }` or `{}`. */
export const opts = (session) => (session ? { session } : {});
