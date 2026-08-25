/**
 * Decorator that funnels async controller rejections into the error middleware,
 * so no controller needs its own try/catch.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
