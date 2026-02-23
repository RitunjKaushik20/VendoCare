import api, { unwrapResponse } from './axiosConfig'


export const reportsApi = {
  
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard')
    return unwrapResponse(response)
  },
  
  
  getSpendingReport: async (params = {}) => {
    const response = await api.get('/reports/spending', { params })
    return unwrapResponse(response)
  },
  
  
  getOverdueReport: async () => {
    const response = await api.get('/reports/overdue')
    return unwrapResponse(response)
  },
  
  
  getTaxReport: async (params = {}) => {
    const response = await api.get('/reports/taxes', { params })
    return unwrapResponse(response)
  },
  
  
  getVendorWiseReport: async () => {
    const response = await api.get('/reports/vendor-wise')
    return unwrapResponse(response)
  },
  
  
  getContractWiseReport: async () => {
    const response = await api.get('/reports/contract-wise')
    return unwrapResponse(response)
  },
  
  
  getRecentActivities: async (limit = 10) => {
    const response = await api.get('/reports/activities', { params: { limit } })
    return unwrapResponse(response)
  },
  
  
  exportToCsv: async (reportType, params = {}) => {
    const response = await api.get(`/reports/export/csv/${reportType}`, { 
      params,
      responseType: 'blob'
    })
    return response
  },
}


export const formatSpendingReport = (data) => {
  if (!data || !data.vendorSpending) return []
  
  return data.vendorSpending.map(item => ({
    vendorId: item.vendor?.id,
    vendorName: item.vendor?.name || 'N/A',
    category: item.vendor?.category || 'N/A',
    totalAmount: item.total || 0,
    paymentCount: item.count || 0,
  }))
}


export const formatOverdueReport = (data) => {
  if (!data || !data.invoices || !Array.isArray(data.invoices)) return []
  
  const now = new Date()
  return data.invoices.map(inv => ({
    id: inv.id || '',
    invoiceNumber: inv.invoiceNumber || 'N/A',
    vendorName: inv.vendor?.name || 'N/A',
    amount: inv.totalAmount || 0,
    dueDate: inv.dueDate || now.toISOString(),
    daysOverdue: inv.dueDate 
      ? Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      : 0,
  }))
}


export const formatTaxReport = (data) => {
  if (!data) {
    return {
      totalInvoices: 0,
      taxableAmount: 0,
      gstAmount: 0,
      totalWithGst: 0,
      breakdown: [],
    }
  }
  
  const breakdown = []
  const gstBreakdown = data.gstRateBreakdown || {}
  
  Object.entries(gstBreakdown).forEach(([rate, item]) => {
    breakdown.push({
      rate: `${rate}% GST`,
      taxableAmount: item.amount || 0,
      gstAmount: item.gst || 0,
      total: (item.amount || 0) + (item.gst || 0),
      count: item.count || 0,
    })
  })
  
  return {
    totalInvoices: data.invoices || 0,
    taxableAmount: data.totalAmount || 0,
    gstAmount: data.totalGst || 0,
    totalWithGst: (data.totalAmount || 0) + (data.totalGst || 0),
    breakdown,
  }
}


export const safeApiCall = async (apiFunction, defaultValue = null) => {
  try {
    const data = await apiFunction()
    return data || defaultValue
  } catch (error) {
    console.error('API call failed:', error)
    return defaultValue
  }
}

