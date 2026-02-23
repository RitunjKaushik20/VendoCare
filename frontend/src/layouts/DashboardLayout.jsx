import { motion } from 'framer-motion'
import { Sidebar } from '../components/common/Sidebar'
import { TopBar } from '../components/common/TopBar'

export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark">
      <Sidebar />
      
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopBar />
        
        <motion.main
          className="flex-1 p-6 overflow-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
