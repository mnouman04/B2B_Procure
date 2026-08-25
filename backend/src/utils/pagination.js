import { PAGINATION } from '../config/constants.js';

export const parsePagination = (query = {}) => {
  const page = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

export const parseSort = (sort, fallback = '-createdAt') => {
  if (!sort) return fallback;
  return String(sort).split(',').map((s) => s.trim()).filter(Boolean).join(' ');
};
