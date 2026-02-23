import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from '../components/common/LoadingSpinner'

export const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, isLoading, isInitialized, checkAuth } = useAuthStore()
  const location = useLocation()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    
    if (!isInitialized && !hasCheckedAuth) {
      setHasCheckedAuth(true)
      checkAuth()
    }
  }, [isInitialized, hasCheckedAuth, checkAuth])

  
  if (isLoading && !isInitialized && restricted) {
    return <PageLoader />
  }

  
  if (isInitialized && isAuthenticated && restricted) {
    return <Navigate to="/dashboard" replace />
  }

  
  
  if (isInitialized) {
    return children
  }

  
  return <PageLoader />
}
