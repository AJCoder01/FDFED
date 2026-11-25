import { apiClient } from './apiClient.js';

function toQueryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const marketplaceRepository = {
  fetchCategories: () => apiClient.get('/marketplace/categories'),
  createCategory: (data) => apiClient.post('/marketplace/categories', data),
  updateCategory: (id, data) => apiClient.patch(`/marketplace/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/marketplace/categories/${id}`),

  fetchServices: (filters = {}) =>
    apiClient.get(`/marketplace/services${toQueryString(filters)}`),
  fetchServiceById: (serviceId, actor = {}) =>
    apiClient.get(`/marketplace/services/${serviceId}${toQueryString({ role: actor.role })}`),
  createService: (values) => apiClient.post('/marketplace/services', values),
  updateService: (id, values) => apiClient.patch(`/marketplace/services/${id}`, values),
  deleteService: (serviceId) => apiClient.delete(`/marketplace/services/${serviceId}`),

  fetchServiceReviews: (serviceId) => apiClient.get(`/marketplace/services/${serviceId}/reviews`),
  submitReview: ({ bookingId, rating, comment }) =>
    apiClient.post('/marketplace/reviews', { bookingId, rating, comment }),
  replyToReview: ({ bookingId, reply }) =>
    apiClient.patch(`/marketplace/reviews/${bookingId}/reply`, { reply }),

  fetchJobRequests: () => apiClient.get('/marketplace/job-requests'),
  createJobRequest: (values) => apiClient.post('/marketplace/job-requests', values),
  deleteJobRequest: (id) => apiClient.delete(`/marketplace/job-requests/${id}`),
};
