import api from './api';

function getToken() {
  return localStorage.getItem('mf_token');
}

export const clientApi = {
  register: (data) => api.post('/clients', data),
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  verifyKyc: (data) => api.post('/kyc/verify', data),
  cibilEnquiry: (data) => api.post('/cibil/enquiry', data),
  verifyIncome: (id, data) => api.post(`/clients/${id}/verify-income`, data),
  assessCredit: (id) => api.post(`/clients/${id}/assess-credit`),
  overrideScore: (id, data) => api.put(`/clients/${id}/override-score`, data),
  creditReport: (id) => api.get(`/clients/${id}/credit-report`),

  /** Downloads the credit report as a PDF blob. */
  downloadCreditReport: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/clients/${id}/credit-report/download`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.blob();
  },
};

