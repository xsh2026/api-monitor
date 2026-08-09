import { useBalance } from '@/hooks/useBalance'
import { useUsage } from '@/hooks/useUsage'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useSettings } from '@/context/SettingsContext'
import { Header } from '@/components/Header'
import { BalanceCard } from '@/components/BalanceCard'
import { UsageCard } from '@/components/UsageCard'
import { StatusIndicator } from '@/components/StatusIndicator'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Pin } from 'lucide-react'

export default function App() {
  const { settings, togglePin, isPinned, reorderAccounts } = useSettings()
  const { accountBalances, loading, error, lastUpdated, fetchBalance, retryCount } = useBalance()
  const usage = useUsage()
  const preferReducedMotion = useReducedMotion()

  useAutoRefresh(() => {
    fetchBalance()
    usage.fetchUsage()
  }, settings.accounts.length > 0)

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onRefreshData(() => {
      fetchBalance()
      usage.fetchUsage()
    })
    return unsubscribe
  }, [fetchBalance, usage.fetchUsage, settings.accounts])

  const viewMode = settings.viewMode
  const isMinimal = viewMode === 'minimal'
  const isCompact = viewMode === 'compact'
  const hasUsage = usage.summary && usage.summary.totalTokens > 0

  // Sort: pinned first, then by accountOrder
  const sortedBalances = [...accountBalances].sort((a, b) => {
    const aPinned = isPinned(a.accountId) ? 1 : 0
    const bPinned = isPinned(b.accountId) ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    const order = settings.accountOrder || []
    const aIdx = order.indexOf(a.accountId)
    const bIdx = order.indexOf(b.accountId)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return 0
  })

  // Auto-resize window on view mode change
  const prevViewModeRef = useRef(viewMode)
  useEffect(() => {
    if (prevViewModeRef.current === viewMode) return
    prevViewModeRef.current = viewMode

    const timer = setTimeout(() => {
      if (viewMode === 'minimal') {
        const cardCount = sortedBalances.length
        const usageRow = hasUsage ? 1 : 0
        const contentHeight = 24 + 16 + cardCount * 24 + usageRow * 24 + 14 + 6
        const minH = 120
        const maxH = Math.min(800, Math.max(minH, contentHeight + 30))
        window.electronAPI?.resizeWindow(260, maxH)
      } else if (viewMode === 'compact') {
        window.electronAPI?.resizeWindow(400, 500)
      } else {
        window.electronAPI?.resizeWindow(420, 680)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [viewMode, sortedBalances.length, hasUsage])

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: settings.darkMode
          ? 'rgb(13 15 20 / 0.92)'
          : 'rgb(248 249 251 / 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        color: `var(--tw-text, ${settings.darkMode ? '#ededf2' : '#0f0f14'})`,
      }}
    >
      {!isMinimal && (
        <div className="h-px bg-gradient-to-r from-transparent via-[rgb(var(--accent)/0.3)] to-transparent" />
      )}

      <Header />

      <motion.div
        className={`flex-1 overflow-y-auto scrollbar-thin ${
          isMinimal ? 'px-1 py-1 space-y-0.5' : isCompact ? 'px-4 py-2 space-y-2' : 'px-4 py-3 space-y-3'
        }`}
        animate={false}
        transition={{ duration: 0.3 }}
      >
        <StatusIndicator
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          onRefresh={fetchBalance}
          retryCount={retryCount}
          viewMode={viewMode}
        />

        <AnimatePresence mode="wait">
          {settings.accounts.length === 0 ? (
            <motion.div
              key="empty"
              initial={preferReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={preferReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
              className={isMinimal
                ? 'flex items-center justify-center py-2 text-center'
                : isCompact
                  ? 'flex flex-col items-center justify-center py-10 text-center'
                  : 'flex flex-col items-center justify-center py-16 text-center'
              }
            >
              {isMinimal ? (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  点击设置 - 添加 API Key
                </span>
              ) : (
                <>
                  <motion.div
                    animate={preferReducedMotion ? {} : { y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className={`rounded-2xl bg-gradient-to-br from-blue-400/10 to-indigo-400/10 dark:from-blue-400/5 dark:to-indigo-400/5 flex items-center justify-center ${isCompact ? 'w-14 h-14 mb-4' : 'w-20 h-20 mb-6'}`}
                  >
                    <svg width={isCompact ? 28 : 40} height={isCompact ? 28 : 40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400/40">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </motion.div>
                  <h3 className={`font-semibold text-gray-500 dark:text-gray-400 mb-2 ${isCompact ? 'text-base' : 'text-lg'}`}>
                    添加 API Key 开始监控
                  </h3>
                  <p className={`text-gray-500/80 dark:text-gray-600 max-w-[280px] ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    点击右上角设置图标，添加 API Key 即可查看余额和用量
                  </p>
                </>
              )}
            </motion.div>
          ) : sortedBalances.length > 0 ? (
            isMinimal ? (
              <motion.div
                key="data-minimal"
                initial={preferReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-0.5"
              >
                {sortedBalances.map((acct, i) => (
                  <div key={acct.accountId}>
                    {acct.data && acct.data.length > 0 ? (
                      acct.data.map((info, j) => (
                        <div key={info.currency}>
                          <BalanceCard
                            info={info}
                            isAvailable={acct.isAvailable}
                            loading={acct.loading}
                            index={i + j}
                            viewMode={viewMode}
                            accountLabel={acct.accountLabel}
                            accountCount={settings.accounts.length}
                            provider={acct.provider}
                            isPinned={isPinned(acct.accountId)}
                            onTogglePin={() => togglePin(acct.accountId)}
                          />
                        </div>
                      ))
                    ) : null}
                  </div>
                ))}
                {hasUsage && usage.summary && (
                  <UsageCard
                    summary={usage.summary}
                    loading={usage.loading}
                    index={sortedBalances.length}
                    viewMode={viewMode}
                  />
                )}
              </motion.div>
            ) : (
              <Reorder.Group
                key="data"
                axis="y"
                values={sortedBalances.map(a => a.accountId)}
                onReorder={(newOrder) => reorderAccounts(newOrder)}
                className={isCompact ? 'space-y-2' : 'space-y-3'}
                initial={false}
              >
                {sortedBalances.map((acct, i) => (
                  <Reorder.Item key={acct.accountId} value={acct.accountId} initial={false}>
                    {sortedBalances.length > 1 && (
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 px-1">
                        {isPinned(acct.accountId) && (
                          <span className="inline-flex items-center gap-0.5 mr-1 text-blue-500"><Pin className="w-2 h-2 fill-current" /></span>
                        )}
                        {acct.accountLabel}
                      </div>
                    )}
                    {acct.data && acct.data.length > 0 ? (
                      acct.data.map((info, j) => (
                        <div key={info.currency} className={isCompact ? '' : 'mb-3'}>
                          <BalanceCard
                            info={info}
                            isAvailable={acct.isAvailable}
                            loading={acct.loading}
                            index={i + j}
                            viewMode={viewMode}
                            accountLabel={acct.accountLabel}
                            accountCount={settings.accounts.length}
                            provider={acct.provider}
                            isPinned={isPinned(acct.accountId)}
                            onTogglePin={() => togglePin(acct.accountId)}
                          />
                        </div>
                      ))
                    ) : acct.loading ? (
                      <BalanceCard
                        info={{ currency: 'CNY', total_balance: '0', granted_balance: '0', topped_up_balance: '0' }}
                        isAvailable={false}
                        loading={true}
                        index={i}
                        viewMode={viewMode}
                        accountLabel={acct.accountLabel}
                        accountCount={settings.accounts.length}
                        provider={acct.provider}
                        isPinned={isPinned(acct.accountId)}
                        onTogglePin={() => togglePin(acct.accountId)}
                      />
                    ) : acct.error ? (
                      <BalanceCard
                        info={{ currency: 'CNY', total_balance: '0', granted_balance: '0', topped_up_balance: '0' }}
                        isAvailable={false}
                        loading={false}
                        index={i}
                        viewMode={viewMode}
                        accountLabel={acct.accountLabel}
                        accountCount={settings.accounts.length}
                        errorMessage={acct.error}
                        provider={acct.provider}
                        isPinned={isPinned(acct.accountId)}
                        onTogglePin={() => togglePin(acct.accountId)}
                      />
                    ) : null}
                  </Reorder.Item>
                ))}
                {hasUsage && usage.summary && (
                  <UsageCard
                    summary={usage.summary}
                    loading={usage.loading}
                    index={sortedBalances.length}
                    viewMode={viewMode}
                  />
                )}
              </Reorder.Group>
            )
          ) : (
            !loading && !error && (
              <motion.div
                key="no-data"
                initial={preferReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </motion.div>

      {!isMinimal && (
        <div className="px-4 py-2 border-t border-gray-200/50 dark:border-white/[0.05] flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-600">
          <span>API Monitor v1.7 - {settings.accounts.length} 个账户</span>
          <span>{settings.accounts.length > 0 ? `自动刷新: ${settings.refreshInterval}s` : '未配置'}</span>
        </div>
      )}

      {isMinimal && settings.accounts.length > 0 && (
        <div className="px-1 py-0.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-600 border-t border-gray-200/30 dark:border-white/[0.03]">
          <span>{lastUpdated ? `更新 ${formatTime(lastUpdated)}` : ''}</span>
          <span>{settings.refreshInterval}s</span>
        </div>
      )}
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
