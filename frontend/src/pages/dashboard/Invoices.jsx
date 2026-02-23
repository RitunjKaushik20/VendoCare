import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Search, FileText, Download, Eye, CheckCircle, Clock, AlertCircle, Upload, X, Trash2, ThumbsDown } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { DataTable } from '../../components/ui/DataTable'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Modal } from '../../components/ui/Modal'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { formatCurrency, formatDate } from '../../utils/constants'
import { invoicesApi } from '../../api/invoicesApi'
import { vendorsApi } from '../../api/vendorsApi'
import { useAuth } from '../../hooks/useAuth'
import { useAutoRefresh } from '../../hooks/useRealTime'

export const Invoices = () => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Auto-refresh invoices every 30 seconds for vendors
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      let response
      if (user?.role === 'VENDOR') {
        response = await invoicesApi.getMyInvoices()
        setInvoices(response.data.data.invoices || [])
      } else {
        response = await invoicesApi.getInvoices()
        setInvoices(response.data.data.invoices || [])
      }
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  
  const { refresh: refreshInvoices } = useAutoRefresh(fetchInvoices, {
    interval: 30000, 
    enabled: user?.role === 'VENDOR'
  })

  
  useEffect(() => {
    fetchInvoices()
    if (user?.role === 'ADMIN' || user?.role === 'FINANCE') {
      loadVendors()
    }
  }, [fetchInvoices, user])

  const loadVendors = async () => {
    try {
      const response = await vendorsApi.getVendors()
      setVendors(response.data.data.vendors || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect({ target: { files: [file] } })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadInvoice = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    const formData = new FormData(e.target)
    formData.append('file', selectedFile)

    
    const amount = formData.get('amount')
    const dueDate = formData.get('dueDate')

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!dueDate) {
      setError('Please select a due date')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      await invoicesApi.uploadInvoice(formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })

      setIsModalOpen(false)
      setSelectedFile(null)
      setUploadProgress(0)
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchInvoices()
    } catch (err) {
      console.error('Failed to upload invoice:', err)
      setError(err.response?.data?.message || 'Failed to upload invoice. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadInvoice = async (invoice) => {
    if (!invoice.fileUrl && !invoice.id) {
      alert('No file attached to this invoice')
      return
    }

    try {
      const response = await invoicesApi.downloadInvoice(invoice.id)
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download invoice:', err)
      if (invoice.fileUrl) {
        window.open(invoice.fileUrl, '_blank')
      } else {
        alert('Failed to download invoice. Please try again.')
      }
    }
  }

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      return
    }

    try {
      await invoicesApi.deleteInvoice(invoice.id)
      fetchInvoices()
    } catch (err) {
      console.error('Failed to delete invoice:', err)
      alert(err.response?.data?.message || 'Failed to delete invoice')
    }
  }

  const handleApproveInvoice = async (invoice) => {
    if (!window.confirm(`Approve invoice ${invoice.invoiceNumber}?`)) {
      return
    }

    try {
      setActionLoading(true)
      await invoicesApi.approveInvoice(invoice.id)
      fetchInvoices()
      setSelectedInvoice(null)
    } catch (err) {
      console.error('Failed to approve invoice:', err)
      alert(err.response?.data?.message || 'Failed to approve invoice')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectInvoice = async (invoice) => {
    const reason = prompt('Please enter a reason for rejection:')
    if (!reason || reason.trim() === '') {
      return // User cancelled or entered empty reason
    }

    try {
      setActionLoading(true)
      await invoicesApi.rejectInvoice(invoice.id, reason)
      fetchInvoices()
      setSelectedInvoice(null)
    } catch (err) {
      console.error('Failed to reject invoice:', err)
      alert(err.response?.data?.message || 'Failed to reject invoice')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoice) => {
    if (!window.confirm(`Mark invoice ${invoice.invoiceNumber} as paid?`)) {
      return
    }

    try {
      setActionLoading(true)
      await invoicesApi.updateInvoiceStatus(invoice.id, 'PAID')
      fetchInvoices()
      setSelectedInvoice(null)
    } catch (err) {
      console.error('Failed to mark as paid:', err)
      alert(err.response?.data?.message || 'Failed to mark as paid')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'REJECTED':
        return <ThumbsDown className="w-4 h-4 text-red-400" />
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 text-green-400'
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400'
      case 'OVERDLE':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose" />
          <span className="font-medium text-light">{item.invoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'vendorName',
      cell: (item) => (
        <div>
          <p className="font-medium text-light">{item.vendorName || item.vendor?.name}</p>
          <p className="text-xs text-light/50">{item.category}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (item) => (
        <span className="text-light font-medium">{formatCurrency(item.amount || item.totalAmount)}</span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      cell: (item) => (
        <span className="text-mauve/70">{formatDate(item.dueDate)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 w-fit ${getStatusColor(item.status)}`}>
          {getStatusIcon(item.status)}
          {item.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (item) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-2 hover:bg-purple/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedInvoice(item)
            }}
          >
            <Eye className="w-4 h-4 text-light/70" />
          </button>
          <button
            className="p-2 hover:bg-purple/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              downloadInvoice(item)
            }}
            disabled={!item.fileUrl}
          >
            <Download className="w-4 h-4 text-light/70" />
          </button>
          {user?.role !== 'VENDOR' && (
            <button
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteInvoice(item)
              }}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      ),
    }
  ]

  
  const canUploadInvoice = user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'VENDOR'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Invoices</h1>
            <p className="text-light/60">
              {user?.role === 'VENDOR'
                ? 'Track and manage your invoices'
                : 'Track and manage vendor invoices'}
            </p>
          </div>
          {canUploadInvoice && (
            <AnimatedButton onClick={() => {
              setIsModalOpen(true)
              setError(null)
              setSelectedFile(null)
            }} icon={Plus}>
              Upload Invoice
            </AnimatedButton>
          )}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <GlassCard className="p-4">
            <p className="text-2xl font-bold text-light">{invoices.length}</p>
            <p className="text-light/50 text-sm">Total Invoices</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-2xl font-bold text-yellow-400">
              {invoices.filter(i => i.status === 'PENDING').length}
            </p>
            <p className="text-light/50 text-sm">Pending</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-2xl font-bold text-blue-400">
              {invoices.filter(i => i.status === 'APPROVED').length}
            </p>
            <p className="text-light/50 text-sm">Approved</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-2xl font-bold text-red-400">
              {invoices.filter(i => i.status === 'OVERDUE').length}
            </p>
            <p className="text-light/50 text-sm">Overdue</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + (i.amount || i.totalAmount || 0), 0))}
            </p>
            <p className="text-light/50 text-sm">Total Paid</p>
          </GlassCard>
        </div>

        {}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light/50" />
            <input
              type="text"
              placeholder="Search invoices by number or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark/50 border border-softPurple/30 rounded-xl pl-12 pr-4 py-3 text-light placeholder-light/50 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
            />
          </div>
        </GlassCard>

        {}
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={loading}
          emptyMessage="No invoices found. Upload your first invoice to get started."
        />

        {}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedFile(null)
            setUploadProgress(0)
            setError(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
          title="Upload Invoice"
          size="lg"
        >
          <form onSubmit={handleUploadInvoice} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${selectedFile
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-softPurple/30 hover:border-purple/50'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-light font-medium">{selectedFile.name}</p>
                  <p className="text-light/50 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center justify-center gap-1 mx-auto"
                  >
                    <X className="w-4 h-4" />
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-rose/20 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-rose" />
                  </div>
                  <p className="text-light font-medium mb-2">Drop files here or click to upload</p>
                  <p className="text-light/50 text-sm">Supports PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-light/70">Uploading...</span>
                  <span className="text-light">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-dark/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Invoice Details Form */}
            <div className="grid grid-cols-2 gap-4">
              {/* Vendor Selection - Only for ADMIN/FINANCE */}
              {user?.role !== 'VENDOR' ? (
                <div>
                  <label className="block text-sm font-medium text-light/80 mb-2">Vendor *</label>
                  <select
                    name="vendorId"
                    className="w-full bg-dark/50 border border-softPurple/30 rounded-xl px-4 py-3 text-light focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 transition-all"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden"></div>
              )}
              <FloatingInput
                label="Invoice Number"
                name="invoiceNumber"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Amount *"
                name="amount"
                type="number"
                placeholder="0.00"
                required
              />
              <FloatingInput
                label="Due Date *"
                name="dueDate"
                type="date"
                required
              />
            </div>

            <FloatingInput
              label="Description"
              name="description"
              multiline
              rows={2}
              placeholder="Optional description..."
            />

            <div className="flex gap-3 pt-4">
              <AnimatedButton
                variant="secondary"
                className="flex-1"
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedFile(null)
                  setUploadProgress(0)
                  setError(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                className="flex-1"
                type="submit"
                disabled={!selectedFile || uploading}
              >
                {uploading ? `Uploading ${uploadProgress}%` : 'Upload Invoice'}
              </AnimatedButton>
            </div>
          </form>
        </Modal>

        {/* Invoice Details Modal */}
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice?.invoiceNumber}`}
          size="lg"
        >
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Status */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-light/50 text-sm mb-1">Status</p>
                  <span className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status}
                  </span>
                </div>
              </GlassCard>

              {}
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Vendor</p>
                  <p className="text-light font-medium">{selectedInvoice.vendorName || selectedInvoice.vendor?.name}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Amount</p>
                  <p className="text-primary font-bold text-xl">{formatCurrency(selectedInvoice.amount || selectedInvoice.totalAmount)}</p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Invoice Date</p>
                  <p className="text-light">{formatDate(selectedInvoice.invoiceDate || selectedInvoice.issueDate || selectedInvoice.createdAt)}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Due Date</p>
                  <p className="text-light">{formatDate(selectedInvoice.dueDate)}</p>
                </GlassCard>
              </div>

              {}
              {selectedInvoice.notes && (
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-2">Notes</p>
                  <p className="text-light">{selectedInvoice.notes}</p>
                </GlassCard>
              )}

              {}
              {user?.role !== 'VENDOR' && selectedInvoice.status === 'PENDING' && (
                <div className="flex gap-3">
                  <AnimatedButton
                    className="flex-1"
                    onClick={() => handleApproveInvoice(selectedInvoice)}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </AnimatedButton>
                  <AnimatedButton
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleRejectInvoice(selectedInvoice)}
                    disabled={actionLoading}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </AnimatedButton>
                </div>
              )}

              {}
              {user?.role !== 'VENDOR' && selectedInvoice.status === 'APPROVED' && (
                <AnimatedButton
                  className="w-full"
                  onClick={() => handleMarkAsPaid(selectedInvoice)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Paid
                </AnimatedButton>
              )}

              <div className="flex gap-3">
                <AnimatedButton
                  variant="secondary"
                  className="flex-1"
                  onClick={() => downloadInvoice(selectedInvoice)}
                  disabled={!selectedInvoice?.fileUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </AnimatedButton>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default Invoices;

