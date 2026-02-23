import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  FileText,
  FileUp,
  IndianRupee,
  TrendingUp,
  Shield,
  UserPlus,
  Settings,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  ChevronRight,
  Eye,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { StatCard } from '../../components/ui/StatCard'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { formatCurrency, formatTimeAgo, formatDate, ROLE_DISPLAY_NAMES } from '../../utils/constants'
import { useAuthStore } from '../../store/authStore'
import { adminApi } from '../../api'
import { useAutoRefresh } from '../../hooks/useRealTime'


const getActivityIcon = (type) => {
  switch (type) {
    case 'INVOICE':
      return <FileUp className="w-5 h-5 text-purple" />
    case 'PAYMENT':
      return <DollarSign className="w-5 h-5 text-green-400" />
    case 'CONTRACT':
      return <FileText className="w-5 h-5 text-blue-400" />
    case 'VENDOR':
      return <Building className="w-5 h-5 text-orange-400" />
    default:
      return <Activity className="w-5 h-5 text-purple" />
  }
}


const getActivityColor = (type) => {
  switch (type) {
    case 'INVOICE':
      return 'bg-purple/20'
    case 'PAYMENT':
      return 'bg-green-500/20'
    case 'CONTRACT':
      return 'bg-blue-400/20'
    case 'VENDOR':
      return 'bg-orange-400/20'
    default:
      return 'bg-purple/20'
  }
}


const getStatusBadge = (status) => {
  const styles = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-blue-500/20 text-blue-400',
    PAID: 'bg-green-500/20 text-green-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    OVERDUE: 'bg-red-500/20 text-red-400',
    ACTIVE: 'bg-green-500/20 text-green-400',
    EXPIRING: 'bg-orange-500/20 text-orange-400',
    EXPIRED: 'bg-red-500/20 text-red-400',
  }
  return styles[status] || 'bg-gray-500/20 text-gray-400'
}

