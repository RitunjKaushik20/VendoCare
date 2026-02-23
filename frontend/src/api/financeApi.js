import api from './axiosConfig'

export const financeApi = {
  
  getDashboard: () => api.get('/finance/dashboard'),
  
  getLiveStats: () => api.get('/finance/dashboard/stats'),
  
  
  getPayableQueue: (params = {}) => api.get('/finance/payable-queue', { params }),
  
  
  getOverdueInvoices: () => api.get('/finance/overdue-invoices'),
  
  
  getAgingAnalysis: () => api.get('/finance/aging-analysis'),
  
  
  getVendorLedger: () => api.get('/finance/vendor-ledger'),
  getVendorLedgerById: (vendorId) => api.get(`/finance/vendor-ledger/${vendorId}`),
  
  
  getRecentPayments: (limit = 10) => api.get('/finance/payments/recent', { params: { limit } }),
  
  getPaymentHistory: (params = {}) => api.get('/finance/payments/history', { params }),
  
  processPayment: (invoiceId, data) => api.post(`/finance/payments/process/${invoiceId}`, data),
  
  
  getMonthlySpend: (month = null, year = null) => {
    const params = {}
    if (month) params.month = month
    if (year) params.year = year
    return api.get('/finance/monthly-spend', { params })
  },
  
  
  getGstSummary: () => api.get('/finance/gst-summary'),
  
  
  getTotalOutstanding: () => api.get('/finance/total-outstanding'),
}

