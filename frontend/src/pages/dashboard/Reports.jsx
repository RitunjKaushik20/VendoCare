import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, TrendingUp, AlertCircle, IndianRupee, DollarSign, PieChart, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { DataTable } from '../../components/ui/DataTable'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatCurrency, formatDate } from '../../utils/constants'
import { reportsApi, formatOverdueReport, formatTaxReport, safeApiCall } from '../../api/reportsApi'

export const Reports = () => {
  const [spendingData, setSpendingData] = useState([])
  const [overdueData, setOverdueData] = useState([])
  const [gstSummary, setGstSummary] = useState(null)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      
      const spendingData = await safeApiCall(
        () => reportsApi.getSpendingReport({ month: currentMonth, year: currentYear }),
        { vendorSpending: [] }
      )
      
      const overdueData = await safeApiCall(
        () => reportsApi.getOverdueReport(),
        { invoices: [] }
      )
      
      const gstData = await safeApiCall(
        () => reportsApi.getTaxReport(),
        null
      )
      
      const statsData = await safeApiCall(
        () => reportsApi.getDashboardStats(),
        null
      )

      
      const vendorSpending = spendingData?.vendorSpending || []
      setSpendingData(vendorSpending.map(item => ({
        month: `${currentDate.toLocaleString('default', { month: 'short' })} ${currentYear}`,
        vendorName: item.vendor?.name || 'N/A',
        category: item.vendor?.category || 'N/A',
        totalVendors: vendorSpending.length,
        invoiceCount: item.count || 0,
        totalAmount: item.total || 0,
        paidAmount: item.total || 0,
        pendingAmount: 0,
      })))

      
      setOverdueData(formatOverdueReport(overdueData))

      
      setGstSummary(formatTaxReport(gstData))

      
      if (statsData) {
        setDashboardStats(statsData)
      } else {
        setDashboardStats({
          overview: { totalVendors: 0, activeContracts: 0, overdueInvoices: 0 },
          payments: { monthly: 0, yearly: 0 },
        })
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Failed to load reports. Please check your connection and try again.')
      
      setSpendingData([])
      setOverdueData([])
      setGstSummary({
        totalInvoices: 0,
        taxableAmount: 0,
        gstAmount: 0,
        totalWithGst: 0,
        breakdown: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType) => {
    try {
      const currentDate = new Date()
      const params = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      }
      
      const response = await reportsApi.exportToCsv(reportType, params)
      
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}-report.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export report:', error)
      alert('Failed to export report. Please try again.')
    }
  }

  const spendingColumns = [
    {
      header: 'Month',
      accessor: 'month',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple" />
          <span className="font-medium text-light">{item.month}</span>
        </div>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'vendorName',
      cell: (item) => (
        <span className="text-light">{item.vendorName}</span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (item) => (
        <span className="text-light/70 text-sm">{item.category}</span>
      ),
    },
    {
      header: 'Invoices',
      accessor: 'invoiceCount',
      cell: (item) => (
        <span className="text-light">{item.invoiceCount}</span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      cell: (item) => (
        <span className="text-light font-medium">{formatCurrency(item.totalAmount)}</span>
      ),
    },
  ]

  const overdueColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-400" />
          <span className="font-medium text-light">{item.invoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'vendorName',
      cell: (item) => (
        <span className="text-light">{item.vendorName}</span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (item) => (
        <span className="text-light font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      cell: (item) => (
        <span className="text-red-400">{formatDate(item.dueDate)}</span>
      ),
    },
    {
      header: 'Days Overdue',
      accessor: 'daysOverdue',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          item.daysOverdue > 30 
            ? 'bg-red-500/20 text-red-400' 
            : item.daysOverdue > 15 
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {item.daysOverdue} days
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-light/60 mt-4">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Reports</h1>
            <p className="text-light/60">Financial insights and analytics</p>
          </div>
          <div className="flex gap-3">
            <AnimatedButton 
              variant="secondary" 
              icon={RefreshCw}
              onClick={loadReports}
            >
              Refresh
            </AnimatedButton>
            <AnimatedButton 
              icon={Download} 
              onClick={() => handleExport('spending')}
            >
              Export All
            </AnimatedButton>
          </div>
        </div>

        {}
        {error && (
          <GlassCard className="p-4 bg-red-500/10 border border-red-500/20">
            <div className="flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <AnimatedButton 
                variant="secondary" 
                size="sm" 
                icon={RefreshCw}
                onClick={loadReports}
              >
                Retry
              </AnimatedButton>
            </div>
          </GlassCard>
        )}

        {}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light/50 text-sm">Total Vendors</p>
                  <p className="text-2xl font-bold text-light">{dashboardStats.overview?.totalVendors || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light/50 text-sm">Active Contracts</p>
                  <p className="text-2xl font-bold text-light">{dashboardStats.overview?.activeContracts || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light/50 text-sm">Monthly Payments</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardStats.payments?.monthly || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-light/50 text-sm">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-red-400">{dashboardStats.overview?.overdueInvoices || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {}
        {gstSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <p className="text-light/50 text-sm mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-light">{gstSummary.totalInvoices}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-light/50 text-sm mb-1">Taxable Amount</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(gstSummary.taxableAmount)}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-light/50 text-sm mb-1">GST Collected</p>
              <p className="text-2xl font-bold text-purple">{formatCurrency(gstSummary.gstAmount)}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-light/50 text-sm mb-1">Total with GST</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(gstSummary.totalWithGst)}</p>
            </GlassCard>
          </div>
        )}

        {}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-light flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose" />
              Monthly Vendor Spending
            </h2>
            <AnimatedButton 
              variant="secondary" 
              size="sm" 
              icon={Download}
              onClick={() => handleExport('spending')}
            >
              CSV
            </AnimatedButton>
          </div>
          <DataTable
            columns={spendingColumns}
            data={spendingData}
            loading={loading}
            emptyMessage="No spending data available for this month."
          />
        </div>

        {}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-light flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Overdue Invoices
            </h2>
            <AnimatedButton 
              variant="secondary" 
              size="sm" 
              icon={Download}
              onClick={() => handleExport('overdue')}
            >
              CSV
            </AnimatedButton>
          </div>
          <DataTable
            columns={overdueColumns}
            data={overdueData}
            loading={loading}
            emptyMessage="No overdue invoices. Great job!"
          />
        </div>

        {}
        {gstSummary && gstSummary.breakdown && gstSummary.breakdown.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-light flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-400" />
                GST/VAT Summary
              </h2>
            </div>
            <GlassCard className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-softPurple/20">
                    <th className="text-left py-4 px-6 text-sm font-medium text-light/70">Tax Rate</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-light/70">Taxable Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-light/70">Tax Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-light/70">Total</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-light/70">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {gstSummary.breakdown.map((item, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-softPurple/10 hover:bg-purple/5 transition-colors"
                    >
                      <td className="py-4 px-6 text-light">{item.rate}</td>
                      <td className="py-4 px-6 text-light">{formatCurrency(item.taxableAmount)}</td>
                      <td className="py-4 px-6 text-light">{formatCurrency(item.gstAmount)}</td>
                      <td className="py-4 px-6 text-light font-medium">{formatCurrency(item.total)}</td>
                      <td className="py-4 px-6 text-light/70">{item.count}</td>
                    </tr>
                  ))}
                  <tr className="bg-purple/5">
                    <td className="py-4 px-6 text-light font-semibold">Total</td>
                    <td className="py-4 px-6 text-light font-semibold">{formatCurrency(gstSummary.taxableAmount)}</td>
                    <td className="py-4 px-6 text-light font-semibold">{formatCurrency(gstSummary.gstAmount)}</td>
                    <td className="py-4 px-6 text-primary font-bold">{formatCurrency(gstSummary.totalWithGst)}</td>
                    <td className="py-4 px-6 text-light font-semibold">{gstSummary.totalInvoices}</td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {}
        {(!gstSummary || !gstSummary.breakdown || gstSummary.breakdown.length === 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-light flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-400" />
                GST/VAT Summary
              </h2>
            </div>
            <GlassCard className="p-8 text-center">
              <IndianRupee className="w-12 h-12 text-light/30 mx-auto mb-4" />
              <p className="text-light/60">No tax data available yet.</p>
              <p className="text-light/40 text-sm mt-2">Tax summary will appear once invoices are created.</p>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

