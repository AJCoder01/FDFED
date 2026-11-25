import { apiClient } from './apiClient.js';

function toQueryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const governanceRepository = {
  fetchTickets: (params = {}) => apiClient.get(`/governance/tickets${toQueryString(params)}`),
  createTicket: (values) => apiClient.post('/governance/tickets', values),
  resolveTicket: ({ ticketId, outcome, notes }) =>
    apiClient.patch(`/governance/tickets/${ticketId}/resolve`, { outcome, notes }),
  deleteTicket: (ticketId) => apiClient.delete(`/governance/tickets/${ticketId}`),

  fetchDisputes: () => apiClient.get('/governance/disputes'),
  fetchDisputeById: (disputeId) => apiClient.get(`/governance/disputes/${disputeId}`),
  createDispute: (values) => apiClient.post('/governance/disputes', values),
  assignDispute: ({ disputeId, arbitrator }) =>
    apiClient.patch(`/governance/disputes/${disputeId}/assign`, { arbitrator }),
  saveDisputeResponse: ({ disputeId, providerId, statement, filename }) =>
    apiClient.patch(`/governance/disputes/${disputeId}/response`, { providerId, statement, filename }),
  scheduleHearing: ({ disputeId, values }) =>
    apiClient.patch(`/governance/disputes/${disputeId}/hearing`, values),
  issueRuling: ({ disputeId, values }) =>
    apiClient.patch(`/governance/disputes/${disputeId}/ruling`, values),
  deleteDispute: (disputeId) => apiClient.delete(`/governance/disputes/${disputeId}`),

  fetchArbitratorApplications: () => apiClient.get('/governance/arbitrator-applications'),
  submitArbitratorApplication: (values) => apiClient.post('/governance/arbitrator-applications', values),
  approveArbitratorApplication: (applicationId) =>
    apiClient.patch(`/governance/arbitrator-applications/${applicationId}/approve`, {}),
  rejectArbitratorApplication: ({ applicationId, reason }) =>
    apiClient.patch(`/governance/arbitrator-applications/${applicationId}/reject`, { reason }),
  deleteArbitratorApplication: (applicationId) =>
    apiClient.delete(`/governance/arbitrator-applications/${applicationId}`),
};
