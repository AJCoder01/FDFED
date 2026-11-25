import { apiClient } from './apiClient.js';

export const financeRepository = {
  fetchWallet: () => apiClient.get('/finance/wallet'),
  topUpWallet: ({ amount, method }) => apiClient.post('/finance/wallet/topup', { amount, method }),
  withdrawWallet: ({ amount, destination }) => apiClient.post('/finance/wallet/withdraw', { amount, destination }),
  fetchRevenueStats: () => apiClient.get('/finance/revenue'),
  fetchLedgers: () => apiClient.get('/finance/ledgers'),
  fetchProviderEarnings: (providerId) => apiClient.get(`/finance/provider-earnings/${providerId}`),
  issueRefund: ({ bookingId, amount }) => apiClient.post('/finance/refunds', { bookingId, amount }),
  createLedger: (data) => apiClient.post('/finance/ledgers', data),
  updateLedger: (id, data) => apiClient.patch(`/finance/ledgers/${id}`, data),
  deleteLedger: (id) => apiClient.delete(`/finance/ledgers/${id}`),
};
