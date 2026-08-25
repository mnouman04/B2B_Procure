/** Domain-level HTTP error. The error middleware is the only place that renders it. */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || ApiError.codeFor(statusCode);
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static codeFor(status) {
    return {
      400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
      409: 'CONFLICT', 422: 'UNPROCESSABLE_ENTITY', 429: 'TOO_MANY_REQUESTS',
    }[status] || 'INTERNAL_ERROR';
  }

  static badRequest(msg = 'Bad request', details) { return new ApiError(400, msg, { details }); }
  static unauthorized(msg = 'Not authenticated') { return new ApiError(401, msg); }
  static forbidden(msg = 'You do not have permission to perform this action') { return new ApiError(403, msg); }
  static notFound(resource = 'Resource') { return new ApiError(404, `${resource} not found`); }
  static conflict(msg = 'Resource already exists') { return new ApiError(409, msg); }
  static validation(details, msg = 'Validation failed') { return new ApiError(422, msg, { code: 'VALIDATION_ERROR', details }); }
}
