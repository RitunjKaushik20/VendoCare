import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Calendar, IndianRupee, AlertCircle, Trash2, Eye, CheckCircle } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { DataTable } from '../../components/ui/DataTable'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Modal } from '../../components/ui/Modal'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { formatCurrency, formatDate } from '../../utils/constants'
import { contractsApi } from '../../api/contractsApi'
import { vendorsApi } from '../../api/vendorsApi'
import { useAuth } from '../../hooks/useAuth'
import { useAutoRefresh } from '../../hooks/useRealTime'

export const Contracts = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const vendorFilter = searchParams.get('vendor')
  const [contracts, setContracts] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [error, setError] = useState(null)

  // Auto-refresh contracts every 30 seconds for vendors
  const fetchContracts = useCallback(async () => {
    try {
      let response;
      if (user?.role === 'VENDOR') {
        response = await contractsApi.getMyContracts()
      } else {
        response = await contractsApi.getContracts()
      }

      const responseData = response?.data?.data || response?.data || {};
      const contractsData = responseData.contracts || [];

      setContracts(contractsData)
    } catch (err) {
      console.error('Failed to load contracts:', err)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [user])

  
  const { refresh: refreshContracts } = useAutoRefresh(fetchContracts, {
    interval: 30000, 
    enabled: user?.role === 'VENDOR'
  })

  
  useEffect(() => {
    fetchContracts()
    if (user?.role === 'ADMIN' || user?.role === 'FINANCE') {
      loadVendors()
    }
  }, [fetchContracts, user])

  const loadVendors = async () => {
    try {
      const response = await vendorsApi.getVendors()
      setVendors(response.data.data.vendors || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    
    if (vendorFilter && String(contract.vendorId) !== String(vendorFilter)) {
      return false
    }

    
    const searchLow = (searchQuery || '').toLowerCase();
    const cVendor = (contract.vendorName || contract.vendor?.name || '').toLowerCase();
    const cCycle = (contract.paymentCycle || '').toLowerCase();
    const cTitle = (contract.title || '').toLowerCase();

    return cVendor.includes(searchLow) ||
      cCycle.includes(searchLow) ||
      cTitle.includes(searchLow)
  })

  const getStatusColor = (status) => {
    // Use calculatedStatus if available
    const currentStatus = status || 'ACTIVE'
    switch (currentStatus) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400'
      case 'EXPIRING':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'EXPIRED':
        return 'bg-red-500/20 text-red-400'
      case 'TERMINATED':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    const currentStatus = status || 'ACTIVE'
    switch (currentStatus) {
      case 'ACTIVE':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'EXPIRING':
        return <AlertCircle className="w-3 h-3 text-yellow-400" />
      case 'EXPIRED':
        return <AlertCircle className="w-3 h-3 text-red-400" />
      default:
        return null
    }
  }

  const handleDeleteContract = async (contract) => {
    if (!window.confirm(`Are you sure you want to delete contract "${contract.title}"?`)) {
      return
    }

    try {
      await contractsApi.deleteContract(contract.id)
      fetchContracts()
    } catch (err) {
      console.error('Failed to delete contract:', err)
      alert(err.response?.data?.message || 'Failed to delete contract')
    }
  }

  const handleAddContract = async (e) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.target)
    const contractData = {
      title: formData.get('title'),
      vendorId: formData.get('vendor'),
      amount: parseFloat(formData.get('amount')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      paymentCycle: formData.get('paymentCycle'),
      terms: formData.get('terms'),
    }

    
    if (!contractData.vendorId) {
      setError('Please select a vendor')
      return
    }

    try {
      await contractsApi.createContract(contractData)
      setIsModalOpen(false)
      fetchContracts()
    } catch (err) {
      console.error('Failed to create contract:', err)
      const errorMsg = err.response?.data?.message ||
        err.response?.data?.errors?.map(e => e.message).join(', ') ||
        'Failed to create contract'
      setError(errorMsg)
    }
  }

  
  const activeCount = contracts.filter(c => (c.calculatedStatus || c.status) === 'ACTIVE').length
  const expiringCount = contracts.filter(c => (c.calculatedStatus || c.status) === 'EXPIRING').length
  const expiredCount = contracts.filter(c => (c.calculatedStatus || c.status) === 'EXPIRED').length
  const totalValue = contracts.reduce((acc, c) => acc + (c.amount || 0), 0)

  const columns = [
    {
      header: 'Contract',
      accessor: 'title',
      cell: (item) => (
        <div>
          <p className="font-medium text-light">{item.title || 'N/A'}</p>
          <p className="text-xs text-light/50">{item.vendorName || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (item) => (
        <span className="text-light font-medium">{formatCurrency(item.amount || 0)}</span>
      ),
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      cell: (item) => (
        <div className="flex items-center gap-2 text-mauve/70">
          <Calendar className="w-4 h-4" />
          {formatDate(item.startDate)}
        </div>
      ),
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: (item) => {
        const endDate = item.endDate ? new Date(item.endDate) : null
        const today = new Date()
        const daysUntilExpiry = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null

        return (
          <div className="flex items-center gap-2 text-light/70">
            <Calendar className="w-4 h-4" />
            {formatDate(item.endDate)}
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
              <span className={`text-xs ${daysUntilExpiry <= 7 ? 'text-red-400' : 'text-yellow-400'}`}>
                ({daysUntilExpiry}d)
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (item) => {
        
        const status = item.calculatedStatus || item.status || 'ACTIVE'
        return (
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 w-fit ${getStatusColor(status)
            }`}>
            {getStatusIcon(status)}
            {status}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-purple/10 rounded-lg transition-colors"
            onClick={() => setSelectedContract(item)}
          >
            <Eye className="w-4 h-4 text-light/70" />
          </button>
          {user?.role !== 'VENDOR' && (
            <button
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              onClick={() => handleDeleteContract(item)}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const canCreateContract = user?.role === 'ADMIN' || user?.role === 'FINANCE'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Contracts</h1>
            <p className="text-light/60">
              {user?.role === 'VENDOR'
                ? 'Manage your vendor agreements and renewals'
                : 'Manage vendor agreements and renewals'}
            </p>
          </div>
          {canCreateContract && (
            <AnimatedButton onClick={() => {
              setIsModalOpen(true)
              setError(null)
            }} icon={Plus}>
              New Contract
            </AnimatedButton>
          )}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-light">{activeCount}</p>
              <p className="text-light/50 text-sm">Active Contracts</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-light">{expiringCount}</p>
              <p className="text-light/50 text-sm">Expiring Soon (≤7 days)</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-light">{expiredCount}</p>
              <p className="text-light/50 text-sm">Expired</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-rose" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
              <p className="text-light/50 text-sm">Total Value</p>
            </div>
          </GlassCard>
        </div>

        {}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light/50" />
            <input
              type="text"
              placeholder="Search contracts by title, vendor or payment cycle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark/50 border border-softPurple/30 rounded-xl pl-12 pr-4 py-3 text-light placeholder-light/50 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
            />
          </div>
        </GlassCard>

        {}
        <DataTable
          columns={columns}
          data={filteredContracts}
          loading={loading}
          emptyMessage="No contracts found. Create your first contract to get started."
        />

        {}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Contract"
          size="lg"
        >
          <form onSubmit={handleAddContract} className="space-y-4">
            {}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <FloatingInput
              label="Contract Title"
              name="title"
              placeholder="e.g., Annual Service Agreement"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light/80 mb-2">Vendor</label>
                <select
                  name="vendor"
                  className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <FloatingInput
                label="Contract Amount"
                name="amount"
                type="number"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Start Date"
                name="startDate"
                type="date"
                required
              />
              <FloatingInput
                label="End Date"
                name="endDate"
                type="date"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light/80 mb-2">Payment Cycle</label>
              <select
                name="paymentCycle"
                className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
                required
              >
                <option value="">Select Payment Cycle</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>
            <FloatingInput
              label="Terms & Conditions"
              name="terms"
              multiline
              rows={3}
              placeholder="Enter contract terms and conditions..."
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
                Create Contract
              </AnimatedButton>
            </div>
          </form>
        </Modal>

        {}
        <Modal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={selectedContract?.title || 'Contract Details'}
          size="lg"
        >
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Vendor</p>
                  <p className="text-light font-medium">{selectedContract.vendorName || selectedContract.vendor?.name || 'N/A'}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Amount</p>
                  <p className="text-primary font-bold text-xl">{formatCurrency(selectedContract.amount || 0)}</p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(selectedContract.calculatedStatus || selectedContract.status)}`}>
                    {getStatusIcon(selectedContract.calculatedStatus || selectedContract.status)}
                    {selectedContract.calculatedStatus || selectedContract.status || 'ACTIVE'}
                  </span>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Start Date</p>
                  <p className="text-light flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple" />
                    {formatDate(selectedContract.startDate)}
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">End Date</p>
                  <p className="text-light flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple" />
                    {formatDate(selectedContract.endDate)}
                  </p>
                </GlassCard>
              </div>

              <GlassCard className="p-4">
                <p className="text-light/50 text-sm mb-1">Payment Cycle</p>
                <p className="text-light">{selectedContract.paymentCycle}</p>
              </GlassCard>

              {selectedContract.terms && (
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-2">Terms & Conditions</p>
                  <p className="text-light whitespace-pre-wrap">{selectedContract.terms}</p>
                </GlassCard>
              )}

              {selectedContract.documents && selectedContract.documents.length > 0 && (
                <div className="pt-4 border-t border-purple/20">
                  <p className="text-light/50 text-sm mb-3">Attached Documents</p>
                  <div className="space-y-2">
                    {selectedContract.documents.map((doc) => (
                      <AnimatedButton
                        key={doc.id}
                        variant="secondary"
                        onClick={() => window.open(doc.url, '_blank')}
                        className="w-full flex justify-between items-center"
                      >
                        <span className="truncate">{doc.name || 'Document'}</span>
                        <Eye className="w-4 h-4 ml-2 flex-shrink-0" />
                      </AnimatedButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}



export default Contracts;

