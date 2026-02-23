import { useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const FloatingInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  required = false,
  className,
  icon: Icon,
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const isActive = isFocused || value

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-light/50">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={cn(
            'w-full bg-dark/50 border rounded-xl px-4 py-4 text-light',
            'focus:outline-none transition-all duration-300',
            Icon && 'pl-12',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border-softPurple/30 focus:border-purple focus:ring-2 focus:ring-purple/30'
          )}
          placeholder=" "
        />
        <motion.label
          htmlFor={name}
          className={cn(
            'absolute left-4 text-light/50 pointer-events-none transition-all duration-300',
            Icon && 'left-12',
            isActive ? 'top-1 text-xs text-purple' : 'top-1/2 -translate-y-1/2 text-base'
          )}
          animate={{
            y: isActive ? 0 : Icon ? 0 : '0%',
            scale: isActive ? 0.85 : 1,
          }}
        >
          {label}
          {required && <span className="text-purple ml-1">*</span>}
        </motion.label>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
