import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} does not exist`));

/** Translates every thrown error into one JSON error shape. */
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (err instanceof mongoose.Error.ValidationError) {
    error = ApiError.validation(
      Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  } else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`A record with this ${field} already exists`);
  } else if (err?.name === 'MulterError') {
    error = ApiError.badRequest(`Upload failed: ${err.message}`);
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || 500, err.message || 'Something went wrong');
    error.isOperational = false;
  }

  if (error.statusCode >= 500) logger.error(err.stack || err.message);
  else logger.debug(`${error.statusCode} ${error.message}`);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    ...(error.details ? { errors: error.details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};
