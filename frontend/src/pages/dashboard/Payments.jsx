import { useState, useEffect } from 'react'
import { Plus, Search, CreditCard, CheckCircle, Calendar, ArrowRightLeft, Trash2, Eye } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { DataTable } from '../../components/ui/DataTable'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Modal } from '../../components/ui/Modal'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { formatCurrency, formatDate } from '../../utils/constants'
import { paymentsApi } from '../../api/paymentsApi'
import { vendorsApi } from '../../api/vendorsApi'

export const Payments = () => {
  const [payments, setPayments] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadPayments()
    loadVendors()
  }, [])

  const loadPayments = async () => {
    try {
      const response = await paymentsApi.getPayments()
      setPayments(response.data.data.payments)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await vendorsApi.getVendors()
      setVendors(response.data.data.vendors)
    } catch (error) {
      console.error('Failed to load vendors:', error)
    }
  }

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete payment "${payment.transactionId}"?`)) {
      return
    }
    
    try {
      await paymentsApi.deletePayment(payment.id)
      loadPayments()
    } catch (error) {
      console.error('Failed to delete payment:', error)
      alert(error.response?.data?.message || 'Failed to delete payment')
    }
  }

  const filteredPayments = payments.filter((payment) =>
    payment.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'transactionId',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-purple" />
          <span className="font-medium text-light font-mono text-sm">{item.transactionId}</span>
        </div>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'vendorName',
      cell: (item) => (
        <div>
          <p className="font-medium text-light">{item.vendorName}</p>
          <p className="text-xs text-light/50">{item.invoiceNumber}</p>
        </div>
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
      header: 'Payment Date',
      accessor: 'paymentDate',
      cell: (item) => (
        <div className="flex items-center gap-2 text-mauve/70">
          <Calendar className="w-4 h-4" />
          {formatDate(item.paymentDate)}
        </div>
      ),
    },
    {
      header: 'Method',
      accessor: 'paymentMethod',
      cell: (item) => (
        <span className="px-3 py-1 bg-purple/20 text-purple rounded-full text-sm">
          {item.paymentMethod}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (item) => (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2 w-fit">
          <CheckCircle className="w-3 h-3" />
          {item.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-purple/10 rounded-lg transition-colors"
            onClick={() => alert('Payment details: ' + item.transactionId)}
          >
            <Eye className="w-4 h-4 text-light/70" />
          </button>
          <button 
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            onClick={() => handleDeletePayment(item)}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ]

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const paymentData = {
      invoiceNumber: formData.get('invoiceNumber'),
      transactionId: formData.get('transactionId'),
      amount: parseFloat(formData.get('amount')),
      paymentDate: formData.get('paymentDate'),
      paymentMethod: formData.get('paymentMethod'),
      vendorId: formData.get('vendor'),
      notes: formData.get('notes'),
    }
    
    try {
      await paymentsApi.processPayment(paymentData)
      setIsModalOpen(false)
      loadPayments()
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Payments</h1>
            <p className="text-light/60">Process and track vendor payments</p>
          </div>
          <AnimatedButton onClick={() => setIsModalOpen(true)} icon={Plus}>
            Record Payment
          </AnimatedButton>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-light">{payments.length}</p>
              <p className="text-light/50 text-sm">Total Payments</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(payments.reduce((acc, p) => acc + (p.amount || 0), 0))}</p>
              <p className="text-light/50 text-sm">Total Paid</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-light">{formatCurrency(payments.filter(p => p.status === 'Pending').reduce((acc, p) => acc + (p.amount || 0), 0))}</p>
              <p className="text-light/50 text-sm">Pending</p>
            </div>
          </GlassCard>
        </div>

        {}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light/50" />
            <input
              type="text"
              placeholder="Search payments by vendor or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark/50 border border-softPurple/30 rounded-xl pl-12 pr-4 py-3 text-light placeholder-light/50 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
            />
          </div>
        </GlassCard>

        {}
        <DataTable
          columns={columns}
          data={filteredPayments}
          loading={loading}
          emptyMessage="No payments found. Record your first payment to get started."
        />

        {}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Payment"
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <FloatingInput
              label="Invoice Number"
              name="invoiceNumber"
              required
            />
            <FloatingInput
              label="Transaction ID"
              name="transactionId"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Amount"
                name="amount"
                type="number"
                required
              />
              <FloatingInput
                label="Payment Date"
                name="paymentDate"
                type="date"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all">
                <option value="">Select Payment Method</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
              <select name="vendorId" className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all">
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>
            <FloatingInput
              label="Notes"
              name="notes"
              multiline
              rows={3}
            />
            <div className="flex gap-3 pt-4">
              <AnimatedButton
                variant="secondary"
                className="flex-1"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                className="flex-1"
                type="submit"
              >
                Record Payment
              </AnimatedButton>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
