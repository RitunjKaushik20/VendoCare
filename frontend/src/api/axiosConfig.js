import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://vendocare-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})


let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}


let hasNavigatedToLogin = false


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config


    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }


    if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {

      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')


      if (!hasNavigatedToLogin) {
        hasNavigatedToLogin = true

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth:logout'))
          hasNavigatedToLogin = false
        }, 100)
      }
      return Promise.reject(error)
    }


    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://vendocare-api.onrender.com/api'}/auth/refresh`,
        { refreshToken }
      )

      const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data


      localStorage.setItem('token', accessToken)
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken)
      }


      originalRequest.headers.Authorization = `Bearer ${accessToken}`


      processQueue(null, accessToken)


      hasNavigatedToLogin = false


      return api(originalRequest)
    } catch (refreshError) {

      processQueue(refreshError, null)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')


      hasNavigatedToLogin = false



      if (!hasNavigatedToLogin && !window.location.pathname.includes('/login')) {
        hasNavigatedToLogin = true
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth:logout'))
          hasNavigatedToLogin = false
        }, 100)
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)


window.addEventListener('auth:logout', () => {

  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')


  if (!window.location.pathname.includes('/login')) {

    window.location.replace('/login')
  }
})

export default api




export const unwrapResponse = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data
  }
  return response?.data
}


export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
}

