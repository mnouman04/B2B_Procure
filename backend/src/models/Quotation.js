import mongoose from 'mongoose';
import { QUOTATION_STATUS } from '../config/constants.js';

const quoteItemSchema = new mongoose.Schema(
  {
    rfqItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'pcs' },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, default: 0 },
    /** How closely the offered item meets the requested specs, 0-100. */
    specCompliance: { type: Number, default: 100, min: 0, max: 100 },
    notes: { type: String, default: '' },
  },
  { _id: true },
);

/** A supplier offer against an RFQ — the "Submit Quotation" screen. */
const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, unique: true, index: true },
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    items: { type: [quoteItemSchema], default: [] },

    subtotal: { type: Number, default: 0 },
    vatRate: { type: Number, default: 0.15 },
    vatAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0, index: true },
    currency: { type: String, default: 'SAR' },

    deliveryDays: { type: Number, required: true, min: 1 },
    warrantyYears: { type: Number, default: 1 },
    paymentTerms: { type: String, default: '30 Days' },
    validUntil: { type: Date, default: null },
    incoterms: { type: String, default: 'DDP' },

    /** Weighted spec compliance across items — shown as "Quality Compliance". */
    qualityCompliance: { type: Number, default: 100, min: 0, max: 100 },
    /** Composite score computed by the ranking engine. */
    matchScore: { type: Number, default: 0, index: true },
    scoreBreakdown: {
      price: { type: Number, default: 0 },
      compliance: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      warranty: { type: Number, default: 0 },
    },

    terms: { type: String, default: '' },
    notes: { type: String, default: '' },
    attachments: [{ name: String, url: String, size: Number, mimeType: String }],

    status: {
      type: String,
      enum: Object.values(QUOTATION_STATUS),
      default: QUOTATION_STATUS.DRAFT,
      index: true,
    },
    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },

    // e-negotiation trail
    revisions: [
      {
        totalPrice: Number,
        deliveryDays: Number,
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

quotationSchema.index({ rfq: 1, supplier: 1 }, { unique: true });

quotationSchema.pre('save', function computeTotals(next) {
  this.items.forEach((item) => {
    item.totalPrice = +(item.unitPrice * item.quantity).toFixed(2);
  });
  this.subtotal = +this.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2);
  const net = Math.max(0, this.subtotal - (this.discount || 0));
  this.vatAmount = +(net * this.vatRate).toFixed(2);
  this.totalPrice = +(net + this.vatAmount).toFixed(2);
  if (this.items.length) {
    const weighted = this.items.reduce((s, i) => s + i.specCompliance * i.totalPrice, 0);
    this.qualityCompliance = Math.round(weighted / (this.subtotal || 1));
  }
  next();
});

export const Quotation = mongoose.model('Quotation', quotationSchema);
