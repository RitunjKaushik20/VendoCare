import { motion } from 'framer-motion'

export const LoadingSpinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={className}>
      <motion.div
        className={`${sizes[size]} border-2 border-purple/30 border-t-purple rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-light/60 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
