import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, FileText, FileUp, IndianRupee, RefreshCw, FileText as FileTextIcon, Activity } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { StatCard } from '../../components/ui/StatCard'
import { GlassCard } from '../../components/ui/GlassCard'
import { formatCurrency, formatTimeAgo, ROLES } from '../../utils/constants'
import { useAuthStore } from '../../store/authStore'
import { reportsApi, safeApiCall } from '../../api/reportsApi'
import { AdminDashboard } from './AdminDashboard'
import { FinanceDashboard } from './FinanceDashboard'
import { VendorDashboard } from './VendorDashboard'

export const DashboardHome = () => {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null)
        const [statsData, activitiesData] = await Promise.all([
          safeApiCall(() => reportsApi.getDashboardStats(), null),
          safeApiCall(() => reportsApi.getRecentActivities(5), []),
        ])
        setStats(statsData)
        setActivities(activitiesData || [])
      } catch (err) {
        console.warn('Dashboard fetch warning:', err.message)
        
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  
  const renderRoleDashboard = () => {
    const normalizedRole = user?.role?.toUpperCase()
    switch (normalizedRole) {
      case ROLES.ADMIN:
        return <AdminDashboard />
      case ROLES.FINANCE:
        return <FinanceDashboard />
      case ROLES.VENDOR:
        return <VendorDashboard />
      default:
        return null
    }
  }

  
  if (user?.role) {
    return renderRoleDashboard()
  }

  
  if (loading) {
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
        <GlassCard className="bg-blue-500/10 border-blue-500/30" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-light font-medium">Welcome to VendoCare</p>
              <p className="text-light/60 text-sm">Demo mode - Connect a database for full functionality</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
              Demo
            </span>
          </div>
        </GlassCard>

        {}
        <div>
          <h1 className="text-3xl font-bold text-light mb-2">Dashboard</h1>
          <p className="text-light/60">Overview of your vendor management system</p>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Vendors"
            value={stats?.overview?.totalVendors || 0}
            subtitle="Active vendors"
            icon={Users}
            trend="+12%"
            trendUp={true}
            delay={0}
          />
          <StatCard
            title="Active Contracts"
            value={stats?.overview?.activeContracts || 0}
            subtitle="Current agreements"
            icon={FileText}
            trend="+5%"
            trendUp={true}
            delay={0.1}
          />
          <StatCard
            title="Pending Invoices"
            value={stats?.overview?.pendingInvoices || 0}
            subtitle="Awaiting payment"
            icon={FileUp}
            trend="+2"
            trendUp={false}
            delay={0.2}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats?.payments?.monthly || 0)}
            subtitle="This month"
            icon={IndianRupee}
            trend="+8%"
            trendUp={true}
            delay={0.3}
          />
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Recent Activity</h3>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-dark/50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-light/50" />
              </button>
            </div>
            
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <motion.div
                    key={activity.id || i}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark/30 hover:bg-dark/50 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    onClick={() => {
                      switch (activity.type) {
                        case 'INVOICE_CREATED':
                          navigate('/invoices')
                          break
                        case 'PAYMENT_MADE':
                          navigate('/payments')
                          break
                        case 'CONTRACT_CREATED':
                          navigate('/contracts')
                          break
                        default:
                          break
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-purple/20 rounded-lg flex items-center justify-center">
                      <FileTextIcon className="w-5 h-5 text-purple" />
                    </div>
                    <div className="flex-1">
                      <p className="text-light font-medium">{activity.action || 'Activity'}</p>
                      <p className="text-light/50 text-sm">
                        {activity.vendor || 'System'} • {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className="text-primary font-medium">{formatCurrency(activity.amount)}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileTextIcon className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No recent activity</p>
                <p className="text-light/40 text-sm mt-1">Add vendors, contracts, or invoices to see activity here</p>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-light mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/vendors"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-2 no-underline block"
              >
                <span className="text-purple">+</span> Add New Vendor
              </Link>
              <Link 
                to="/contracts"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-2 no-underline block"
              >
                <span className="text-purple">+</span> Create Contract
              </Link>
              <Link 
                to="/invoices"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-2 no-underline block"
              >
                <span className="text-purple">+</span> Upload Invoice
              </Link>
              <Link 
                to="/payments"
                className="w-full p-3 text-left rounded-xl bg-dark/30 hover:bg-purple/10 transition-colors text-light flex items-center gap-2 no-underline block"
              >
                <span className="text-purple">+</span> Process Payment
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  )
}
