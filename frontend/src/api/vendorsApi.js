import api from './axiosConfig'

export const vendorsApi = {
  
  getVendors: (params = {}) => api.get('/vendors', { params }),
  
  
  getVendorById: (id) => api.get(`/vendors/${id}`),
  
  
  createVendor: (data) => api.post('/vendors', data),
  
  
  updateVendor: (id, data) => api.put(`/vendors/${id}`, data),
  
  
  deleteVendor: (id) => api.delete(`/vendors/${id}`),
  
  
  getVendorStats: (id) => api.get(`/vendors/${id}/stats`),
  
  
  getVendorsByCategory: (category) => api.get(`/vendors/category/${category}`),
  
  
  getMyVendor: () => api.get('/vendors/me'),
}

