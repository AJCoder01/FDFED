import { apiClient } from './apiClient.js';

function toQueryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const bookingsRepository = {
  fetchBookings: (params = {}) =>
    apiClient.get(`/bookings${toQueryString(params)}`),
  fetchBookingById: (bookingId) =>
    apiClient.get(`/bookings/${bookingId}`),
  fetchAvailableSlots: ({ serviceId, date, excludeId }) =>
    apiClient.get(`/bookings/available-slots${toQueryString({ serviceId, date, excludeId })}`),
  createBooking: (values) =>
    apiClient.post('/bookings', values),
  updateBookingStatus: ({ bookingId, status, note, expectedStatus }) =>
    apiClient.patch(`/bookings/${bookingId}/status`, { status, note, expectedStatus }),
  proposeBookingTime: ({ bookingId, date, slot }) =>
    apiClient.post(`/bookings/${bookingId}/propose-time`, { date, slot }),
  respondToTimeProposal: ({ bookingId, accept }) =>
    apiClient.post(`/bookings/${bookingId}/respond-time`, { accept }),
  deleteBooking: (bookingId) =>
    apiClient.delete(`/bookings/${bookingId}`),
};
