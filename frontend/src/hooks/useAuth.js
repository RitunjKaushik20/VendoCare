import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const navigate = useNavigate()
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore()

  useEffect(() => {
    
    checkAuth()
  }, [])

  const handleLogin = async (credentials) => {
    const result = await login(credentials)
    if (result.success) {
      navigate('/dashboard')
    }
    return result
  }

  const handleRegister = async (userData) => {
    const result = await register(userData)
    if (result.success) {
      navigate('/dashboard')
    }
    return result
  }

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login')
    }
    return result
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  }
}

export const useRequireAuth = () => {
  const navigate = useNavigate()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    const verify = async () => {
      const result = await checkAuth()
      if (!result.success) {
        navigate('/login')
      }
    }
    verify()
  }, [navigate])
}

export const useRequireGuest = () => {
  const navigate = useNavigate()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    const verify = async () => {
      const result = await checkAuth()
      if (result.success) {
        navigate('/dashboard')
      }
    }
    verify()
  }, [navigate])
}
