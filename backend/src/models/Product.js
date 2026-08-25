import mongoose from 'mongoose';
import slugify from 'slugify';
import { UNITS } from '../config/constants.js';

/** Catalogue entry shown on a supplier profile under "Products & Services". */
const productSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, default: '' },
    slug: { type: String, index: true },
    description: { type: String, default: '' },
    specifications: [{ key: String, value: String, unit: String }],
    unit: { type: String, enum: UNITS, default: 'pcs' },
    priceFrom: { type: Number, default: null },
    priceTo: { type: Number, default: null },
    currency: { type: String, default: 'SAR' },
    minOrderQuantity: { type: Number, default: 1 },
    leadTimeDays: { type: Number, default: 7 },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('validate', function makeSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
