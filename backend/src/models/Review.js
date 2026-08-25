import mongoose from 'mongoose';

/** Supplier evaluation left by a buyer after an order completes. */
const reviewSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null },

    scores: {
      quality: { type: Number, required: true, min: 1, max: 5 },
      delivery: { type: Number, required: true, min: 1, max: 5 },
      communication: { type: Number, required: true, min: 1, max: 5 },
      pricing: { type: Number, required: true, min: 1, max: 5 },
    },
    rating: { type: Number, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, default: '' },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One review per purchase order. Historical reviews carry no PO, so the
// constraint is applied only where `purchaseOrder` is actually set.
reviewSchema.index(
  { supplier: 1, purchaseOrder: 1 },
  { unique: true, partialFilterExpression: { purchaseOrder: { $type: 'objectId' } } },
);

reviewSchema.pre('save', function averageScores(next) {
  const s = this.scores;
  this.rating = +((s.quality + s.delivery + s.communication + s.pricing) / 4).toFixed(1);
  next();
});

export const Review = mongoose.model('Review', reviewSchema);
