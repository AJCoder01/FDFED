import { apiClient } from './apiClient.js';

export const usersRepository = {
  fetchAccounts: () => apiClient.get('/users/accounts'),
  createAccount: (userData) => apiClient.post('/users/accounts', userData),
  fetchUserById: (userId) => apiClient.get(`/users/${userId}`),
  fetchProviders: () => apiClient.get('/users/providers'),
  fetchProviderById: (providerId) => apiClient.get(`/users/providers/${providerId}`),
  fetchCustomerById: (customerId) => apiClient.get(`/users/customers/${customerId}`),
  updateProfile: (userId, updates) => apiClient.patch(`/users/${userId}/profile`, updates),
  saveCustomerAddresses: (customerId, addresses) =>
    apiClient.put(`/users/customers/${customerId}/addresses`, { addresses }),
  saveProvider: (providerId, values, submit = false) =>
    apiClient.patch(`/users/providers/${providerId}`, { values, submit }),
  moderateProvider: (providerId, status, reason) =>
    apiClient.patch(`/users/providers/${providerId}/moderate`, { status, reason }),
  saveAvailability: (providerId, schedule) =>
    apiClient.put(`/users/providers/${providerId}/availability`, { schedule }),
  deleteAccount: (userId) => apiClient.delete(`/users/${userId}`),
};
