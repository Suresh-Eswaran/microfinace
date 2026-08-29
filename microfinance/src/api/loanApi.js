import api from './api';

export const loanApi = {
  apply:           (data)   => api.post('/loans/apply', data),
  getAll:          ()       => api.get('/loans'),
  getById:         (id)     => api.get(`/loans/${id}`),
  approve:         (id)     => api.put(`/loans/${id}/approve`),
  reject:          (id, data) => api.put(`/loans/${id}/reject`, data),
  disburse:        (id)     => api.post(`/loans/${id}/disburse`),
  getByClient:     (id)     => api.get(`/loans/client/${id}`),
  getTimeline:     (id)     => api.get(`/loans/${id}/timeline`),
  generateEmiSchedule: (id) => api.post(`/emi/generate/${id}`),
  getEmiSchedule:  (loanId) => api.get(`/emi/schedule/${loanId}`),
  getOverdue:      ()       => api.get('/collections/overdue'),
  getReceipt:      (id)     => api.get(`/emi/receipt/${id}`),
  getDeliberations:(id)     => api.get(`/loans/${id}/deliberations`),
  restructure:     (id, data) => api.post(`/loans/${id}/restructure`, data),
  prepareDisbursement: (id) => api.post(`/loans/${id}/disbursement/prepare`),
  approveDisbursement: (id) => api.post(`/loans/${id}/disbursement/approve`),
};
