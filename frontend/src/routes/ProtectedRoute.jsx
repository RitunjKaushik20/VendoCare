import { useEffect, useCallback, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from '../components/common/LoadingSpinner'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized, checkAuth, user } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(false)

  
  const hasToken = localStorage.getItem('token') !== null

  const initAuth = useCallback(async () => {
    
    if (!isInitialized && !isChecking) {
      setIsChecking(true)
      await checkAuth()
      setIsChecking(false)
    }
  }, [isInitialized, isChecking, checkAuth])

  useEffect(() => {
    
    if (!isInitialized) {
      initAuth()
    }
  }, [initAuth, isInitialized])

  
  
  
  if (!isInitialized || isChecking) {
    return <PageLoader />
  }

  
  if (isAuthenticated && user) {
    return children
  }

  
  
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  
  
  return <Navigate to="/login" state={{ from: location }} replace />
}
