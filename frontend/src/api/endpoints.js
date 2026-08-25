import { api } from './client.js';

/**
 * One typed module per backend resource. Components never call axios
 * directly, so a route change is a one-line edit here.
 */
export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  registerCompany: (payload) => api.post('/auth/register/company', payload),
  registerSupplier: (payload) => api.post('/auth/register/supplier', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.patch('/auth/me', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
};

export const catalogApi = {
  categories: () => api.get('/catalog/categories'),
  popularCategories: (limit = 8) => api.get('/catalog/categories/popular', { params: { limit } }),
  children: (id) => api.get(`/catalog/categories/${id}/children`),
  search: (q, limit = 5) => api.get('/catalog/search', { params: { q, limit } }),
  reference: () => api.get('/catalog/reference'),
};

export const supplierApi = {
  list: (params) => api.get('/suppliers', { params }),
  topRated: (limit = 4) => api.get('/suppliers/top-rated', { params: { limit } }),
  profile: (idOrSlug) => api.get(`/suppliers/${idOrSlug}`),
  me: () => api.get('/suppliers/me'),
  updateMe: (payload) => api.patch('/suppliers/me', payload),
  addDocument: (payload) => api.post('/suppliers/me/documents', payload),
  removeDocument: (documentId) => api.delete(`/suppliers/me/documents/${documentId}`),
  submitVerification: () => api.post('/suppliers/me/submit-verification'),
  myProducts: (params) => api.get('/suppliers/me/products', { params }),
  addProduct: (payload) => api.post('/suppliers/me/products', payload),
  updateProduct: (id, payload) => api.patch(`/suppliers/me/products/${id}`, payload),
  removeProduct: (id) => api.delete(`/suppliers/me/products/${id}`),
  decideVerification: (id, payload) => api.post(`/suppliers/${id}/verification`, payload),
};

export const rfqApi = {
  list: (params) => api.get('/rfqs', { params }),
  get: (id) => api.get(`/rfqs/${id}`),
  create: (payload) => api.post('/rfqs', payload),
  update: (id, payload) => api.patch(`/rfqs/${id}`, payload),
  remove: (id) => api.delete(`/rfqs/${id}`),
  matches: (id, params) => api.get(`/rfqs/${id}/matches`, { params }),
  publish: (id, payload) => api.post(`/rfqs/${id}/publish`, payload),
  comparison: (id) => api.get(`/rfqs/${id}/comparison`),
  close: (id) => api.post(`/rfqs/${id}/close`),
  strategies: () => api.get('/rfqs/strategies'),
};

export const quotationApi = {
  list: (params) => api.get('/quotations', { params }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (payload) => api.post('/quotations', payload),
  update: (id, payload) => api.patch(`/quotations/${id}`, payload),
  revise: (id, payload) => api.post(`/quotations/${id}/revise`, payload),
  withdraw: (id) => api.post(`/quotations/${id}/withdraw`),
  shortlist: (id) => api.post(`/quotations/${id}/shortlist`),
  reject: (id, payload) => api.post(`/quotations/${id}/reject`, payload),
};

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  issue: (payload) => api.post('/orders', payload),
  updateStatus: (id, payload) => api.patch(`/orders/${id}/status`, payload),
  cancel: (id, payload) => api.post(`/orders/${id}/cancel`, payload),
  review: (id, payload) => api.post(`/orders/${id}/review`, payload),
};

export const messageApi = {
  conversations: (params) => api.get('/messages/conversations', { params }),
  conversation: (id) => api.get(`/messages/conversations/${id}`),
  messages: (id, params) => api.get(`/messages/conversations/${id}/messages`, { params }),
  send: (id, payload) => api.post(`/messages/conversations/${id}/messages`, payload),
  start: (payload) => api.post('/messages/conversations', payload),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsApi = {
  platform: () => api.get('/analytics/platform'),
  buyerDashboard: () => api.get('/analytics/buyer/dashboard'),
  procurement: (months = 12) => api.get('/analytics/buyer/procurement', { params: { months } }),
  supplierDashboard: () => api.get('/analytics/supplier/dashboard'),
  adminDashboard: () => api.get('/analytics/admin/dashboard'),
};

export const adminApi = {
  companies: (params) => api.get('/admin/companies', { params }),
  setCompanyStatus: (id, status) => api.patch(`/admin/companies/${id}/status`, { status }),
  suppliers: (params) => api.get('/admin/suppliers', { params }),
  verificationQueue: (params) => api.get('/admin/verification-queue', { params }),
  users: (params) => api.get('/admin/users', { params }),
  setUserActive: (id, isActive) => api.patch(`/admin/users/${id}/active`, { isActive }),
  rfqs: (params) => api.get('/admin/rfqs', { params }),
  commissions: (params) => api.get('/admin/commissions', { params }),
  commissionTotals: (params) => api.get('/admin/commissions/totals', { params }),
  createCategory: (payload) => api.post('/admin/categories', payload),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}`, payload),
  removeCategory: (id) => api.delete(`/admin/categories/${id}`),
};
