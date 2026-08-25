import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/** Role gate: `authorize(ROLES.BUYER, ROLES.ADMIN)`. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action is restricted to: ${roles.join(', ')}`));
  }
  return next();
};

/** A buyer must be attached to a registered company before transacting. */
export const requireCompany = (req, _res, next) => {
  if (req.user?.role === ROLES.ADMIN) return next();
  if (!req.companyId) return next(ApiError.forbidden('Complete your company registration first'));
  return next();
};

/** A supplier user must be attached to a supplier organisation. */
export const requireSupplier = (req, _res, next) => {
  if (req.user?.role === ROLES.ADMIN) return next();
  if (!req.supplierId) return next(ApiError.forbidden('Complete your supplier registration first'));
  return next();
};

/**
 * Ownership guard used after a resource is loaded onto `req`.
 * `getOwnerId(req)` must return the id allowed to act on the resource.
 */
export const requireOwnership = (getOwnerId) => (req, _res, next) => {
  if (req.user?.role === ROLES.ADMIN) return next();
  const ownerId = getOwnerId(req);
  if (!ownerId || String(ownerId) !== String(req.user._id)) {
    return next(ApiError.forbidden('You can only act on your own records'));
  }
  return next();
};
