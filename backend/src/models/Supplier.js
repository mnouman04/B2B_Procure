import mongoose from 'mongoose';
import slugify from 'slugify';
import { VERIFICATION_STATUS, DOCUMENT_TYPES } from '../config/constants.js';

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    number: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED],
      default: VERIFICATION_STATUS.PENDING,
    },
    reviewNote: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameAr: { type: String, trim: true, default: '' },
    slug: { type: String, unique: true, index: true },
    logo: { type: String, default: '' },
    tagline: { type: String, default: '' },
    about: { type: String, default: '' },
    aboutAr: { type: String, default: '' },

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
    primaryCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    tags: [{ type: String }],

    // Registration / verification data — "Vendor Verification" screen.
    crNumber: { type: String, required: true, unique: true, trim: true },
    vatNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    documents: [documentSchema],
    certifications: [{ name: String, issuer: String, year: Number }],

    contact: {
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, default: '' },
      website: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
    },

    location: {
      city: { type: String, index: true },
      region: { type: String, default: '' },
      country: { type: String, default: 'Saudi Arabia' },
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    coverageAreas: [{ type: String }], // cities the supplier delivers to

    // Performance signals used by the matching engine.
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      breakdown: {
        quality: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        pricing: { type: Number, default: 0 },
      },
    },
    onTimeDeliveryRate: { type: Number, default: 0, min: 0, max: 100 },
    complianceRate: { type: Number, default: 0, min: 0, max: 100 },
    responseTimeHours: { type: Number, default: 24 },
    avgLeadTimeDays: { type: Number, default: 14 },
    priceIndex: { type: Number, default: 100 }, // 100 = market average; lower is cheaper

    foundedYear: { type: Number, default: null },
    employees: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    pastProjects: [{ name: String, client: String, year: Number, value: Number, description: String }],

    verified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stats: {
      quotesSubmitted: { type: Number, default: 0 },
      quotesWon: { type: Number, default: 0 },
      ordersCompleted: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
    },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

supplierSchema.index({ name: 'text', nameAr: 'text', about: 'text', tags: 'text' });
supplierSchema.index({ 'rating.average': -1, verified: -1 });

supplierSchema.virtual('winRate').get(function winRate() {
  const { quotesSubmitted, quotesWon } = this.stats || {};
  if (!quotesSubmitted) return 0;
  return Math.round((quotesWon / quotesSubmitted) * 100);
});

supplierSchema.pre('validate', function makeSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Supplier = mongoose.model('Supplier', supplierSchema);
