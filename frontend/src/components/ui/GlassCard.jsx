import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const GlassCard = ({ children, className, hover = true, onClick }) => {
  return (
    <motion.div
      className={cn(
        'glass-card p-6',
        hover && 'hover:border-purple/40 hover:shadow-purple/20',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
