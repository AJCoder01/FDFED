import { apiClient } from './apiClient.js';

export const platformRepository = {
  fetchHealth: () => apiClient.get('/platform/health'),
  fetchActivityLogs: (userId) =>
    apiClient.get(userId ? `/platform/activity-logs?userId=${encodeURIComponent(userId)}` : '/platform/activity-logs'),
  createActivityLog: (entry) => apiClient.post('/platform/activity-logs', entry),
  updateActivityLog: ({ id, ...data }) => apiClient.patch(`/platform/activity-logs/${id}`, data),
  deleteActivityLog: (id) => apiClient.delete(`/platform/activity-logs/${id}`),
  fetchStats: () => apiClient.get('/platform/stats'),
  resetDemo: () => apiClient.post('/platform/reset-demo', {}),
};
