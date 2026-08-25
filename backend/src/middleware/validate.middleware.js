import { ApiError } from '../utils/ApiError.js';

/**
 * Zod validation middleware.
 * `validate({ body, query, params })` — every provided schema is parsed and the
 * sanitised result replaces the raw input, so controllers see trusted data only.
 */
export const validate = (schemas) => (req, _res, next) => {
  const issues = [];

  for (const source of ['body', 'query', 'params']) {
    const schema = schemas[source];
    if (!schema) continue;
    const result = schema.safeParse(req[source]);
    if (result.success) {
      if (source === 'query') {
        // Express 4 exposes req.query as a getter on some setups; assign field-wise.
        Object.keys(req.query).forEach((k) => delete req.query[k]);
        Object.assign(req.query, result.data);
      } else {
        req[source] = result.data;
      }
    } else {
      issues.push(
        ...result.error.issues.map((i) => ({
          field: [source, ...i.path].join('.'),
          message: i.message,
          code: i.code,
        })),
      );
    }
  }

  if (issues.length) return next(ApiError.validation(issues));
  return next();
};
