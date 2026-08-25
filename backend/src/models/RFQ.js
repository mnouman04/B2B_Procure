import mongoose from 'mongoose';
import { RFQ_STATUS, UNITS } from '../config/constants.js';

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String, default: '' },
  },
  { _id: false },
);

const rfqItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: UNITS, default: 'pcs' },
    specifications: [specSchema],
    targetPrice: { type: Number, default: null },
    attachments: [{ name: String, url: String, size: Number, mimeType: String }],
  },
  { _id: true },
);

/**
 * The Request For Quotation — the heart of the platform.
 * Created through the 4-step "Create RFQ" wizard.
 */
const rfqSchema = new mongoose.Schema(
  {
    rfqNumber: { type: String, unique: true, index: true },
    title: { type: String, required: [true, 'RFQ title is required'], trim: true },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    projectName: { type: String, default: '' },
    deliveryLocation: {
      city: { type: String, required: true, index: true },
      region: { type: String, default: '' },
      country: { type: String, default: 'Saudi Arabia' },
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    requiredDeliveryDate: { type: Date, required: true },
    quotationDeadline: { type: Date, default: null },

    items: {
      type: [rfqItemSchema],
      validate: [(v) => v.length > 0, 'An RFQ needs at least one item'],
    },
    attachments: [{ name: String, url: String, size: Number, mimeType: String }],
    notes: { type: String, default: '' },

    budget: { type: Number, default: null },
    currency: { type: String, default: 'SAR' },
    paymentTerms: { type: String, default: '30 Days' },
    warrantyRequired: { type: Number, default: 0 },

    // Supplier Matching — snapshot of who was invited and how well they scored.
    invitedSuppliers: [
      {
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        matchScore: { type: Number, default: 0 },
        distanceKm: { type: Number, default: null },
        invitedAt: { type: Date, default: Date.now },
        viewedAt: { type: Date, default: null },
      },
    ],
    visibility: { type: String, enum: ['invited', 'public'], default: 'invited' },

    status: { type: String, enum: Object.values(RFQ_STATUS), default: RFQ_STATUS.DRAFT, index: true },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    quotesCount: { type: Number, default: 0 },
    awardedQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
    estimatedValue: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

rfqSchema.index({ title: 'text', notes: 'text' });
rfqSchema.index({ status: 1, createdAt: -1 });

rfqSchema.virtual('quotations', {
  ref: 'Quotation',
  localField: '_id',
  foreignField: 'rfq',
});

rfqSchema.virtual('totalQuantity').get(function totalQuantity() {
  return (this.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
});

rfqSchema.virtual('daysToDeadline').get(function daysToDeadline() {
  const target = this.quotationDeadline || this.requiredDeliveryDate;
  if (!target) return null;
  return Math.ceil((new Date(target) - Date.now()) / 86400000);
});

rfqSchema.virtual('isOpen').get(function isOpen() {
  return [RFQ_STATUS.PUBLISHED, RFQ_STATUS.QUOTED].includes(this.status);
});

export const RFQ = mongoose.model('RFQ', rfqSchema);
