import api from './api';

export const clientApi = {
  register:      (data)       => api.post('/clients', data),
  getAll:        ()           => api.get('/clients'),
  getById:       (id)         => api.get(`/clients/${id}`),
  update:        (id, data)   => api.put(`/clients/${id}`, data),
  verifyKyc:     (data)       => api.post('/kyc/verify', data),
  cibilEnquiry:  (data)       => api.post('/cibil/enquiry', data),
  verifyIncome:  (id, data)   => api.post(`/clients/${id}/verify-income`, data),
  assessCredit:  (id)         => api.post(`/clients/${id}/assess-credit`),
  overrideScore: (id, data)   => api.put(`/clients/${id}/override-score`, data),
  creditReport:  (id)         => api.get(`/clients/${id}/credit-report`),
};
