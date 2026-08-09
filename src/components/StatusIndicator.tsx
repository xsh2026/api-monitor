import { motion } from 'framer-motion'

interface StatusIndicatorProps {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  onRefresh: () => void
  retryCount?: number
  viewMode?: string
}

export function StatusIndicator({ loading, error, lastUpdated, onRefresh, retryCount = 0, viewMode = 'normal' }: StatusIndicatorProps) {
  const isMinimal = viewMode === 'minimal'
  const isCompact = viewMode === 'compact'

  // 极简模式：与内容融为一体的微型状态行
  if (isMinimal) {
    return (
      <div className="flex items-center justify-between px-0 h-4">
        <div className="flex items-center gap-1 min-w-0">
          <motion.div
            className="relative w-1.5 h-1.5 flex-shrink-0"
            animate={loading ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <div className={`
              absolute inset-0 rounded-full
              ${loading ? 'bg-blue-400' : error ? 'bg-red-400' : 'bg-emerald-400'}
            `} />
          </motion.div>
          {loading ? (
            <span className="text-[10px] text-blue-400/70 truncate">
              {retryCount > 0 ? `重试${retryCount}/3` : '刷新'}
            </span>
          ) : error ? (
            <span className="text-[10px] text-red-400/70 truncate max-w-[160px]" title={error}>
              {error}
            </span>
          ) : (
            <span className="text-[10px] text-gray-600 dark:text-gray-400">
              {lastUpdated ? formatTime(lastUpdated) : ''}
            </span>
          )}
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          whileTap={{ scale: 0.85 }}
          className="text-[10px] px-1.5 py-0.5 rounded text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/5 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          刷新
        </motion.button>
      </div>
    )
  }

  // 紧凑模式
  if (isCompact) {
    return (
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="relative w-1.5 h-1.5"
            animate={loading ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <div className={`
              absolute inset-0 rounded-full
              ${loading ? 'bg-blue-400' : error ? 'bg-red-400' : 'bg-emerald-400'}
            `} />
            <div className={`
              absolute inset-0 rounded-full animate-ping opacity-30
              ${loading ? 'bg-blue-400' : error ? 'bg-red-400' : 'bg-emerald-400'}
            `} />
          </motion.div>
          <span className="text-[10px] text-gray-600 dark:text-gray-400">
            {loading ? '刷新中...' : error ? (
              <span className="text-red-400 truncate max-w-[160px] inline-block">{error}</span>
            ) : lastUpdated ? `更新于 ${formatTime(lastUpdated)}` : '等待首次查询'}
          </span>
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          whileTap={{ scale: 0.9 }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          刷新
        </motion.button>
      </div>
    )
  }

  // 正常模式
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <motion.div
          className="relative w-2 h-2"
          animate={loading ? { scale: [1, 1.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <div className={`
            absolute inset-0 rounded-full
            ${loading ? 'bg-blue-400' : error ? 'bg-red-400' : 'bg-emerald-400'}
          `} />
          <div className={`
            absolute inset-0 rounded-full animate-ping opacity-30
            ${loading ? 'bg-blue-400' : error ? 'bg-red-400' : 'bg-emerald-400'}
          `} />
        </motion.div>

        <span className="text-xs text-gray-600 dark:text-gray-400">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
              </svg>
              {retryCount > 0 ? `重试中 (${retryCount}/3)...` : '刷新中...'}
            </span>
          ) : error ? (
            <span className="text-red-400">{error}</span>
          ) : lastUpdated
            ? `更新于 ${formatTime(lastUpdated)}`
            : '等待首次查询'
          }
        </span>
      </div>

      <motion.button
        onClick={onRefresh}
        disabled={loading}
        whileTap={{ scale: 0.9 }}
        className="text-xs px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        刷新
      </motion.button>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return `${seconds}s 前`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m 前`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
