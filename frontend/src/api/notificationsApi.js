import api from './axiosConfig'


export const notificationsApi = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  getPreferences: () => api.get('/notifications/preferences'),
}
