import { Bell, User, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Logo } from './Logo'
import { ROLE_DISPLAY_NAMES } from '../../utils/constants'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const TopBar = ({ className }) => {
  const { user } = useAuthStore()

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple/20 text-purple border-purple/30'
      case 'Finance':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Vendor':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <header
      className={cn(
        'h-16 bg-darkBg/80 backdrop-blur-xl border-b border-softPurple/20',
        'flex items-center justify-between px-6 lg:ml-64',
        className
      )}
    >
      {}
      <div className="flex items-center gap-4">
        {}
        <div className="lg:hidden">
          <Logo size="sm" />
        </div>
        
        {}
        <div className="hidden md:block">
          <p className="text-light/50 text-sm">Welcome back,</p>
          <p className="text-light font-medium">{user?.name || 'User'}</p>
        </div>
      </div>

      {}
      <div className="flex items-center gap-4">
        {}
        <button className="relative p-2 rounded-xl hover:bg-purple/10 transition-colors">
          <Bell className="w-5 h-5 text-light/70" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-purple rounded-full" />
        </button>

        {}
        <div className="flex items-center gap-3 pl-4 border-l border-softPurple/20">
          <div className="text-right hidden sm:block">
            <p className="text-light font-medium text-sm">{user?.companyName || 'Company'}</p>
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-xs font-medium border',
                getRoleBadgeColor(user?.role)
              )}
            >
              {ROLE_DISPLAY_NAMES[user?.role] || user?.role || 'User'}
            </span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-softPurple rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-dark" />
          </div>
          <ChevronDown className="w-4 h-4 text-light/50 hidden sm:block" />
        </div>
      </div>
    </header>
  )
}
