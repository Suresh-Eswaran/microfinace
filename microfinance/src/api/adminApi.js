import api from './api';

export const adminApi = {
  dashboard:      () => api.get('/admin/dashboard'),
  health:         () => api.get('/admin/health'),
  auditLogs:      () => api.get('/admin/audit-logs/search'),
  integrations:   () => api.get('/admin/integrations'),
  bulkImport:     (csv) => api.post('/admin/bulk-import/clients', csv),
};

export const complianceApi = {
  cibilExport:  () => api.get('/compliance/cibil-export'),
  rbiExport:    () => api.get('/compliance/rbi-export'),
  mfinReport:   () => api.get('/compliance/mfin-report'),
  kycReminders: () => api.get('/compliance/kyc-reminders'),
  alerts:       () => api.get('/compliance/alerts'),
};

export const groupApi = {
  create:          (clientIds) => api.post('/groups/create', clientIds),
  getById:         (id)        => api.get(`/groups/${id}`),
  scheduleGrt:     (id)        => api.post(`/groups/${id}/grt/schedule`),
  passGrt:         (id, data)  => api.post(`/groups/${id}/grt/pass`, data),
  attendTraining:  (id)        => api.post(`/groups/${id}/training/attend`),
  liabilityHealth: (id)        => api.get(`/groups/${id}/liability-health`),
  savingsDeposit:  (data)      => api.post('/groups/savings/deposit', data),
  addMember:       (data)      => api.post('/groups/member/add', data),
  exitMember:      (data)      => api.post('/groups/member/exit', data),
  recordMeeting:   (data)      => api.post('/groups/meetings/record', data),
};

export const userApi = {
  getAll:         () => api.get('/users'),
  getById:        (id) => api.get(`/users/${id}`),
  profile:        () => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  approve:        (id)   => api.put(`/users/${id}/approve`),
  unlock:         (id)   => api.put(`/users/${id}/unlock`),
  setStatus:      (id, status) => api.put(`/users/${id}/status?status=${status}`),
  delete:         (id)   => api.delete(`/users/${id}`),
  auditLogs:      () => api.get('/users/audit-logs'),
};
