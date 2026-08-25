import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    jobTitle: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    locale: { type: String, enum: ['en', 'ar'], default: 'en' },

    // A buyer belongs to a Company; a supplier user belongs to a Supplier org.
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null, index: true },

    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('initials').get(function initials() {
  return `${this.firstName?.[0] ?? ''}${this.lastName?.[0] ?? ''}`.toUpperCase();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
