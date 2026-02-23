import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from '../components/common/LoadingSpinner'
import { hasPermission } from '../utils/constants'

export const RoleGuard = ({ 
  children, 
  requiredRole = null,
  requiredPermission = null,
  fallback = '/dashboard'
}) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore()
  const location = useLocation()
  
  
  const hasToken = localStorage.getItem('token') !== null

  
  if (isLoading && !isInitialized && hasToken) {
    return <PageLoader />
  }

  if (!isInitialized) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  
  if (requiredRole && user?.role?.toUpperCase() !== requiredRole.toUpperCase()) {
    return <Navigate to={fallback} replace />
  }

  
  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <Navigate to={fallback} replace />
  }

  return children
}


export const AdminRoute = ({ children }) => (
  <RoleGuard requiredRole="Admin" fallback="/dashboard">
    {children}
  </RoleGuard>
)

export const FinanceRoute = ({ children }) => (
  <RoleGuard requiredRole="Finance" fallback="/dashboard">
    {children}
  </RoleGuard>
)

export const VendorRoute = ({ children }) => (
  <RoleGuard requiredRole="Vendor" fallback="/dashboard">
    {children}
  </RoleGuard>
)
