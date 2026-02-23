import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Star, Phone, Mail, MapPin, Trash2, Eye, Edit, CheckCircle } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { DataTable } from '../../components/ui/DataTable'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Modal } from '../../components/ui/Modal'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { formatCurrency, formatDate } from '../../utils/constants'
import { vendorsApi } from '../../api/vendorsApi'

export const Vendors = () => {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [editingVendor, setEditingVendor] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadVendors = async () => {
    try {
      setLoading(true)
      const response = await vendorsApi.getVendors()

      
      const vendors = response.data?.data?.vendors || response.data?.vendors || []
      setVendors(vendors)
    } catch (error) {
      console.error('Failed to load vendors:', error)
      
      const errorData = error.response?.data
      let errorMsg = 'Failed to load vendors'

      if (errorData?.message) {
        errorMsg = errorData.message
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.'
      } else if (error.response?.status === 403) {
        errorMsg = 'You do not have permission to view vendors.'
      }

      showNotification(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRowClick = (vendor) => {
    setSelectedVendor(vendor)
  }

  const handleEditClick = (vendor, e) => {
    e.stopPropagation()
    setEditingVendor(vendor)
    setIsEditModalOpen(true)
    setSelectedVendor(null)
  }

  const handleViewContracts = () => {
    
    navigate(`/contracts?vendor=${selectedVendor.id}`)
  }

  const handleDeleteVendor = async (vendor, e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm(`Are you sure you want to delete vendor "${vendor.name}"? This will not delete associated contracts.`)) {
      return
    }

    try {
      await vendorsApi.deleteVendor(vendor.id)
      showNotification('Vendor deleted successfully')
      loadVendors()
    } catch (error) {
      console.error('Failed to delete vendor:', error)
      showNotification(error.response?.data?.message || 'Failed to delete vendor', 'error')
    }
  }

  const columns = [
    {
      header: 'Vendor',
      accessor: 'name',
      cell: (item) => (
        <div>
          <p className="font-medium text-light">{item.name || 'N/A'}</p>
          <p className="text-xs text-mauve/50">{item.category || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'email',
      cell: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-light/70">
            <Mail className="w-3 h-3" />
            {item.email || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-light/70">
            <Phone className="w-3 h-3" />
            {item.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (item) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-light font-medium">{item.rating || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Active Contracts',
      accessor: 'activeContracts',
      cell: (item) => (
        <span className="px-3 py-1 bg-rose/20 text-rose rounded-full text-sm">
          {item.activeContracts || item._count?.contracts || 0}
        </span>
      ),
    },
    {
      header: 'Total Spent',
      accessor: 'totalSpent',
      cell: (item) => (
        <span className="text-light font-medium">{formatCurrency(item.totalSpent || 0)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'Active'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
          }`}>
          {item.status || 'N/A'}
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
              setSelectedVendor(item)
            }}
          >
            <Eye className="w-4 h-4 text-light/70" />
          </button>
          <button
            className="p-2 hover:bg-purple/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleEditClick(item, e)
            }}
          >
            <Edit className="w-4 h-4 text-light/70" />
          </button>
          <button
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteVendor(item, e)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ]

  const handleAddVendor = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const vendorData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      category: formData.get('category'),
    }

    
    if (!vendorData.name || !vendorData.name.trim()) {
      showNotification('Vendor name is required', 'error')
      setIsSubmitting(false)
      return
    }

    if (!vendorData.email || !vendorData.email.trim()) {
      showNotification('Email is required', 'error')
      setIsSubmitting(false)
      return
    }

    if (!vendorData.category || !vendorData.category.trim()) {
      showNotification('Category is required', 'error')
      setIsSubmitting(false)
      return
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(vendorData.email)) {
      showNotification('Please enter a valid email address', 'error')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await vendorsApi.createVendor(vendorData)
      showNotification('Vendor added successfully!')
      setIsModalOpen(false)
      
      e.target.reset()

      const newVendor = response.data?.data?.vendor || response.data?.vendor;
      if (newVendor) {
        setVendors(prev => [newVendor, ...prev]);
      } else {
        loadVendors();
      }
    } catch (error) {
      console.error('Failed to create vendor:', error)
      
      const errorData = error.response?.data
      let errorMsg = 'Failed to create vendor'

      if (errorData?.message) {
        errorMsg = errorData.message
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMsg = errorData.errors.map(e => e.message).join(', ')
      } else if (error.message) {
        errorMsg = error.message
      }

      showNotification(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateVendor = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const vendorData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      category: formData.get('category'),
    }

    try {
      await vendorsApi.updateVendor(editingVendor.id, vendorData)
      showNotification('Vendor updated successfully!')
      setIsEditModalOpen(false)
      setEditingVendor(null)
      loadVendors()
    } catch (error) {
      console.error('Failed to update vendor:', error)
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.errors?.map(e => e.message).join(', ') ||
        'Failed to update vendor'
      showNotification(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
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
            className={`p-4 rounded-xl flex items-center gap-3 ${notification.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-green-500/10 border border-green-500/20'
              }`}
          >
            {notification.type === 'error' ? (
              <Trash2 className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <p className={notification.type === 'error' ? 'text-red-400' : 'text-green-400'}>
              {notification.message}
            </p>
          </motion.div>
        )}

        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-light mb-2">Vendors</h1>
            <p className="text-light/60">Manage your vendor relationships</p>
          </div>
          <AnimatedButton onClick={() => setIsModalOpen(true)} icon={Plus}>
            Add Vendor
          </AnimatedButton>
        </div>

        {}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light/50" />
            <input
              type="text"
              placeholder="Search vendors by name, email, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark/50 border border-mauve/30 rounded-xl pl-12 pr-4 py-3 text-light placeholder-light/50 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/30 transition-all"
            />
          </div>
        </GlassCard>

        {}
        <DataTable
          columns={columns}
          data={filteredVendors}
          onRowClick={handleRowClick}
          loading={loading}
          emptyMessage="No vendors found. Add your first vendor to get started."
        />

        {}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Vendor"
          size="md"
        >
          <form onSubmit={handleAddVendor} className="space-y-4">
            <FloatingInput
              label="Company Name"
              name="name"
              required
              placeholder="e.g., ABC Construction Ltd"
            />
            <FloatingInput
              label="Email Address"
              name="email"
              type="email"
              required
              placeholder="contact@company.com"
            />
            <FloatingInput
              label="Phone Number"
              name="phone"
              placeholder="+91 98765 43210"
            />
            <FloatingInput
              label="Address"
              name="address"
              placeholder="123 Business Street, City"
            />
            <FloatingInput
              label="Category"
              name="category"
              required
              placeholder="e.g., Construction, Security, Cleaning"
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Vendor'}
              </AnimatedButton>
            </div>
          </form>
        </Modal>

        {}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingVendor(null)
          }}
          title="Edit Vendor"
          size="md"
        >
          {editingVendor && (
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <FloatingInput
                label="Company Name"
                name="name"
                defaultValue={editingVendor.name}
                required
              />
              <FloatingInput
                label="Email Address"
                name="email"
                type="email"
                defaultValue={editingVendor.email}
                required
              />
              <FloatingInput
                label="Phone Number"
                name="phone"
                defaultValue={editingVendor.phone}
              />
              <FloatingInput
                label="Address"
                name="address"
                defaultValue={editingVendor.address}
              />
              <FloatingInput
                label="Category"
                name="category"
                defaultValue={editingVendor.category}
                required
              />
              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  variant="secondary"
                  className="flex-1"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingVendor(null)
                  }}
                >
                  Cancel
                </AnimatedButton>
                <AnimatedButton
                  className="flex-1"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </AnimatedButton>
              </div>
            </form>
          )}
        </Modal>

        {}
        <Modal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={selectedVendor?.name}
          size="lg"
        >
          {selectedVendor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Email</p>
                  <p className="text-light flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple" />
                    {selectedVendor.email || 'N/A'}
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-light/50 text-sm mb-1">Phone</p>
                  <p className="text-light flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple" />
                    {selectedVendor.phone || 'N/A'}
                  </p>
                </GlassCard>
              </div>

              <GlassCard className="p-4">
                <p className="text-light/50 text-sm mb-1">Address</p>
                <p className="text-light flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple" />
                  {selectedVendor.address || 'N/A'}
                </p>
              </GlassCard>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark/30 rounded-xl">
                  <p className="text-2xl font-bold text-light">{selectedVendor.rating || 'N/A'}</p>
                  <p className="text-light/50 text-sm">Rating</p>
                </div>
                <div className="text-center p-4 bg-dark/30 rounded-xl">
                  <p className="text-2xl font-bold text-light">{selectedVendor.activeContracts || selectedVendor._count?.contracts || 0}</p>
                  <p className="text-light/50 text-sm">Active Contracts</p>
                </div>
                <div className="text-center p-4 bg-dark/30 rounded-xl">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedVendor.totalSpent || 0)}</p>
                  <p className="text-light/50 text-sm">Total Spent</p>
                </div>
              </div>

              <div className="flex gap-3">
                <AnimatedButton variant="secondary" className="flex-1" onClick={(e) => handleEditClick(selectedVendor, e)}>
                  Edit Vendor
                </AnimatedButton>
                <AnimatedButton className="flex-1" onClick={handleViewContracts}>
                  View Contracts
                </AnimatedButton>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
