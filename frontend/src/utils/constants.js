
export const COLORS = {
  primary: '#A0D2EB',
  light: '#E5EAF5',
  softPurple: '#D0BDF4',
  purple: '#8458B3',
  dark: '#494D5F',
  darkBg: '#3a3d4f',
  darker: '#2d2f3f',
}


export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  vendors: {
    list: '/api/vendors',
    create: '/api/vendors',
    update: (id) => `/api/vendors/${id}`,
    delete: (id) => `/api/vendors/${id}`,
    details: (id) => `/api/vendors/${id}`,
  },
  contracts: {
    list: '/api/contracts',
    create: '/api/contracts',
    update: (id) => `/api/contracts/${id}`,
    delete: (id) => `/api/contracts/${id}`,
  },
  invoices: {
    list: '/api/invoices',
    create: '/api/invoices',
    update: (id) => `/api/invoices/${id}`,
    delete: (id) => `/api/invoices/${id}`,
  },
  payments: {
    list: '/api/payments',
    create: '/api/payments',
    process: '/api/payments/process',
  },
  reports: {
    spending: '/api/reports/spending',
    overdue: '/api/reports/overdue',
    taxes: '/api/reports/taxes',
  },
}


export const ROLES = {
  ADMIN: 'ADMIN',
  FINANCE: 'FINANCE',
  VENDOR: 'VENDOR',
}


export const ROLE_DISPLAY_NAMES = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.FINANCE]: 'Finance Manager',
  [ROLES.VENDOR]: 'Vendor',
}


export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full system access with user management',
  [ROLES.FINANCE]: 'Manage payments, invoices, and financial reports',
  [ROLES.VENDOR]: 'Access your contracts, invoices, and payment status',
}


export const INVOICE_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}


export const CONTRACT_STATUS = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  EXPIRING: 'Expiring',
}


export const PAYMENT_CYCLES = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One-time',
}


export const SIDEBAR_ITEMS_BY_ROLE = {
  [ROLES.ADMIN]: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'vendors', label: 'Vendors', icon: 'Users', path: '/vendors' },
    { id: 'contracts', label: 'Contracts', icon: 'FileText', path: '/contracts' },
    { id: 'invoices', label: 'Invoices', icon: 'FileUp', path: '/invoices' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard', path: '/payments' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
    { id: 'audit', label: 'Audit Logs', icon: 'ClipboardList', path: '/audit-logs' },
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
  [ROLES.FINANCE]: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'vendors', label: 'Vendors', icon: 'Users', path: '/vendors' },
    { id: 'contracts', label: 'Contracts', icon: 'FileText', path: '/contracts' },
    { id: 'invoices', label: 'Invoices', icon: 'FileUp', path: '/invoices' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard', path: '/payments' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
  [ROLES.VENDOR]: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'contracts', label: 'My Contracts', icon: 'FileText', path: '/contracts' },
    { id: 'invoices', label: 'My Invoices', icon: 'FileUp', path: '/invoices' },
    { id: 'payments', label: 'Payment Status', icon: 'CreditCard', path: '/payments' },
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
}


export const SIDEBAR_ITEMS = SIDEBAR_ITEMS_BY_ROLE[ROLES.ADMIN]


export const DASHBOARD_ROUTES = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.FINANCE]: '/dashboard',
  [ROLES.VENDOR]: '/dashboard',
}


export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canManageUsers: true,
    canManageVendors: true,
    canManageContracts: true,
    canManageInvoices: true,
    canProcessPayments: true,
    canViewAllReports: true,
    canAccessSettings: true,
    canViewAllVendors: true,
    canViewAllContracts: true,
    canViewAllInvoices: true,
  },
  [ROLES.FINANCE]: {
    canManageUsers: false,
    canManageVendors: true,
    canManageContracts: true,
    canManageInvoices: true,
    canProcessPayments: true,
    canViewAllReports: true,
    canAccessSettings: true,
    canViewAllVendors: true,
    canViewAllContracts: true,
    canViewAllInvoices: true,
  },
  [ROLES.VENDOR]: {
    canManageUsers: false,
    canManageVendors: false,
    canManageContracts: false,
    canManageInvoices: false,
    canProcessPayments: false,
    canViewAllReports: false,
    canAccessSettings: true,
    canViewAllVendors: false,
    canViewAllContracts: false,
    canViewAllInvoices: false,
    canSubmitInvoices: true,
    canViewOwnDataOnly: true,
  },
}


export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false
  return ROLE_PERMISSIONS[role][permission] || false
}


export const getSidebarItemsForRole = (role) => {
  
  const normalizedRole = role?.toUpperCase()
  return SIDEBAR_ITEMS_BY_ROLE[normalizedRole] || SIDEBAR_ITEMS_BY_ROLE[ROLES.ADMIN]
}


export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}


export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}


export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) {
    return 'Just now'
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  
  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  
  
  return formatDate(dateString)
}
