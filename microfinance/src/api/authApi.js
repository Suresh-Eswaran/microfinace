import api from './api';

export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  verifyEmailOtp: (email, otp) => api.post('/auth/verify-email-otp', { email, otp }),
  resendEmailOtp: (email) => api.post('/auth/resend-email-otp', { email }),
  login:          (email, password) => api.post('/auth/login', { email, password }),
  logout:         () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp:      (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword:  (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

