import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Building2, User, Mail, Lock, Eye, EyeOff, ChevronDown, Shield, DollarSign, Truck } from 'lucide-react'
import { AuthLayout } from '../../layouts/AuthLayout'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { useAuth } from '../../hooks/useAuth'
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../../utils/constants'

export const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.ADMIN,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const { register, isLoading, error } = useAuth()

  const roleOptions = [
    { value: ROLES.ADMIN, icon: Shield, color: 'text-purple' },
    { value: ROLES.FINANCE, icon: DollarSign, color: 'text-green-400' },
    { value: ROLES.VENDOR, icon: Truck, color: 'text-blue-400' },
  ]

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }))
    setShowRoleDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      
      return
    }
    const { confirmPassword, ...registerData } = formData
    await register(registerData)
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start managing your vendors today"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FloatingInput
          label="Company Name"
          name="companyName"
          type="text"
          value={formData.companyName}
          onChange={handleChange}
          icon={Building2}
          required
        />

        <FloatingInput
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          icon={User}
          required
        />

        {}
        <div className="relative">
          <label className="block text-sm font-medium text-light/80 mb-2">
            Select Your Role
          </label>
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="w-full p-3 rounded-xl bg-dark/50 border border-softPurple/30 text-light text-left flex items-center justify-between hover:border-purple/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {(() => {
                const selectedRole = roleOptions.find(r => r.value === formData.role)
                const Icon = selectedRole?.icon || Shield
                return (
                  <>
                    <Icon className={`w-5 h-5 ${selectedRole?.color || 'text-purple'}`} />
                    <span>{ROLE_DISPLAY_NAMES[formData.role]}</span>
                  </>
                )
              })()}
            </div>
            <ChevronDown className={`w-5 h-5 text-light/50 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showRoleDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-darkBg border border-softPurple/30 shadow-xl z-20"
            >
              {roleOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleRoleSelect(option.value)}
                    className={`w-full p-3 rounded-lg text-left flex items-start gap-3 transition-colors ${
                      formData.role === option.value 
                        ? 'bg-purple/20 border border-purple/30' 
                        : 'hover:bg-purple/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${option.color} mt-0.5`} />
                    <div>
                      <p className="text-light font-medium">{ROLE_DISPLAY_NAMES[option.value]}</p>
                      <p className="text-light/50 text-xs">{ROLE_DESCRIPTIONS[option.value]}</p>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>

        <FloatingInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          icon={Mail}
          required
        />

        <div className="relative">
          <FloatingInput
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            icon={Lock}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-light/50 hover:text-light transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <FloatingInput
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={Lock}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-light/50 hover:text-light transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <label className="flex items-start gap-3 text-sm text-light/60 cursor-pointer">
          <input 
            type="checkbox" 
            className="mt-0.5 rounded border-softPurple/30 bg-dark/50 text-purple focus:ring-purple" 
            required 
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-purple hover:text-softPurple transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-purple hover:text-softPurple transition-colors">
              Privacy Policy
            </Link>
          </span>
        </label>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatedButton
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          Create Account
        </AnimatedButton>
      </form>

      <p className="mt-6 text-center text-light/60 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-purple hover:text-softPurple font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
