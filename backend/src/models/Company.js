import mongoose from 'mongoose';
import { SECTORS, VERIFICATION_STATUS } from '../config/constants.js';

/** The buying organisation — created by the "Company Registration" screen. */
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameAr: { type: String, trim: true, default: '' },
    logo: { type: String, default: '' },
    crNumber: { type: String, required: true, unique: true, trim: true },
    vatNumber: { type: String, trim: true, default: '' },
    sector: { type: String, enum: SECTORS, default: 'Other' },
    size: { type: String, enum: ['1-50', '51-200', '201-500', '501-1000', '1000+'], default: '51-200' },
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '', index: true },
      region: { type: String, default: '' },
      country: { type: String, default: 'Saudi Arabia' },
      postalCode: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    verified: { type: Boolean, default: false },
    documents: [
      {
        type: { type: String },
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stats: {
      totalSpend: { type: Number, default: 0 },
      rfqCount: { type: Number, default: 0 },
      orderCount: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

companySchema.index({ name: 'text', nameAr: 'text' });

export const Company = mongoose.model('Company', companySchema);
