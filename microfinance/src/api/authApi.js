import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (email, password) => api.post('/auth/login', { email, password }),
  logout:   () => api.post('/auth/logout'),
};
