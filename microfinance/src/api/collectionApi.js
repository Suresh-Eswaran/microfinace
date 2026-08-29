import api from './api';

export const collectionApi = {
  record:           (data) => api.post('/collections', data),
  getAll:           ()     => api.get('/collections/all'),
  dashboard:        ()     => api.get('/collections/dashboard'),
  overdue:          ()     => api.get('/collections/overdue'),
  calendar:         ()     => api.get('/collections/calendar'),
  groupPayment:     (data) => api.post('/collections/group-payment', data),
  reconcile:        (data) => api.post('/collections/reconcile', data),
  overdueEscalation:()     => api.post('/collections/overdue-escalation'),
  requestWaiver:    (data) => api.post('/collections/waiver/request', data),
  approveWaiver:    (id)   => api.post(`/collections/waiver/${id}/approve`),
  getReceipt:       (id)   => api.get(`/collections/receipt/${id}`),
};
