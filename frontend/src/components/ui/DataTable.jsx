import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const DataTable = ({
  columns,
  data,
  onRowClick,
  keyExtractor = (item, index) => index,
  emptyMessage = 'No data available',
  loading = false,
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple/30 border-t-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-light/50">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-softPurple/20">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'text-left py-4 px-6 text-sm font-medium text-light/70',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <motion.tr
                key={keyExtractor(item, rowIndex)}
                className={cn(
                  'border-b border-softPurple/10 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-purple/5'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                onClick={() => onRowClick?.(item)}
                whileHover={onRowClick ? { x: 4 } : undefined}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="py-4 px-6 text-sm text-light/80">
                    {column.cell ? column.cell(item) : item[column.accessor]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-softPurple/20">
          <p className="text-sm text-light/50">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-purple/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-light" />
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-purple/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-light" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
