import api from './axiosConfig'

export const adminApi = {
  
  getDashboard: () => api.get('/admin/dashboard'),
  
  getLiveStats: () => api.get('/admin/dashboard/stats'),
  
  getFinancialSummary: () => api.get('/admin/dashboard/financials'),
  
  getOutstandingInvoices: () => api.get('/admin/dashboard/outstanding-invoices'),
  
  getExpiringContracts: (days = 7) => api.get('/admin/dashboard/expiring-contracts', { params: { days } }),
  
  getVendorFinancials: (vendorId = null) => {
    const url = vendorId 
      ? `/admin/dashboard/vendor-financials/${vendorId}`
      : '/admin/dashboard/vendor-financials'
    return api.get(url)
  },
  
  getActivities: (limit = 20) => api.get('/admin/dashboard/activities', { params: { limit } }),
  
  getMonthlySpend: (year = new Date().getFullYear()) => api.get('/admin/dashboard/monthly-spend', { params: { year } }),
  
  checkVendorDelete: (vendorId) => api.get(`/admin/dashboard/check-vendor-delete/${vendorId}`),
  
  
  getAuditLogs: (params = {}) => api.get('/audit/logs', { params }),
  
  getEntityAuditLogs: (entity, entityId) => api.get(`/audit/entity/${entity}/${entityId}`),
  
  getUserAuditLogs: (userId, limit = 50) => api.get(`/audit/user/${userId}`, { params: { limit } }),
  
  getAuditStats: (days = 30) => api.get('/audit/stats', { params: { days } }),
}

