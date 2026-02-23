import api from './axiosConfig'

export const contractsApi = {
  
  getContracts: (params = {}) => api.get('/contracts', { params }),
  
  
  getMyContracts: () => api.get('/contracts/my'),
  
  
  getContractById: (id) => api.get(`/contracts/${id}`),
  
  
  createContract: (data) => api.post('/contracts', data),
  
  
  updateContract: (id, data) => api.put(`/contracts/${id}`, data),
  
  
  deleteContract: (id) => api.delete(`/contracts/${id}`),
  
  
  renewContract: (id, data) => api.put(`/contracts/${id}/renew`, data),
  
  
  terminateContract: (id) => api.put(`/contracts/${id}/terminate`),
  
  
  getExpiringContracts: (days = 30) => api.get(`/contracts/list/expiring`, { params: { days } }),
  
  
  getExpiredContracts: () => api.get('/contracts/list/expired'),
}

