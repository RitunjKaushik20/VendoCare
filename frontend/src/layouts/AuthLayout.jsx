import { motion } from 'framer-motion'
import { Logo } from '../components/common/Logo'

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-deepBlue flex items-center justify-center p-4 relative overflow-hidden">
      {}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-softPurple/10 rounded-full blur-3xl" />
      </div>

      {}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {}
        <div className="text-center mb-8">
          <Logo size="xl" showText={true} className="justify-center" />
        </div>

        {}
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