export const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { user } = useAuthStore()
  const navigate = useNavigate()

  
  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const [dashboardData, activitiesData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getActivities(15),
      ])

      console.log('Dashboard response:', dashboardData.data)
      console.log('Activities response:', activitiesData.data)

      if (dashboardData.data?.data) {
        setDashboard(dashboardData.data.data)
      }

      if (activitiesData.data?.data) {
        setActivities(activitiesData.data.data)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      
      setError(error.message || 'Failed to fetch dashboard data')
    } finally {
      
      setLoading(false)
    }
  }, [])

  
  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.getLiveStats()
      console.log('Stats response:', response.data)
      if (response.data?.data) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }, [])

  
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const loadData = async () => {
      try {
        await fetchDashboard()
        await fetchStats()
      } catch (e) {
        console.warn('Initial fetch failed:', e.message)
      }
      if (mounted) {
        
        timeoutId = setTimeout(() => {
          setLoading(false)
        }, 500)
      }
    }

    loadData()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fetchDashboard, fetchStats])

  
  const fetchEverything = useCallback(async () => {
    try {
      await Promise.all([
        adminApi.getDashboard().then(res => {
          if (res.data?.data) setDashboard(res.data.data)
        }),
        adminApi.getActivities(15).then(res => {
          if (res.data?.data) setActivities(res.data.data)
        }),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Auto refresh error:', err);
    }
  }, [fetchStats]);

  useAutoRefresh(fetchEverything, { interval: 10000, enabled: !loading })

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetchDashboard()
      await fetchStats()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setLoading(false)
    }
  }

  
  const liveStats = stats || {
    pendingInvoices: dashboard?.overview?.pendingInvoices || 0,
    approvedInvoices: dashboard?.overview?.approvedInvoices || 0,
    overdueInvoices: dashboard?.overview?.overdueInvoices || 0,
    expiringContracts: dashboard?.overview?.expiringContracts || 0,
    activeVendors: dashboard?.overview?.activeVendors || 0,
    monthlyPayments: dashboard?.financials?.monthlyPayments || 0,
    pendingAmount: dashboard?.financials?.totalPending || 0,
    overdueAmount: dashboard?.financials?.totalOverdue || 0,
  }

  
  const showDemoData = !dashboard && !error

  
  if (loading && !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {}
        {showDemoData && (
          <GlassCard className="bg-blue-500/10 border-blue-500/30" hover={false}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-light font-medium">Demo Mode</p>
                <p className="text-light/60 text-sm">Connect a database to see real data</p>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                No Database
              </span>
            </div>
          </GlassCard>
        )}

        {}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-light">Admin Dashboard</h1>
              <span className="px-3 py-1 bg-purple/20 border border-purple/30 rounded-full text-purple text-sm font-medium">
                {ROLE_DISPLAY_NAMES[user?.role] || 'Admin'}
              </span>
            </div>
            <p className="text-light/60">
              {user?.company?.name || 'Company'} • Real-time financial control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedButton
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </AnimatedButton>
            <AnimatedButton
              className="flex items-center gap-2"
              onClick={() => navigate('/vendors')}
            >
              <UserPlus className="w-4 h-4" />
              Add Vendor
            </AnimatedButton>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Vendors"
            value={liveStats.activeVendors || dashboard?.overview?.activeVendors || 0}
            subtitle="Total vendors"
            icon={Users}
            trend="+2"
            trendUp={true}
            delay={0}
          />
          <StatCard
            title="Pending Invoices"
            value={liveStats.pendingInvoices}
            subtitle={`${formatCurrency(liveStats.pendingAmount)} pending`}
            icon={FileUp}
            trend="+3"
            trendUp={false}
            delay={0.1}
          />
          <StatCard
            title="Approved (Ready)"
            value={liveStats.approvedInvoices}
            subtitle="Awaiting payment"
            icon={CheckCircle}
            trend="+1"
            trendUp={true}
            delay={0.2}
          />
          <StatCard
            title="Monthly Payments"
            value={formatCurrency(liveStats.monthlyPayments)}
            subtitle="This month"
            icon={IndianRupee}
            trend="+8%"
            trendUp={true}
            delay={0.3}
          />
        </div>

        {}
        {(liveStats.overdueInvoices > 0 || liveStats.expiringContracts > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveStats.overdueInvoices > 0 && (
              <GlassCard className="border-red-500/30 bg-red-500/5" hover={false}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-light">Overdue Invoices</h3>
                    <p className="text-light/60">
                      {liveStats.overdueInvoices} invoice(s) worth {formatCurrency(liveStats.overdueAmount)}
                    </p>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => navigate('/invoices?status=OVERDUE')}
                  >
                    View
                  </AnimatedButton>
                </div>
              </GlassCard>
            )}
            {liveStats.expiringContracts > 0 && (
              <GlassCard className="border-orange-500/30 bg-orange-500/5" hover={false}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-light">Expiring Contracts</h3>
                    <p className="text-light/60">
                      {liveStats.expiringContracts} contract(s) expiring in 7 days
                    </p>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => navigate('/contracts?status=EXPIRING')}
                  >
                    View
                  </AnimatedButton>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <GlassCard className="lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Real-time Activity</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-light/50">Live</span>
              </div>
            </div>

            {activities && activities.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id || index}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark/30 hover:bg-dark/50 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      switch (activity.entity) {
                        case 'INVOICE':
                          navigate(`/invoices?id=${activity.entityId}`)
                          break
                        case 'PAYMENT':
                          navigate(`/payments?id=${activity.entityId}`)
                          break
                        case 'CONTRACT':
                          navigate(`/contracts?id=${activity.entityId}`)
                          break
                        case 'VENDOR':
                          navigate(`/vendors?id=${activity.entityId}`)
                          break
                        default:
                          break
                      }
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-light font-medium truncate">{activity.action}</p>
                      <div className="flex items-center gap-2 text-xs text-light/50">
                        <span>{activity.vendor || 'System'}</span>
                        {activity.amount && (
                          <>
                            <span>•</span>
                            <span className="text-primary">{formatCurrency(activity.amount)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                      <p className="text-light/40 text-xs mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No recent activities</p>
                <p className="text-light/40 text-sm mt-1">Activities will appear here as they occur</p>
              </div>
            )}
          </GlassCard>

          {}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-light mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/vendors"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <Users className="w-5 h-5 text-purple" />
                <span className="flex-1">Manage Vendors</span>
                <ChevronRight className="w-4 h-4 text-light/50" />
              </Link>
              <Link
                to="/contracts"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <FileText className="w-5 h-5 text-purple" />
                <span className="flex-1">Create Contract</span>
                <ChevronRight className="w-4 h-4 text-light/50" />
              </Link>
              <Link
                to="/invoices"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <FileUp className="w-5 h-5 text-purple" />
                <span className="flex-1">Review Invoices</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  {liveStats.pendingInvoices}
                </span>
              </Link>
              <Link
                to="/payments"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <IndianRupee className="w-5 h-5 text-purple" />
                <span className="flex-1">Process Payments</span>
                <ChevronRight className="w-4 h-4 text-light/50" />
              </Link>
              <Link
                to="/reports"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <TrendingUp className="w-5 h-5 text-purple" />
                <span className="flex-1">Financial Reports</span>
                <ChevronRight className="w-4 h-4 text-light/50" />
              </Link>
              <Link
                to="/settings"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-3 no-underline"
              >
                <Settings className="w-5 h-5 text-purple" />
                <span className="flex-1">System Settings</span>
                <ChevronRight className="w-4 h-4 text-light/50" />
              </Link>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-light/60 text-sm">Total Vendors</span>
              <Users className="w-4 h-4 text-purple" />
            </div>
            <p className="text-2xl font-bold text-light">{dashboard?.overview?.totalVendors || 0}</p>
            <p className="text-light/50 text-xs">{dashboard?.overview?.activeVendors || 0} active</p>
          </GlassCard>

          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-light/60 text-sm">Active Contracts</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-light">{dashboard?.overview?.activeContracts || 0}</p>
            <p className="text-light/50 text-xs">{dashboard?.overview?.expiringContracts || 0} expiring soon</p>
          </GlassCard>

          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-light/60 text-sm">Pending Payment</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-light">{formatCurrency(dashboard?.financials?.totalPending || 0)}</p>
            <p className="text-light/50 text-xs">{dashboard?.overview?.approvedInvoices || 0} invoices approved</p>
          </GlassCard>

          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-light/60 text-sm">Yearly Payments</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-light">{formatCurrency(dashboard?.financials?.yearlyPayments || 0)}</p>
            <p className="text-light/50 text-xs">Total yearly spend</p>
          </GlassCard>
        </div>

        {}
        {dashboard?.topVendors && dashboard.topVendors.length > 0 && (
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Top Vendors by Spend</h3>
              <Link to="/vendors" className="text-purple hover:text-softPurple text-sm">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-light/50 text-sm border-b border-light/10">
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Contracts</th>
                    <th className="pb-3 font-medium text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topVendors.map((vendor, index) => (
                    <motion.tr
                      key={vendor.id}
                      className="border-b border-light/5 hover:bg-dark/30 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/vendors?id=${vendor.id}`)}
                    >
                      <td className="py-3">
                        <p className="text-light font-medium">{vendor.name}</p>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3 text-light/70">
                        {vendor._count?.contracts || 0} active
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-light font-medium">{formatCurrency(vendor.totalSpent || 0)}</p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard

