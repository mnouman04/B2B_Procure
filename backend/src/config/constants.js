export const ROLES = Object.freeze({
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
});

export const RFQ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  QUOTED: 'quoted',
  AWARDED: 'awarded',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
});

export const QUOTATION_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  SHORTLISTED: 'shortlisted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
});

/** Order lifecycle from the spec: Approved → Processing → Shipped → Delivered */
export const PO_STATUS = Object.freeze({
  ISSUED: 'issued',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const PO_FLOW = [
  PO_STATUS.ISSUED,
  PO_STATUS.APPROVED,
  PO_STATUS.PROCESSING,
  PO_STATUS.SHIPPED,
  PO_STATUS.DELIVERED,
  PO_STATUS.COMPLETED,
];

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const DOCUMENT_TYPES = Object.freeze({
  COMMERCIAL_REGISTRATION: 'commercial_registration',
  VAT_CERTIFICATE: 'vat_certificate',
  IBAN_LETTER: 'iban_letter',
  ISO_CERTIFICATE: 'iso_certificate',
  SAUDIZATION: 'saudization_certificate',
  ZAKAT: 'zakat_certificate',
  OTHER: 'other',
});

export const NOTIFICATION_TYPES = Object.freeze({
  RFQ_PUBLISHED: 'rfq_published',
  RFQ_INVITATION: 'rfq_invitation',
  QUOTE_RECEIVED: 'quote_received',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',
  PO_ISSUED: 'po_issued',
  PO_STATUS_CHANGED: 'po_status_changed',
  ORDER_DELIVERED: 'order_delivered',
  MESSAGE_RECEIVED: 'message_received',
  SUPPLIER_VERIFIED: 'supplier_verified',
  SUPPLIER_REJECTED: 'supplier_rejected',
});

export const MATCHING_STRATEGIES = Object.freeze({
  BEST_MATCH: 'best_match',
  BEST_PRICE: 'best_price',
  FASTEST_DELIVERY: 'fastest_delivery',
  HIGHEST_RATED: 'highest_rated',
  NEAREST: 'nearest',
});

export const UNITS = ['pcs', 'm', 'm2', 'm3', 'kg', 'ton', 'litre', 'set', 'box', 'roll', 'pallet', 'service'];

export const SECTORS = [
  'Construction', 'Real Estate', 'Manufacturing', 'Oil & Gas', 'Utilities',
  'Healthcare', 'Education', 'Retail', 'Hospitality', 'Logistics', 'Government', 'Other',
];

export const PAGINATION = Object.freeze({ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 12, MAX_LIMIT: 100 });
