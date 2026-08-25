import mongoose from 'mongoose';

/** A thread between a buying company and a supplier, optionally scoped to an RFQ or PO. */
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', default: null },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null },
    subject: { type: String, default: '' },
    lastMessage: {
      body: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      at: { type: Date, default: null },
    },
    unread: { type: Map, of: Number, default: {} },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
