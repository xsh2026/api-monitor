import { motion, useReducedMotion } from 'framer-motion'

interface StatusIndicatorProps {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  onRefresh: () => void
  retryCount?: number
  viewMode?: string
}

export function StatusIndicator({ loading, error, lastUpdated, onRefresh, retryCount = 0, viewMode = 'normal' }: StatusIndicatorProps) {
  const preferReducedMotion = useReducedMotion()
  const isMinimal = viewMode === 'minimal'
  const isCompact = viewMode === 'compact'

  // Status dot color
  const dotColor = loading ? 'bg-blue-500' : error ? 'bg-red-500' : 'bg-emerald-500'

  // ── Minimal mode ──
  if (isMinimal) {
    return (
      <div className="flex items-center justify-between px-0 h-4">
        <div className="flex items-center gap-1 min-w-0">
          <motion.div
            className={`relative w-1.5 h-1.5 flex-shrink-0 rounded-full ${dotColor}`}
            animate={!preferReducedMotion && loading ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          {loading ? (
            <span className="text-[10px] text-blue-400/70 truncate">
              {retryCount > 0 ? `Retry ${retryCount}/3` : 'Refreshing'}
            </span>
          ) : error ? (
            <span className="text-[10px] text-red-400/70 truncate max-w-[160px]" title={error}>
              {error}
            </span>
          ) : (
            <span className="text-[10px] text-[rgb(var(--text-secondary))]">
              {lastUpdated ? formatTime(lastUpdated) : ''}
            </span>
          )}
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          whileTap={preferReducedMotion ? {} : { scale: 0.85 }}
          className="text-[10px] px-1.5 py-0.5 rounded text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/5 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          Refresh
        </motion.button>
      </div>
    )
  }

  // ── Compact mode ──
  if (isCompact) {
    return (
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="relative w-1.5 h-1.5">
            <div className={`absolute inset-0 rounded-full ${dotColor}`} />
            <div className={`absolute inset-0 rounded-full ${dotColor} ${loading ? 'animate-ping opacity-30' : ''}`} />
          </div>
          <span className="text-[10px] text-[rgb(var(--text-secondary))]">
            {loading ? 'Refreshing...' : error ? (
              <span className="text-red-500 truncate max-w-[160px] inline-block">{error}</span>
            ) : lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Awaiting first query'}
          </span>
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          whileTap={preferReducedMotion ? {} : { scale: 0.9 }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh
        </motion.button>
      </div>
    )
  }

  // ── Normal mode ──
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <div className="relative w-2 h-2">
          <div className={`absolute inset-0 rounded-full ${dotColor}`} />
          <div className={`absolute inset-0 rounded-full ${dotColor} ${loading ? 'animate-ping opacity-30' : ''}`} />
        </div>
        <span className="text-xs text-[rgb(var(--text-secondary))]">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
              </svg>
              {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Refreshing...'}
            </span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : lastUpdated
            ? `Updated ${formatTime(lastUpdated)}`
            : 'Awaiting first query'
          }
        </span>
      </div>

      <motion.button
        onClick={onRefresh}
        disabled={loading}
        whileTap={preferReducedMotion ? {} : { scale: 0.9 }}
        className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.18)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Refresh
      </motion.button>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
