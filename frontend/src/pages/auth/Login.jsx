import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../../layouts/AuthLayout'
import { FloatingInput } from '../../components/ui/FloatingInput'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { useAuth } from '../../hooks/useAuth'

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error } = useAuth()

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(formData)
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to manage your vendors"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-light/60 cursor-pointer">
            <input type="checkbox" className="rounded border-softPurple/30 bg-dark/50 text-purple focus:ring-purple" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-purple hover:text-softPurple transition-colors">
            Forgot password?
          </Link>
        </div>

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
          Sign In
        </AnimatedButton>
      </form>

      <p className="mt-6 text-center text-light/60 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-purple hover:text-softPurple font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
