import { z } from 'zod';
import { ROLES, SECTORS } from '../config/constants.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const person = {
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid work email'),
  phone: z.string().trim().min(8, 'Enter a valid phone number'),
  jobTitle: z.string().trim().optional().default(''),
  password,
};

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/** Company Registration screen — creates the Company and its first buyer user. */
export const registerCompanySchema = z.object({
  ...person,
  role: z.literal(ROLES.BUYER).optional(),
  company: z.object({
    name: z.string().trim().min(2, 'Company name is required'),
    nameAr: z.string().trim().optional().default(''),
    crNumber: z.string().trim().min(6, 'Commercial registration number is required'),
    vatNumber: z.string().trim().optional().default(''),
    sector: z.enum(SECTORS).default('Other'),
    size: z.enum(['1-50', '51-200', '201-500', '501-1000', '1000+']).default('51-200'),
    website: z.string().trim().optional().default(''),
    city: z.string().trim().min(2, 'City is required'),
    region: z.string().trim().optional().default(''),
    country: z.string().trim().default('Saudi Arabia'),
    address: z.string().trim().optional().default(''),
  }),
});

/** Supplier "Join as Supplier" registration. */
export const registerSupplierSchema = z.object({
  ...person,
  role: z.literal(ROLES.SUPPLIER).optional(),
  supplier: z.object({
    name: z.string().trim().min(2, 'Company name is required'),
    nameAr: z.string().trim().optional().default(''),
    crNumber: z.string().trim().min(6, 'Commercial registration number is required'),
    vatNumber: z.string().trim().optional().default(''),
    about: z.string().trim().optional().default(''),
    categories: z.array(z.string()).min(1, 'Select at least one category'),
    primaryCategory: z.string().optional(),
    city: z.string().trim().min(2, 'City is required'),
    region: z.string().trim().optional().default(''),
    country: z.string().trim().default('Saudi Arabia'),
    coverageAreas: z.array(z.string()).default([]),
    foundedYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
    employees: z.coerce.number().int().min(0).optional(),
    website: z.string().trim().optional().default(''),
  }),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  avatar: z.string().optional(),
  locale: z.enum(['en', 'ar']).optional(),
});
