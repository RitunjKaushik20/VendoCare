import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  FileUp,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Upload,
  Eye,
  Download,
  RefreshCw,
  Bell,
  BellRing
} from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { StatCard } from '../../components/ui/StatCard'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { formatCurrency, formatTimeAgo, formatDate, ROLE_DISPLAY_NAMES } from '../../utils/constants'
import { useAuthStore } from '../../store/authStore'
import { useLiveDashboardStats, useLiveNotifications } from '../../hooks/useRealTime'
import { useSocket } from '../../hooks/useSocket'
import api from '../../api/axiosConfig'

export const VendorDashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()


  const [contracts, setContracts] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)


  const statsData = useLiveDashboardStats(10000)

  const notificationsData = useLiveNotifications(30000)


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)


      const dashboardResponse = await api.get('/vendor/dashboard')
      const dashboardData = dashboardResponse?.data?.data || dashboardResponse?.data || {};

      setContracts(dashboardData.contracts || [])
      setInvoices(dashboardData.invoices || [])
      setPayments(dashboardData.payments || [])
      setLastUpdated(new Date())

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])


  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/vendor/dashboard/notifications')
      const notifs = response.data.data || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.isRead).length)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])


  useEffect(() => {
    fetchDashboardData()
    fetchNotifications()
  }, [fetchDashboardData, fetchNotifications])


  useSocket(api.defaults.baseURL?.replace('/api', '') || 'https://vendocare-api.onrender.com', {
    'invoice_created': () => {
      fetchDashboardData()
      fetchNotifications()
    },
    'contract_created': () => {
      fetchDashboardData()
      fetchNotifications()
    },
    'payment:completed': () => {
      fetchDashboardData()
      fetchNotifications()
    },
    'invoice:status-changed': () => {
      fetchDashboardData()
      fetchNotifications()
    }
  });


  useEffect(() => {
    if (notificationsData.data) {
      const notifs = notificationsData.data || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.isRead).length)
    }
  }, [notificationsData.data])


  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/vendor/dashboard/notifications/${notificationId}/read`)
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }


  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/vendor/dashboard/notifications/read-all')
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }


  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'EXPIRING': return 'bg-yellow-500/20 text-yellow-400'
      case 'EXPIRED': return 'bg-red-500/20 text-red-400'
      case 'PAID': return 'bg-green-500/20 text-green-400'
      case 'APPROVED': return 'bg-blue-500/20 text-blue-400'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'REJECTED': return 'bg-red-500/20 text-red-400'
      case 'OVERDUE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }


  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'PENDING':
      case 'EXPIRING':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'REJECTED':
      case 'OVERDLE':
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }


  const stats = statsData.data || {
    pendingInvoices: 0,
    pendingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    paidThisMonth: 0,
    activeContracts: 0,
    expiringContracts: 0,
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
            <p className="text-light/60">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        { }
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-light">Vendor Portal</h1>
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium">
                  {ROLE_DISPLAY_NAMES[user?.role] || 'Vendor'}
                </span>
              </div>
              <p className="text-light/60">Welcome back, {user?.companyName || user?.name || 'Vendor'}</p>
              {lastUpdated && (
                <p className="text-light/40 text-sm mt-1 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Last updated: {formatTimeAgo(lastUpdated)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            { }
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 rounded-xl bg-dark/50 border border-softPurple/30 hover:border-purple/50 transition-colors"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-5 h-5 text-purple" />
                ) : (
                  <Bell className="w-5 h-5 text-light/70" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              { }
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 w-80 bg-dark/95 backdrop-blur-xl border border-softPurple/30 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-softPurple/20 flex items-center justify-between">
                    <h3 className="text-light font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-purple text-sm hover:text-softPurple transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                          className={`p-4 border-b border-softPurple/10 cursor-pointer hover:bg-purple/5 transition-colors ${!notification.isRead ? 'bg-purple/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${notification.isRead ? 'bg-gray-500' : 'bg-purple'}`} />
                            <div className="flex-1">
                              <p className="text-light font-medium text-sm">{notification.title}</p>
                              <p className="text-light/60 text-xs mt-1">{notification.message}</p>
                              <p className="text-light/40 text-xs mt-2">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-light/20 mx-auto mb-4" />
                        <p className="text-light/60">No notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatedButton
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/settings')}
            >
              <Eye className="w-4 h-4" />
              View Profile
            </AnimatedButton>
            <AnimatedButton
              className="flex items-center gap-2"
              onClick={() => navigate('/invoices')}
            >
              <Upload className="w-4 h-4" />
              Submit Invoice
            </AnimatedButton>
          </div>
        </div>

        { }
        {error && (
          <GlassCard className="border-red-500/30 bg-red-500/5" hover={false}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-light/80">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="ml-auto text-purple hover:text-softPurple text-sm"
              >
                Retry
              </button>
            </div>
          </GlassCard>
        )}

        { }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Contracts"
            value={stats.activeContracts || contracts.filter(c => (c.calculatedStatus || c.status) === 'ACTIVE').length}
            subtitle="Current agreements"
            icon={FileText}
            trend={stats.expiringContracts > 0 ? `${stats.expiringContracts} expiring` : null}
            trendUp={stats.expiringContracts > 0}
            delay={0}
            loading={statsData.loading}
          />
          <StatCard
            title="Pending Invoices"
            value={stats.pendingInvoices || invoices.filter(i => i.status === 'PENDING').length}
            subtitle={formatCurrency(stats.pendingAmount || 0)}
            icon={FileUp}
            trend="Awaiting approval"
            trendUp={true}
            delay={0.1}
            loading={statsData.loading}
          />
          <StatCard
            title="Overdue Invoices"
            value={stats.overdueCount || invoices.filter(i => i.status === 'OVERDUE').length}
            subtitle={formatCurrency(stats.overdueAmount || 0)}
            icon={Clock}
            trend={stats.overdueCount > 0 ? "Action needed" : null}
            trendUp={false}
            delay={0.2}
            loading={statsData.loading}
          />
          <StatCard
            title="Paid This Month"
            value={formatCurrency(stats.paidThisMonth || 0)}
            subtitle="Received"
            icon={IndianRupee}
            trend="+0%"
            trendUp={true}
            delay={0.3}
            loading={statsData.loading}
          />
        </div>

        { }
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          { }
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">My Active Contracts</h3>
              <Link
                to="/contracts"
                className="text-purple hover:text-softPurple text-sm transition-colors no-underline"
              >
                View All
              </Link>
            </div>

            {contracts.filter(c => (c.calculatedStatus || c.status) === 'ACTIVE').length > 0 ? (
              <div className="space-y-4">
                {contracts.filter(c => (c.calculatedStatus || c.status) === 'ACTIVE').slice(0, 3).map((contract, i) => (
                  <motion.div
                    key={contract.id}
                    className="p-4 rounded-xl bg-dark/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-light font-medium">{contract.title}</p>
                        <p className="text-light/50 text-sm">
                          {contract.endDate ? `Ends: ${formatDate(contract.endDate)}` : 'Active'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contract.calculatedStatus || contract.status)}`}>
                        {contract.calculatedStatus || contract.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-light/60">Contract Value</span>
                      <span className="text-light font-medium">{formatCurrency(contract.amount)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No active contracts</p>
                <p className="text-light/40 text-sm mt-1">Contracts will appear here when created</p>
              </div>
            )}
          </GlassCard>

          { }
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Recent Invoices</h3>
              <Link
                to="/invoices"
                className="text-purple hover:text-softPurple text-sm transition-colors no-underline"
              >
                View All
              </Link>
            </div>

            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.slice(0, 3).map((invoice, i) => (
                  <motion.div
                    key={invoice.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-light font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-light/50 text-sm">{invoice.description || 'Invoice'}</p>
                      <p className="text-light/40 text-xs">{formatTimeAgo(invoice.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-light font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      <span className={`text-xs flex items-center gap-1 ${getStatusColor(invoice.status).replace('bg-', 'text-').replace('/20', '')}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileUp className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No invoices yet</p>
                <p className="text-light/40 text-sm mt-1">Submit your first invoice to see it here</p>
              </div>
            )}
          </GlassCard>
        </div>

        { }
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Recent Payments</h3>
              <Link
                to="/payments"
                className="text-purple hover:text-softPurple text-sm transition-colors no-underline"
              >
                View All
              </Link>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.slice(0, 3).map((payment, i) => (
                  <motion.div
                    key={payment.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-light font-medium">{payment.transactionId || 'Payment'}</p>
                      <p className="text-light/50 text-sm">{payment.method || 'Bank Transfer'}</p>
                      <p className="text-light/40 text-xs">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-light font-medium">{formatCurrency(payment.amount)}</p>
                      <span className="text-green-400 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {payment.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IndianRupee className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No payments yet</p>
                <p className="text-light/40 text-sm mt-1">Payments will appear here when processed</p>
              </div>
            )}
          </GlassCard>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light mb-4">Vendor Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/invoices"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline block"
              >
                <Upload className="w-5 h-5 text-purple" />
                <span>Submit New Invoice</span>
              </Link>
              <Link
                to="/contracts"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline block"
              >
                <FileText className="w-5 h-5 text-purple" />
                <span>View My Contracts</span>
              </Link>
              <Link
                to="/payments"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline block"
              >
                <Eye className="w-5 h-5 text-purple" />
                <span>Check Payment Status</span>
              </Link>
              <Link
                to="/reports"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline block"
              >
                <Download className="w-5 h-5 text-purple" />
                <span>Download Reports</span>
              </Link>
              <Link
                to="/settings"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline block"
              >
                <Truck className="w-5 h-5 text-purple" />
                <span>Update Profile</span>
              </Link>
            </div>
          </div>
        </div>

        { }
        {(stats.pendingInvoices > 0 || stats.overdueCount > 0) && (
          <GlassCard className="border-yellow-500/30 bg-yellow-500/5" hover={false}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-light">Pending Actions</h3>
                <p className="text-light/60">
                  You have {stats.pendingInvoices} invoice(s) pending approval and {stats.overdueCount} overdue
                </p>
              </div>
              <AnimatedButton
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                onClick={() => navigate('/invoices')}
              >
                View Details
              </AnimatedButton>
            </div>
          </GlassCard>
        )}

        { }
        {stats.expiringContracts > 0 && (
          <GlassCard className="border-orange-500/30 bg-orange-500/5" hover={false}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-light">Contracts Expiring Soon</h3>
                <p className="text-light/60">
                  You have {stats.expiringContracts} contract(s) expiring within 7 days
                </p>
              </div>
              <AnimatedButton
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                onClick={() => navigate('/contracts')}
              >
                View Contracts
              </AnimatedButton>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  )
}

export default VendorDashboard;

