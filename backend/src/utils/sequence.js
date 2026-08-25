import mongoose from 'mongoose';

/**
 * Atomic, human-readable document numbers: RFQ-2026-0156, QT-2026-0042, PO-2026-0087.
 * Uses a dedicated counters collection so concurrent writers never collide.
 */
const counterSchema = new mongoose.Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { versionKey: false },
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export const nextSequence = async (prefix, year = new Date().getFullYear()) => {
  const key = `${prefix}-${year}`;
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `${prefix}-${year}-${String(doc.seq).padStart(4, '0')}`;
};

export const resetSequences = () => Counter.deleteMany({});
