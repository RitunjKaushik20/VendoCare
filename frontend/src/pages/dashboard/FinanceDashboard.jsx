import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  IndianRupee,
  Download,
  Eye,
  MoreVertical,
  Banknote,
  History,
  Percent,
} from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { StatCard } from '../../components/ui/StatCard'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDate, formatTimeAgo, ROLE_DISPLAY_NAMES } from '../../utils/constants'
import { useAuthStore } from '../../store/authStore'
import { financeApi } from '../../api'
import { useAutoRefresh } from '../../hooks/useRealTime'


const getStatusBadge = (status) => {
  const styles = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-blue-500/20 text-blue-400',
    PAID: 'bg-green-500/20 text-green-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    OVERDUE: 'bg-red-500/20 text-red-400',
    ACTIVE: 'bg-green-500/20 text-green-400',
  }
  return styles[status] || 'bg-gray-500/20 text-gray-400'
}


const getAgingColor = (bucket) => {
  const colors = {
    current: 'bg-green-500',
    '1-7': 'bg-yellow-500',
    '8-30': 'bg-orange-500',
    '31-60': 'bg-red-500',
    '60+': 'bg-red-700',
  }
  return colors[bucket] || 'bg-gray-500'
}

export const FinanceDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [stats, setStats] = useState(null)
  const [payableQueue, setPayableQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    bankReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    method: 'BANK_TRANSFER',
  })
  const [processingPayment, setProcessingPayment] = useState(false)
  const [notification, setNotification] = useState(null)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  
  const fetchDashboard = useCallback(async () => {
    try {
      const [dashboardData, payableData] = await Promise.all([
        financeApi.getDashboard().catch(() => ({ data: { data: null } })),
        financeApi.getPayableQueue({ sortBy: 'dueDate', sortOrder: 'asc' }).catch(() => ({ data: { data: [] } })),
      ])
      
      if (dashboardData.data?.data) {
        setDashboard(dashboardData.data.data)
      }
      
      if (payableData.data?.data) {
        setPayableQueue(payableData.data.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }, [])

  
  const fetchStats = useCallback(async () => {
    try {
      const response = await financeApi.getLiveStats()
      if (response.data?.data) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      setLoading(true)
      await fetchDashboard()
      await fetchStats()
      if (mounted) setLoading(false)
    }
    
    loadData()
    return () => { mounted = false }
  }, [fetchDashboard, fetchStats])

  
  useAutoRefresh(fetchStats, { interval: 10000, enabled: !loading })

  const handleRefresh = async () => {
    setLoading(true)
    await fetchDashboard()
    await fetchStats()
    setLoading(false)
  }

  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice)
    setIsPaymentModalOpen(true)
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    setProcessingPayment(true)
    
    try {
      await financeApi.processPayment(selectedInvoice.id, {
        ...paymentForm,
        amount: selectedInvoice.totalAmount,
        vendorId: selectedInvoice.vendorId,
      })
      
      setNotification({
        type: 'success',
        message: `Payment processed for ${selectedInvoice.invoiceNumber}`,
      })
      
      setIsPaymentModalOpen(false)
      setPaymentForm({
        transactionId: '',
        bankReference: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
        method: 'BANK_TRANSFER',
      })
      setSelectedInvoice(null)
      
      
      await fetchDashboard()
      await fetchStats()
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to process payment',
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  
  const liveStats = stats || {
    payableCount: dashboard?.overview?.payableQueue || 0,
    overdueCount: dashboard?.overview?.overdueCount || 0,
    monthlyTotal: dashboard?.monthlySpend?.thisMonth?.amount || 0,
  }

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
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              notification.type === 'error' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-green-500/10 border border-green-500/20'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <p className={notification.type === 'error' ? 'text-red-400' : 'text-green-400'}>
              {notification.message}
            </p>
          </motion.div>
        )}

        {}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-light">Finance Dashboard</h1>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                {ROLE_DISPLAY_NAMES[user?.role] || 'Finance'}
              </span>
            </div>
            <p className="text-light/60">
              {user?.company?.name || 'Company'} • Payables & Payments
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
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Outstanding"
            value={formatCurrency(dashboard?.overview?.totalOutstanding?.total || 0)}
            subtitle={`${dashboard?.overview?.totalOutstanding?.invoiceCount || 0} invoices`}
            icon={DollarSign}
            trend={dashboard?.monthlySpend?.trend || 0}
            trendUp={parseFloat(dashboard?.monthlySpend?.trend || 0) >= 0}
            delay={0}
          />
          <StatCard
            title="Payable Queue"
            value={liveStats.payableCount}
            subtitle="Approved invoices"
            icon={FileText}
            trend="+2"
            trendUp={false}
            delay={0.1}
          />
          <StatCard
            title="Overdue"
            value={liveStats.overdueCount}
            subtitle={`${formatCurrency(dashboard?.overview?.overdueAmount || 0)} pending`}
            icon={AlertTriangle}
            trend="+3"
            trendUp={false}
            delay={0.2}
          />
          <StatCard
            title="Monthly Payments"
            value={formatCurrency(liveStats.monthlyTotal)}
            subtitle="This month"
            icon={TrendingUp}
            trend={dashboard?.monthlySpend?.trend || 0}
            trendUp={parseFloat(dashboard?.monthlySpend?.trend || 0) >= 0}
            delay={0.3}
          />
        </div>

        {}
        {dashboard?.aging && (
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Aging Analysis</h3>
              <span className="text-light/50 text-sm">Accounts Payable Aging</span>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(dashboard.aging).map(([bucket, data]) => (
                <div key={bucket} className="text-center">
                  <div className={`h-2 rounded-full mb-2 ${getAgingColor(bucket)}`} />
                  <p className="text-2xl font-bold text-light">{formatCurrency(data.amount)}</p>
                  <p className="text-light/50 text-sm">{data.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <GlassCard className="lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Payables Queue</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-light/50">Live</span>
              </div>
            </div>
            
            {payableQueue.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-light/50 text-sm border-b border-light/10">
                      <th className="pb-3 font-medium pl-2">Invoice</th>
                      <th className="pb-3 font-medium">Vendor</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-right">Due</th>
                      <th className="pb-3 font-medium text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payableQueue.slice(0, 8).map((invoice, index) => (
                      <motion.tr
                        key={invoice.id}
                        className="border-b border-light/5 hover:bg-dark/30 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <td className="py-3 pl-2">
                          <div>
                            <p className="text-light font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-light/40 text-xs">
                              {invoice.contract?.title || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-light">{invoice.vendor?.name}</p>
                        </td>
                        <td className="py-3 text-right">
                          <div>
                            <p className="text-light font-medium">{formatCurrency(invoice.totalAmount)}</p>
                            <p className="text-light/40 text-xs">GST: {formatCurrency(invoice.gstAmount || 0)}</p>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div>
                            <span className={invoice.isOverdue ? 'text-red-400' : 'text-light/70'}>
                              {invoice.isOverdue 
                                ? `${invoice.daysUntilDue} days overdue`
                                : `${invoice.daysUntilDue} days left`
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <AnimatedButton
                            size="sm"
                            onClick={() => handlePaymentClick(invoice)}
                          >
                            Pay Now
                          </AnimatedButton>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-light/20 mx-auto mb-4" />
                <p className="text-light/60">No invoices pending payment</p>
                <p className="text-light/40 text-sm mt-1">All approved invoices will appear here</p>
              </div>
            )}
          </GlassCard>

          {}
          <div className="space-y-4">
            {}
            <GlassCard hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple/20 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <p className="text-light/60 text-sm">GST This Month</p>
                  <p className="text-xl font-bold text-light">{formatCurrency(dashboard?.gst?.totalGst || 0)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-light/50">Total Invoiced</span>
                  <span className="text-light">{formatCurrency(dashboard?.gst?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light/50">Invoices Processed</span>
                  <span className="text-light">{dashboard?.gst?.invoicesProcessed || 0}</span>
                </div>
              </div>
            </GlassCard>

            {}
            <GlassCard hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-light/60 text-sm">Monthly Spend</p>
                  <p className="text-xl font-bold text-light">{formatCurrency(dashboard?.monthlySpend?.thisMonth?.amount || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {parseFloat(dashboard?.monthlySpend?.trend || 0) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={parseFloat(dashboard?.monthlySpend?.trend || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {dashboard?.monthlySpend?.trend || 0}% vs last month
                </span>
              </div>
            </GlassCard>

            {}
            <GlassCard hover={false}>
              <h4 className="text-light font-medium mb-4">Recent Payments</h4>
              <div className="space-y-3">
                {dashboard?.recentPayments?.slice(0, 4).map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-light text-sm">{payment.vendor?.name}</p>
                      <p className="text-light/40 text-xs">{payment.transactionId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-light font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-light/40 text-xs">{formatTimeAgo(payment.paymentDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {}
        {dashboard?.vendorSummary && dashboard.vendorSummary.length > 0 && (
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-light">Vendor Ledger - Outstanding</h3>
              <Link to="/vendors" className="text-purple hover:text-softPurple text-sm">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-light/50 text-sm border-b border-light/10">
                    <th className="pb-3 font-medium pl-2">Vendor</th>
                    <th className="pb-3 font-medium text-right">Total Invoiced</th>
                    <th className="pb-3 font-medium text-right">Total Paid</th>
                    <th className="pb-3 font-medium text-right">Pending</th>
                    <th className="pb-3 font-medium text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.vendorSummary.slice(0, 6).map((vendor, index) => (
                    <motion.tr
                      key={vendor.id}
                      className="border-b border-light/5 hover:bg-dark/30 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/vendors?id=${vendor.id}`)}
                    >
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-light font-medium">{vendor.name}</p>
                            <p className="text-light/40 text-xs">{vendor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-light">{formatCurrency(vendor.totalInvoiced)}</p>
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-green-400">{formatCurrency(vendor.totalPaid)}</p>
                      </td>
                      <td className="py-3 text-right">
                        <p className={vendor.pendingAmount > 0 ? 'text-yellow-400 font-medium' : 'text-light'}>
                          {formatCurrency(vendor.pendingAmount)}
                        </p>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(vendor.pendingAmount > 0 ? 'PENDING' : 'PAID')}`}>
                          {vendor.pendingAmount > 0 ? 'Pending' : 'Cleared'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedInvoice(null)
          }}
          title="Process Payment"
          size="md"
        >
          {selectedInvoice && (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {}
              <div className="p-4 bg-dark/30 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-light/50 text-sm">Invoice</p>
                    <p className="text-light font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-light/50 text-sm">Vendor</p>
                    <p className="text-light font-medium">{selectedInvoice.vendor?.name}</p>
                  </div>
                  <div>
                    <p className="text-light/50 text-sm">Total Amount</p>
                    <p className="text-primary font-bold">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-light/50 text-sm">GST Included</p>
                    <p className="text-light">{formatCurrency(selectedInvoice.gstAmount || 0)}</p>
                  </div>
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm text-light/60 mb-2">Transaction ID *</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="TXN-XXXXXXXX"
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-light/60 mb-2">Bank Reference</label>
                <input
                  type="text"
                  value={paymentForm.bankReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bankReference: e.target.value })}
                  placeholder="NEFT/IMPS/UPI reference"
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                />
              </div>

              <div>
                <label className="block text-sm text-light/60 mb-2">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHECK">Check</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-light/60 mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-light/60 mb-2">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  variant="secondary"
                  className="flex-1"
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false)
                    setSelectedInvoice(null)
                  }}
                >
                  Cancel
                </AnimatedButton>
                <AnimatedButton
                  className="flex-1"
                  type="submit"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Confirm Payment'}
                </AnimatedButton>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default FinanceDashboard

