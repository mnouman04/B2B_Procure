import mongoose from 'mongoose';
import { PO_STATUS } from '../config/constants.js';

const poItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'pcs' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    deliveredQuantity: { type: Number, default: 0 },
  },
  { _id: true },
);

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

/**
 * Purchase Order — issued when a buyer accepts a quotation.
 * Carries its own delivery tracking, powering the "Orders & Delivery" screen.
 */
const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true, index: true },
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true, index: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },

    items: { type: [poItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    vatRate: { type: Number, default: 0.15 },
    vatAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'SAR' },
    commission: { type: Number, default: 0 },

    paymentTerms: { type: String, default: '30 Days' },
    warrantyYears: { type: Number, default: 1 },

    deliveryLocation: {
      city: String,
      region: String,
      country: { type: String, default: 'Saudi Arabia' },
      address: String,
    },
    expectedDeliveryDate: { type: Date, required: true },
    actualDeliveryDate: { type: Date, default: null },

    shipment: {
      carrier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      shippedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
    },

    status: { type: String, enum: Object.values(PO_STATUS), default: PO_STATUS.ISSUED, index: true },
    timeline: { type: [timelineEntrySchema], default: [] },

    invoice: {
      number: { type: String, default: '' },
      url: { type: String, default: '' },
      issuedAt: { type: Date, default: null },
      paid: { type: Boolean, default: false },
      paidAt: { type: Date, default: null },
    },

    rated: { type: Boolean, default: false },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

purchaseOrderSchema.virtual('isLate').get(function isLate() {
  if (this.actualDeliveryDate) return this.actualDeliveryDate > this.expectedDeliveryDate;
  return this.status !== PO_STATUS.COMPLETED && new Date() > this.expectedDeliveryDate;
});

purchaseOrderSchema.virtual('progress').get(function progress() {
  const order = [
    PO_STATUS.ISSUED, PO_STATUS.APPROVED, PO_STATUS.PROCESSING,
    PO_STATUS.SHIPPED, PO_STATUS.DELIVERED, PO_STATUS.COMPLETED,
  ];
  const idx = order.indexOf(this.status);
  return idx < 0 ? 0 : Math.round((idx / (order.length - 1)) * 100);
});

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
