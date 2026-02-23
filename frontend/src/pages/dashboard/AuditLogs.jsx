import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Clock,
  User,
  FileText,
  DollarSign,
  Users,
  Building,
  ChevronDown,
  Download,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { formatDate, formatTimeAgo } from '../../utils/constants'
import { adminApi } from '../../api'
import { useAutoRefresh } from '../../hooks/useRealTime'


const getEntityIcon = (entity) => {
  switch (entity) {
    case 'VENDOR':
      return <Users className="w-4 h-4 text-orange-400" />
    case 'CONTRACT':
      return <FileText className="w-4 h-4 text-blue-400" />
    case 'INVOICE':
      return <DollarSign className="w-4 h-4 text-purple" />
    case 'PAYMENT':
      return <DollarSign className="w-4 h-4 text-green-400" />
    case 'USER':
      return <User className="w-4 h-4 text-cyan-400" />
    default:
      return <FileText className="w-4 h-4 text-gray-400" />
  }
}


const getActionStyle = (action) => {
  switch (action) {
    case 'CREATED':
      return 'text-green-400 bg-green-500/20'
    case 'UPDATED':
      return 'text-blue-400 bg-blue-500/20'
    case 'DELETED':
      return 'text-red-400 bg-red-500/20'
    case 'APPROVED':
      return 'text-green-400 bg-green-500/20'
    case 'REJECTED':
      return 'text-red-400 bg-red-500/20'
    case 'PAID':
      return 'text-green-400 bg-green-500/20'
    case 'ACTIVATED':
      return 'text-green-400 bg-green-500/20'
    case 'DEACTIVATED':
      return 'text-orange-400 bg-orange-500/20'
    default:
      return 'text-gray-400 bg-gray-500/20'
  }
}

export const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch audit logs
  const fetchLogs = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }
      const response = await adminApi.getAuditLogs(params)
      if (response.data?.data) {
        setLogs(response.data.data.logs || [])
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.pagination?.total || 0,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await adminApi.getAuditStats(30)
      if (response.data?.data) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error)
    }
  }

  // Initial load
  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchLogs(), fetchStats()])
      if (mounted) setLoading(false)
    }
    loadData()
    return () => { mounted = false }
  }, [pagination.page])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  // Apply filters
  const applyFilters = async () => {
    setLoading(true)
    await fetchLogs()
    setLoading(false)
    setShowFilters(false)
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({
      entity: '',
      action: '',
      startDate: '',
      endDate: '',
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchLogs()
    setShowFilters(false)
  }

  // Auto-refresh every 30 seconds
  useAutoRefresh(fetchLogs, { interval: 30000, enabled: !loading })

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([fetchLogs(), fetchStats()])
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Audit Logs</h1>
            <p className="text-light/60">
              Track all administrative actions and changes
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
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </AnimatedButton>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <GlassCard className="p-4" hover={false}>
              <p className="text-light/60 text-sm mb-1">Total Actions</p>
              <p className="text-2xl font-bold text-light">{stats.totalActions}</p>
            </GlassCard>
            {Object.entries(stats.byAction || {}).map(([action, count]) => (
              <GlassCard key={action} className="p-4" hover={false}>
                <p className="text-light/60 text-sm mb-1">{action}</p>
                <p className="text-2xl font-bold text-light">{count}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="p-4" hover={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-light/60 mb-2">Entity Type</label>
                  <select
                    value={filters.entity}
                    onChange={(e) => handleFilterChange('entity', e.target.value)}
                    className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  >
                    <option value="">All Entities</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="USER">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-light/60 mb-2">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATED">Created</option>
                    <option value="UPDATED">Updated</option>
                    <option value="DELETED">Deleted</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PAID">Paid</option>
                    <option value="ACTIVATED">Activated</option>
                    <option value="DEACTIVATED">Deactivated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-light/60 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm text-light/60 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <AnimatedButton variant="secondary" onClick={clearFilters}>
                  Clear
                </AnimatedButton>
                <AnimatedButton onClick={applyFilters}>
                  Apply Filters
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {}
        <GlassCard hover={false}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-light/50 text-sm border-b border-light/10">
                      <th className="pb-3 font-medium pl-4">Timestamp</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Entity</th>
                      <th className="pb-3 font-medium">Action</th>
                      <th className="pb-3 font-medium">Details</th>
                      <th className="pb-3 font-medium pr-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        className="border-b border-light/5 hover:bg-dark/30 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-light/40" />
                            <div>
                              <p className="text-light text-sm">{formatDate(log.createdAt)}</p>
                              <p className="text-light/40 text-xs">{formatTimeAgo(log.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-light/40" />
                            <div>
                              <p className="text-light text-sm">{log.userName}</p>
                              <p className="text-light/40 text-xs">{log.userId.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity)}
                            <div>
                              <p className="text-light text-sm">{log.entity}</p>
                              <p className="text-light/40 text-xs font-mono">{log.entityId.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getActionStyle(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="max-w-xs">
                            {log.newData && (
                              <p className="text-light/70 text-sm truncate">
                                {JSON.stringify(log.newData).slice(0, 50)}...
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-light/50 text-sm font-mono">{log.ipAddress || 'N/A'}</p>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              <div className="flex items-center justify-between p-4 border-t border-light/10">
                <p className="text-light/50 text-sm">
                  Showing {logs.length} of {pagination.total} logs
                </p>
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </AnimatedButton>
                  <span className="text-light px-3">
                    Page {pagination.page}
                  </span>
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    disabled={logs.length < pagination.limit}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </AnimatedButton>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-light/20 mx-auto mb-4" />
              <p className="text-light/60">No audit logs found</p>
              <p className="text-light/40 text-sm mt-1">
                {Object.keys(filters).some((k) => filters[k])
                  ? 'Try adjusting your filters'
                  : 'Actions will be logged as they occur'}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}

export default AuditLogs

