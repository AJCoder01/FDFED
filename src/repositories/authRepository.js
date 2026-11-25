import { apiClient } from './apiClient.js';

export const authRepository = {
  login: ({ email, password, expectedRole }) =>
    apiClient.post('/auth/login', { email, password, expectedRole }),

  signup: (userData) =>
    apiClient.post('/auth/signup', userData),

  fetchSession: () =>
    apiClient.get('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout', {}),

  demoSwitch: (targetRole) =>
    apiClient.post('/auth/demo-switch', { targetRole }),
};
