import { useState, useEffect } from 'react'
import { User, Building2, Bell, Shield, CreditCard, Save } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { GlassCard } from '../../components/ui/GlassCard'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/authApi'

export const Settings = () => {
  const { user, checkAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  // Security State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.updateProfile({
        name: profileData.name,
        phone: profileData.phone
      })
      await checkAuth() // Refresh user context globally
      showMessage('success', 'Profile updated successfully!')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage('error', 'New passwords do not match')
    }

    setLoading(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      showMessage('success', 'Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-light mb-2">Settings</h1>
          <p className="text-light/60">Manage your account and preferences</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <GlassCard className="p-4 h-fit">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                      ? 'bg-rose/20 text-rose'
                      : 'text-light/70 hover:bg-dark/30'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </GlassCard>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-light mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple to-softPurple rounded-2xl flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-light font-medium">{user?.name}</p>
                      <p className="text-light/50 text-sm">{user?.email}</p>
                      <button type="button" className="text-rose text-sm mt-2 hover:text-coral transition-colors">
                        Change Avatar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                    <FloatingInput
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      disabled
                    />
                  </div>
                  <FloatingInput
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                  <div className="flex justify-end pt-4">
                    <AnimatedButton icon={Save} type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </AnimatedButton>
                  </div>
                </form>
              </GlassCard>
            )}

            {activeTab === 'company' && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-light mb-6">Company Information</h2>
                <div className="space-y-4">
                  <FloatingInput
                    label="Company Name"
                    value={user?.company?.name || user?.companyName || 'Your Company'}
                    disabled
                  />
                  <FloatingInput
                    label="Role"
                    value={user?.role}
                    disabled
                  />
                  <div className="p-4 bg-purple/10 border border-purple/30 rounded-xl mt-4">
                    <p className="text-light/70 text-sm mb-2">Notice: Company identifier architecture modification requires administrative override and cannot be modified independently.</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'security' && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-light mb-6">Security Settings</h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="p-4 bg-dark/30 rounded-xl">
                    <h3 className="text-light font-medium mb-2">Change Password</h3>
                    <div className="space-y-3 mt-4">
                      <FloatingInput
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                      <FloatingInput
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                      />
                      <FloatingInput
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <AnimatedButton icon={Save} type="submit" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </AnimatedButton>
                  </div>
                </form>
              </GlassCard>
            )}

            {(activeTab === 'notifications' || activeTab === 'billing') && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-light mb-6">Under Construction</h2>
                <p className="text-light/70 text-sm">This feature segment will be enabled soon. Your current preferences are handled natively by your role defaults.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings;
