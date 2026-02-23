import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const Logo = ({ 
  size = 'md', 
  showText = false, 
  className,
  animated = true,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-20 h-20 text-3xl',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
  }

  const LogoContent = (
    <div 
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-purple via-softPurple to-primary',
          'shadow-lg shadow-purple/30',
          sizeClasses[size]
        )}
        whileHover={animated ? { 
          scale: 1.05, 
          rotate: [0, -5, 5, 0],
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)'
        } : {}}
        whileTap={animated ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
        
        {}
        <span className="relative z-10 text-white font-black tracking-tight">
          VC
        </span>

        {}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            ease: 'linear',
            repeatDelay: 3 
          }}
        />
      </motion.div>

      {}
      {showText && (
        <div className="flex flex-col">
          <motion.span 
            className={cn(
              'font-bold text-light tracking-tight',
              textSizes[size]
            )}
            initial={animated ? { opacity: 0, x: -10 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
          >
            VendoCare
          </motion.span>
          <motion.span 
            className="text-light/50 text-xs font-medium"
            initial={animated ? { opacity: 0, x: -10 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            Vendor Management
          </motion.span>
        </div>
      )}
    </div>
  )

  return LogoContent
}


export const LogoCompact = ({ className, onClick }) => (
  <motion.div
    className={cn(
      'w-8 h-8 flex items-center justify-center rounded-xl',
      'bg-gradient-to-br from-purple to-softPurple',
      'text-white font-black text-sm',
      'shadow-md shadow-purple/20',
      className
    )}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    VC
  </motion.div>
)


export const LogoLarge = ({ className }) => (
  <div className={cn('flex flex-col items-center', className)}>
    <motion.div
      className="relative w-24 h-24 flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple/30 to-softPurple/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {}
      <div className="relative w-20 h-20 bg-gradient-to-br from-purple via-softPurple to-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-purple/40">
        <span className="text-white font-black text-3xl tracking-tight">VC</span>
        
        {}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
      </div>
    </motion.div>
    
    <motion.h1 
      className="mt-4 text-3xl font-bold text-light"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      VendoCare
    </motion.h1>
    <motion.p 
      className="text-light/60 text-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      Smart Vendor Management
    </motion.p>
  </div>
)

