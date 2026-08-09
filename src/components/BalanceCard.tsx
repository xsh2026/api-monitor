import { motion } from 'framer-motion'
import type { BalanceInfo, ProviderId } from '@/types'
import { PROVIDERS } from '@/types'
import { AnimatedNumber } from './AnimatedNumber'
import { Wallet, Gift, CreditCard, Circle, Pin, ExternalLink, GripVertical } from 'lucide-react'

interface BalanceCardProps {
  info: BalanceInfo
  isAvailable: boolean
  loading: boolean
  index: number
  viewMode: string
  accountLabel?: string
  accountCount?: number
  errorMessage?: string
  provider?: ProviderId
  isPinned?: boolean
  onTogglePin?: () => void
}

const currencySymbol: Record<string, string> = {
  CNY: '¥',
  USD: '$',
}

export function BalanceCard({ info, isAvailable, loading, index, viewMode = 'normal', accountLabel, accountCount = 1, errorMessage, provider = 'deepseek', isPinned, onTogglePin }: BalanceCardProps) {
  const symbol = currencySymbol[info.currency] || info.currency + ' '
  const total = parseFloat(info.total_balance) || 0
  const granted = parseFloat(info.granted_balance) || 0
  const toppedUp = parseFloat(info.topped_up_balance) || 0

  const isMinimal = viewMode === 'minimal'
  const isCompact = viewMode === 'compact'
  const providerMeta = PROVIDERS[provider]

  const healthColor = total > 100
    ? 'text-emerald-400'
    : total > 10
      ? 'text-amber-400'
      : 'text-red-400'

  // 极简模式：横向一行布局，信息完整不换行
  if (isMinimal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded group
          bg-white/30 dark:bg-white/[0.02]
          border border-gray-200/20 dark:border-white/[0.03]
          hover:border-blue-400/30 dark:hover:border-blue-400/20 transition-colors"
      >
        {/* 状态小圆点 */}
        <Circle className={`w-1.5 h-1.5 fill-current flex-shrink-0 ${isAvailable ? 'text-emerald-400' : errorMessage ? 'text-red-400' : 'text-gray-400'}`} />

        {/* 厂商徽章 */}
        <span
          className="text-[9px] px-1 py-px rounded-sm font-semibold text-white/85 flex-shrink-0 leading-tight"
          style={{ backgroundColor: providerMeta?.color || '#3b82f6' }}
        >
          {providerMeta?.name || provider}
        </span>

        {/* 账户名称 — 可省略 */}
        {accountCount > 1 && accountLabel && (
          <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[80px] flex-shrink" title={accountLabel}>
            {accountLabel}
          </span>
        )}

        {/* 错误提示 */}
        {errorMessage && (
          <span className="text-[9px] text-red-400 flex-shrink-0 truncate max-w-[80px]" title={errorMessage}>!</span>
        )}

        {/* 弹性占位 */}
        <div className="flex-1 min-w-[4px]" />

        {/* 余额 / 状态 */}
        {loading ? (
          <span className="inline-block w-10 h-3 bg-gray-200 dark:bg-white/10 rounded animate-pulse flex-shrink-0" />
        ) : providerMeta?.showBalance === false ? (
          <span className={`text-[9px] font-semibold flex-shrink-0 ${isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
            {isAvailable ? '可用' : '不可用'}
          </span>
        ) : (
          <span className="text-[10px] font-bold tracking-tight flex-shrink-0" style={{ color: 'var(--accent-color)' }}>
            <AnimatedNumber value={total} prefix={symbol} decimals={2} />
          </span>
        )}

        {/* 赠金/充值 */}
        {providerMeta?.showBalance !== false && (granted > 0 || toppedUp > 0) && (
          <span className="flex-shrink-0 text-[9px] leading-tight text-gray-500 dark:text-gray-400">
            <span className="text-violet-500/70 font-medium">{symbol}{granted.toFixed(0)}</span>
            <span className="mx-0.5 opacity-30">|</span>
            <span className="font-medium" style={{ color: 'var(--accent-color)' }}>{symbol}{toppedUp.toFixed(0)}</span>
          </span>
        )}

        {/* 官网按钮（仅图标） */}
        <button
          onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternal(providerMeta.accountUrl) }}
          className="flex-shrink-0 p-1 rounded border border-gray-300/50 dark:border-gray-600/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:border-blue-400/50 hover:text-blue-400 transition-all"
          title={`前往 ${providerMeta.name} 平台`}
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
        {/* 置顶按钮（仅图标） */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin?.() }}
          className={`flex-shrink-0 p-1 rounded border transition-all ${
            isPinned
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-500 opacity-100'
              : 'border-gray-300/50 dark:border-gray-600/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:border-blue-400/50 hover:text-blue-400'
          }`}
          title={isPinned ? '取消置顶' : '置顶'}
        >
          <Pin className={`w-2.5 h-2.5 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      </motion.div>
    )
  }

  // 正常/紧凑模式
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-xl
        border border-white/20 dark:border-white/[0.06]
        shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
        transition-shadow duration-300
        group
        ${isCompact ? 'p-3.5' : 'p-5'}
      `}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08] blur-3xl group-hover:opacity-[0.15] transition-opacity duration-500"
        style={{ background: `var(--accent-color)` }}
      />

      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/[0.02] to-transparent animate-shimmer bg-[length:200%_100%]" />
      )}

      <div className={`relative flex items-center justify-between ${isCompact ? 'mb-2.5' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <div
            className={`
              flex items-center justify-center cursor-grab active:cursor-grabbing
              shadow-lg shadow-current/20
              ${isCompact ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 rounded-xl'}
            `}
            style={{ backgroundColor: `var(--accent-color)` }}
            title="长按拖动排序"
          >
            <GripVertical className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="text-[9px] px-1.5 py-px rounded font-medium text-white/80"
                style={{ backgroundColor: PROVIDERS[provider]?.color || '#3b82f6' }}
              >
                {PROVIDERS[provider]?.name || provider}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {accountCount > 1 && accountLabel ? `${accountLabel} · ` : ''}{info.currency} 余额
            </div>
            <div className="flex items-center gap-1.5">
              {errorMessage ? (
                <>
                  <Circle className="w-1.5 h-1.5 fill-current text-red-400" />
                  <span className="text-[10px] text-red-400">{errorMessage}</span>
                </>
              ) : (
                <>
                  <Circle className={`w-1.5 h-1.5 fill-current ${healthColor}`} />
                  <span className={`text-[10px] ${isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
                    {isAvailable ? '可用' : '不可用'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {providerMeta?.showBalance === false ? (
        /* 预付费/订阅制：只显示可用状态 */
        <div className="relative flex flex-col items-center justify-center py-4">
          {loading ? (
            <span className="inline-block w-20 h-6 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          ) : (
            <>
              <span className={`text-lg font-bold ${isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
                {isAvailable ? '可用' : '不可用'}
              </span>
              {providerMeta?.balanceNote && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-center">
                  {providerMeta.balanceNote}
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className={`relative ${isCompact ? 'mb-2.5' : 'mb-4'}`}>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
              总余额
            </div>
            <div
              className={`font-bold tracking-tight ${isCompact ? 'text-2xl' : 'text-3xl'}`}
              style={{ color: `var(--accent-color)` }}
            >
              {loading ? (
                <span className="inline-block w-24 h-8 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              ) : (
                <AnimatedNumber value={total} prefix={symbol} decimals={2} />
              )}
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <DetailItem icon={<Gift className="w-3 h-3" />} label="赠金" value={granted} symbol={symbol} loading={loading} compact={isCompact} />
            <DetailItem icon={<CreditCard className="w-3 h-3" />} label="充值" value={toppedUp} symbol={symbol} loading={loading} compact={isCompact} />
          </div>

          {!isCompact && toppedUp + granted > 0 && (
            <div className="relative mt-4">
              <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                <span>赠金占比</span>
                <span>{((granted / (granted + toppedUp)) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200/50 dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: `var(--accent-color)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(granted / (granted + toppedUp)) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* 底部提示行 */}
      <div className="relative mt-3 pt-2 border-t border-gray-200/30 dark:border-white/[0.04] flex items-center justify-center gap-2">
        {/* 拖拽提示 */}
        <span className="text-[9px] text-gray-300 dark:text-gray-600 select-none">长按左侧图标拖拽排序</span>
        {/* 前往官网按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternal(providerMeta.accountUrl) }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border
            border-gray-300/50 dark:border-gray-600/50 text-gray-400
            opacity-0 group-hover:opacity-100 hover:border-blue-400/50 hover:text-blue-400 transition-all"
          title={`前往 ${providerMeta.name} 平台`}
        >
          <ExternalLink className="w-3 h-3" />
          官网
        </button>
        {/* 置顶按钮（正常/紧凑模式） */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin?.() }}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
            isPinned
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-500'
              : 'border-gray-300/50 dark:border-gray-600/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:border-blue-400/50 hover:text-blue-400'
          }`}
          title={isPinned ? '取消置顶' : '置顶'}
        >
          <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
          置顶
        </button>
      </div>
    </motion.div>
  )
}

function DetailItem({
  icon, label, value, symbol, loading, compact = false
}: {
  icon: React.ReactNode; label: string; value: number; symbol: string; loading: boolean; compact?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] ${compact ? 'p-2' : 'p-2.5'}`}>
      <div style={{ color: `var(--accent-color)` }} className="opacity-70">{icon}</div>
      <div className="min-w-0">
        <div className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{label}</div>
        <div className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: `var(--accent-color)` }}>
          {loading ? (
            <span className="inline-block w-14 h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          ) : (
            <AnimatedNumber value={value} prefix={symbol} decimals={2} />
          )}
        </div>
      </div>
    </div>
  )
}
