import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api, { authApi } from '../api/axiosConfig'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      vendorId: null,
      vendorStatus: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false, 

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          const { user, accessToken, refreshToken } = response.data.data

          
          localStorage.setItem('token', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          
          let vendorId = null
          let vendorStatus = null
          if (user.role === 'VENDOR') {
            vendorId = user.vendorId || null
            vendorStatus = user.vendorStatus || null
          }

          set({
            user,
            token: accessToken,
            vendorId,
            vendorStatus,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true
          })
          return { success: true }
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(userData)
          const { user, accessToken, refreshToken } = response.data.data

          
          localStorage.setItem('token', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          
          let vendorId = null
          let vendorStatus = null
          if (user.role === 'VENDOR') {
            vendorId = user.vendorId || null
            vendorStatus = user.vendorStatus || null
          }

          set({
            user,
            token: accessToken,
            vendorId,
            vendorStatus,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true
          })
          return { success: true }
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          })
          return { success: false, error: error.response?.data?.message }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout API error:', error)
        } finally {
          
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')

          
          set({
            user: null,
            token: null,
            vendorId: null,
            vendorStatus: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: false
          })
        }
      },

      checkAuth: async () => {
        const { isLoading, isInitialized } = get()

        
        
        const storedToken = localStorage.getItem('token')
        const persistedState = localStorage.getItem('auth-storage')
        let persistedAuth = false

        if (persistedState) {
          try {
            const parsed = JSON.parse(persistedState)
            persistedAuth = parsed.state?.isAuthenticated === true
          } catch (e) {
            
          }
        }

        
        if (isInitialized && persistedAuth && storedToken) {
          return { success: true, redundant: true }
        }

        
        if (isLoading) {
          return { success: persistedAuth, redundant: true }
        }

        
        if (!storedToken) {
          set({
            user: null,
            token: null,
            vendorId: null,
            vendorStatus: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true
          })
          return { success: false }
        }

        try {
          set({ isLoading: true })
          const response = await authApi.getProfile()
          const user = response.data.data || response.data.user || response.data

          
          let vendorId = null
          let vendorStatus = null
          if (user.role === 'VENDOR') {
            vendorId = user.vendorId || null
            vendorStatus = user.vendorStatus || null
          }

          set({
            user,
            token: storedToken,
            vendorId,
            vendorStatus,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true
          })
          return { success: true }
        } catch (error) {
          
          if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              try {
                const refreshResponse = await api.post('/auth/refresh', { refreshToken })
                const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data || refreshResponse.data

                localStorage.setItem('token', accessToken)
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken)
                }

                
                const profileResponse = await authApi.getProfile()
                const user = profileResponse.data.data || profileResponse.data.user || profileResponse.data

                let vendorId = null
                let vendorStatus = null
                if (user.role === 'VENDOR') {
                  vendorId = user.vendorId || null
                  vendorStatus = user.vendorStatus || null
                }

                set({
                  user,
                  token: accessToken,
                  vendorId,
                  vendorStatus,
                  isAuthenticated: true,
                  isLoading: false,
                  isInitialized: true
                })
                return { success: true, refreshed: true }
              } catch (refreshError) {
                
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                set({
                  user: null,
                  token: null,
                  vendorId: null,
                  vendorStatus: null,
                  isAuthenticated: false,
                  isLoading: false,
                  isInitialized: true
                })
                return { success: false }
              }
            }
          }

          
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          set({
            user: null,
            token: null,
            vendorId: null,
            vendorStatus: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true
          })
          return { success: false }
        }
      },

      clearError: () => set({ error: null }),

      
      forceLogout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          token: null,
          vendorId: null,
          vendorStatus: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isInitialized: false
        })
      },

      
      resetInit: () => set({ isInitialized: false }),

      
      isVendorRequest: () => {
        const { user } = get()
        return user?.role === 'VENDOR'
      },

      
      isVendorActive: () => {
        const { user, vendorStatus } = get()
        return user?.role === 'VENDOR' && vendorStatus === 'ACTIVE'
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        vendorId: state.vendorId,
        vendorStatus: state.vendorStatus,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)


if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    const { forceLogout } = useAuthStore.getState()
    forceLogout()
  })
}

