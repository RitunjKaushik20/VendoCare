import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, delay = 0 }) => {
  return (
    <motion.div
      className="glass-card p-6 hover:border-purple/40 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-light/60 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-light mb-2">{value}</h3>
          {subtitle && <p className="text-light/50 text-xs">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', trendUp ? 'text-green-400' : 'text-red-400')}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-purple/20 rounded-xl">
            <Icon className="w-6 h-6 text-purple" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
