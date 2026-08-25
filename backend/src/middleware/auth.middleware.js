import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { userRepository } from '../repositories/index.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.accessToken || null;
};

/** Populates `req.user` with the authenticated user and their organisation. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication token missing');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token');
  }

  const user = await userRepository.findWithOrg(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  req.companyId = user.company?._id ?? null;
  req.supplierId = user.supplier?._id ?? null;
  return next();
});

/** Same as `authenticate`, but does not fail when no token is present. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await userRepository.findWithOrg(payload.sub);
    if (user?.isActive) {
      req.user = user;
      req.companyId = user.company?._id ?? null;
      req.supplierId = user.supplier?._id ?? null;
    }
  } catch {
    // An invalid token on a public route is simply ignored.
  }
  return next();
});
