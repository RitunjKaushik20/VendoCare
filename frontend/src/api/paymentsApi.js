import api from './axiosConfig'


export const paymentsApi = {
  getPayments: (params = {}) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  processPayment: (data) => api.post('/payments', data), 
  deletePayment: (id) => api.delete(`/payments/${id}`),
  updatePaymentStatus: (id, status) => api.put(`/payments/${id}`, { status }),
  refundPayment: (id, data) => api.post(`/payments/refund/${id}`, data),
  
  
  initiateRazorpayPayment: (invoiceId) => api.post('/payments/razorpay/initiate', { invoiceId }),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data),
  
  
  getPaymentsByVendor: (vendorId) => api.get(`/payments/vendor/${vendorId}`),
  getPaymentByInvoice: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
  getPaymentHistory: (params = {}) => api.get('/payments/history', { params }),
  getPaymentStats: () => api.get('/payments/stats'),
}

