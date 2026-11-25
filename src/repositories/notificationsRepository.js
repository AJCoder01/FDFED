import { apiClient } from './apiClient.js';

export const notificationsRepository = {
  fetchNotifications: (userId) =>
    apiClient.get(userId ? `/notifications?userId=${encodeURIComponent(userId)}` : '/notifications'),
  createNotification: (payload) =>
    apiClient.post('/notifications', payload),
  markNotificationsRead: ({ userId, notificationId } = {}) =>
    apiClient.patch('/notifications/read', { userId, notificationId }),
  deleteNotification: (id) =>
    apiClient.delete(`/notifications/${id}`),
  clearNotifications: () =>
    apiClient.delete('/notifications'),
};
