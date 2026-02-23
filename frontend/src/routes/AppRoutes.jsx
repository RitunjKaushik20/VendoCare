import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'


import { LandingPage } from '../pages/landing/LandingPage'


import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'


import { DashboardHome } from '../pages/dashboard/DashboardHome'
import { AdminDashboard } from '../pages/dashboard/AdminDashboard'
import { FinanceDashboard } from '../pages/dashboard/FinanceDashboard'
import { VendorDashboard } from '../pages/dashboard/VendorDashboard'
import { Vendors } from '../pages/dashboard/Vendors'
import { Contracts } from '../pages/dashboard/Contracts'
import { Invoices } from '../pages/dashboard/Invoices'
import { Payments } from '../pages/dashboard/Payments'
import { Reports } from '../pages/dashboard/Reports'
import { Settings } from '../pages/dashboard/Settings'
import { AuditLogs } from '../pages/dashboard/AuditLogs'


import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RoleGuard } from './RoleGuard'

export const AppRoutes = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          }
        />
        
        {}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard requiredRole="Admin">
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/finance/dashboard"
          element={
            <RoleGuard requiredRole="Finance">
              <FinanceDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/vendor/dashboard"
          element={
            <RoleGuard requiredRole="Vendor">
              <VendorDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Vendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <Contracts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <RoleGuard requiredRole="Admin">
              <AuditLogs />
            </RoleGuard>
          }
        />

        {}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
