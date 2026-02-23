import { motion } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  FileUp,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react'
import { getSidebarItemsForRole } from '../../utils/constants'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { Logo } from './Logo'

const iconMap = {
  LayoutDashboard,
  Users,
  FileText,
  FileUp,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
}

export const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()
  const { logout, forceLogout, user } = useAuthStore()
  
  
  const sidebarItems = getSidebarItemsForRole(user?.role)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      
      forceLogout()
      
      localStorage.removeItem('auth-storage')
      
      localStorage.setItem('force-clear-auth', 'true')
      
      navigate('/login', { replace: true })
      
      window.location.reload()
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {}
      <div className="p-6 border-b border-softPurple/20">
        <Logo size="md" showText={true} onClick={() => navigate('/dashboard')} />
      </div>

      {}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {sidebarItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-8 bg-purple rounded-r-full"
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {}
      <div className="p-4 border-t border-softPurple/20">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {}
      <motion.aside
        className="hidden lg:flex flex-col w-64 bg-darkBg border-r border-softPurple/20 fixed left-0 top-0 h-screen z-30"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {sidebarContent}
      </motion.aside>

      {}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <motion.aside
        className={`
          lg:hidden fixed left-0 top-0 h-screen w-64 bg-deepBlue border-r border-mauve/20 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-purple/10"
          >
            <X className="w-5 h-5 text-light" />
          </button>
        </div>
        {sidebarContent}
      </motion.aside>

      {}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-darkBg border border-softPurple/20 rounded-lg"
      >
        <Menu className="w-5 h-5 text-light" />
      </button>
    </>
  )
}
