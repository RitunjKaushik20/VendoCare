import api from './axiosConfig'

export const invoicesApi = {
  
  getInvoices: (params = {}) => api.get('/invoices', { params }),
  
  
  getMyInvoices: () => api.get('/invoices/my'),
  
  
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  
  
  createInvoice: (data) => api.post('/invoices', data),
  
  
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  
  
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  
  
  uploadInvoice: (formData, config) => api.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }),
  
  
  downloadInvoice: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  
  
  updateInvoiceStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  
  
  approveInvoice: (id) => api.post(`/invoices/${id}/approve`),
  
  
  rejectInvoice: (id, reason) => api.post(`/invoices/${id}/reject`, { reason }),
  
  
  getPendingInvoices: () => api.get('/invoices/list/pending'),
  
  
  getOverdueInvoices: () => api.get('/invoices/list/overdue'),
  
  
  getInvoiceStats: () => api.get('/invoices/stats'),
  
  
  sendPaymentReminder: (id) => api.post(`/invoices/${id}/remind`),
}

