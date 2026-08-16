import { motion, useReducedMotion } from 'framer-motion'
import type { BalanceInfo, ProviderId } from '@/types'
import { PROVIDERS } from '@/types'
import { AnimatedNumber } from './AnimatedNumber'
import { Gift, CreditCard, Circle, Pin, ExternalLink, GripVertical } from 'lucide-react'

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
  sessionSpent?: number
  cumulativeSpent?: number
}

const currencySymbol: Record<string, string> = {
  CNY: '¥',
  USD: '$',
}

export function BalanceCard({ info, isAvailable, loading, index, viewMode = 'normal', accountLabel, accountCount = 1, errorMessage, provider = 'deepseek', isPinned, onTogglePin, sessionSpent, cumulativeSpent }: BalanceCardProps) {
  const preferReducedMotion = useReducedMotion()
  const symbol = currencySymbol[info.currency] || info.currency + ' '
  const total = parseFloat(info.total_balance) || 0
  const granted = parseFloat(info.granted_balance) || 0
  const toppedUp = parseFloat(info.topped_up_balance) || 0

  const isMinimal = viewMode === 'minimal'
  const isCompact = viewMode === 'compact'
  const providerMeta = PROVIDERS[provider]

  const healthColor = total > 100
    ? 'text-emerald-500'
    : total > 10
      ? 'text-amber-500'
      : 'text-red-500'

  // ── Minimal Mode ──
  if (isMinimal) {
    return (
      <motion.div
        initial={preferReducedMotion ? false : { opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md group
          bg-[rgb(var(--surface-overlay)/0.5)]
          border border-[rgb(var(--border-subtle)/0.06)]
          hover:border-[rgb(var(--accent)/0.2)] transition-colors duration-150"
      >
        {/* Status dot */}
        <Circle className={`w-1.5 h-1.5 fill-current flex-shrink-0 ${isAvailable ? 'text-emerald-500' : errorMessage ? 'text-red-500' : 'text-gray-400'}`} />

        {/* Provider badge */}
        <span
          className="text-[9px] px-1 py-px rounded font-semibold text-white/85 flex-shrink-0 leading-tight"
          style={{ backgroundColor: providerMeta?.color || '#3b82f6' }}
        >
          {providerMeta?.name || provider}
        </span>

        {/* Account label */}
        {accountCount > 1 && accountLabel && (
          <span className="text-[9px] text-[rgb(var(--text-secondary))] truncate max-w-[80px] flex-shrink" title={accountLabel}>
            {accountLabel}
          </span>
        )}

        {/* Error */}
        {errorMessage && (
          <span className="text-[9px] text-red-500 flex-shrink-0 truncate max-w-[80px]" title={errorMessage}>|</span>
        )}

        <div className="flex-1 min-w-[4px]" />

        {/* Balance / Status */}
        {loading ? (
          <span className="skeleton inline-block w-10 h-3 flex-shrink-0" />
        ) : providerMeta?.showBalance === false ? (
          <span className={`text-[9px] font-semibold flex-shrink-0 ${isAvailable ? 'text-emerald-500' : 'text-red-500'}`}>
            {isAvailable ? '可用' : '不可用'}
          </span>
        ) : (
          <span className="text-[10px] font-bold tracking-tight flex-shrink-0" style={{ color: `rgb(var(--accent))` }}>
            <AnimatedNumber value={total} prefix={symbol} decimals={2} />
          </span>
        )}

        {/* Sub-balances */}
        {providerMeta?.showBalance !== false && (granted > 0 || toppedUp > 0) && (
          <span className="flex-shrink-0 text-[9px] leading-tight text-[rgb(var(--text-secondary))]">
            <span className="text-violet-500/70 font-medium">{symbol}{granted.toFixed(0)}</span>
            <span className="mx-0.5 opacity-30">|</span>
            <span className="font-medium" style={{ color: `rgb(var(--accent))` }}>{symbol}{toppedUp.toFixed(0)}</span>
          </span>
        )}

        {/* Platform link */}
        <button
          onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternal(providerMeta.accountUrl) }}
          className="flex-shrink-0 p-1 rounded border border-[rgb(var(--border-subtle)/0.1)] text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 hover:border-[rgb(var(--accent)/0.4)] hover:text-[rgb(var(--accent))] transition-all"
          title={`前往 ${providerMeta.name} 平台`}
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </button>

        {/* Pin button */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin?.() }}
          className={`flex-shrink-0 p-1 rounded border transition-all ${
            isPinned
              ? 'border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] opacity-100'
              : 'border-[rgb(var(--border-subtle)/0.1)] text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 hover:border-[rgb(var(--accent)/0.3)] hover:text-[rgb(var(--accent))]'
          }`}
          title={isPinned ? '取消置顶' : '置顶'}
        >
          <Pin className={`w-2.5 h-2.5 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      </motion.div>
    )
  }

  // ── Normal / Compact Mode ──
  return (
    <motion.div
      initial={preferReducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`glass-card relative overflow-hidden group ${isCompact ? 'p-3.5' : 'p-4'}`}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-[0.04] blur-3xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none"
        style={{ background: `rgb(var(--accent))` }}
      />

      {/* Shimmer loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgb(var(--accent)/0.04)] to-transparent animate-shimmer bg-[length:200%_100%] pointer-events-none" />
      )}

      {/* Header row */}
      <div className={`relative flex items-center justify-between ${isCompact ? 'mb-2.5' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm ${isCompact ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 rounded-xl'}`}
            style={{ backgroundColor: `rgb(var(--accent))` }}
            title="拖拽排序"
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
            <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              {accountCount > 1 && accountLabel ? `${accountLabel} · ` : ''}{info.currency} 余额
            </div>
            <div className="flex items-center gap-1.5">
              {errorMessage ? (
                <>
                  <Circle className="w-1.5 h-1.5 fill-current text-red-500" />
                  <span className="text-[10px] text-red-500">{errorMessage}</span>
                </>
              ) : (
                <>
                  <Circle className={`w-1.5 h-1.5 fill-current ${healthColor}`} />
                  <span className={`text-[10px] ${isAvailable ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isAvailable ? '可用' : '不可用'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 运行消耗统计（本次 + 累计） */}
        {providerMeta?.showBalance !== false && sessionSpent !== undefined && !loading && (
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))]" title="本次运行消耗">
              本次 -¥{(sessionSpent ?? 0).toFixed(2)}
            </span>
            <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))]" title="累计消耗">
              累计 ¥{(cumulativeSpent ?? 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Balance display */}
      {providerMeta?.showBalance === false ? (
        <div className="relative flex flex-col items-center justify-center py-3">
          {loading ? (
            <span className="skeleton inline-block w-20 h-6" />
          ) : (
            <>
              <span className={`text-lg font-bold ${isAvailable ? 'text-emerald-500' : 'text-red-500'}`}>
                {isAvailable ? '可用' : '不可用'}
              </span>
              {providerMeta?.balanceNote && (
                <span className="text-[10px] text-[rgb(var(--text-tertiary))] mt-1 text-center">
                  {providerMeta.balanceNote}
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Total balance */}
          <div className={`relative ${isCompact ? 'mb-2.5' : 'mb-3'}`}>
            <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">
              总余额
            </div>
            <div
              className={`font-bold tracking-tight ${isCompact ? 'text-2xl' : 'text-3xl'}`}
              style={{ color: `rgb(var(--accent))` }}
            >
              {loading ? (
                <span className="skeleton inline-block w-24 h-8" />
              ) : (
                <AnimatedNumber value={total} prefix={symbol} decimals={2} />
              )}
            </div>
          </div>

          {/* Sub-balances */}
          <div className="relative grid grid-cols-2 gap-2.5">
            <DetailItem icon={<Gift className="w-3 h-3" />} label="赠金" value={granted} symbol={symbol} loading={loading} compact={isCompact} />
            <DetailItem icon={<CreditCard className="w-3 h-3" />} label="充值" value={toppedUp} symbol={symbol} loading={loading} compact={isCompact} />
          </div>

          {/* Progress bar */}
          {!isCompact && toppedUp + granted > 0 && (
            <div className="relative mt-3">
              <div className="flex justify-between text-[10px] text-[rgb(var(--text-tertiary))] mb-1.5">
                <span>赠金占比</span>
                <span>{((granted / (granted + toppedUp)) * 100).toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(granted / (granted + toppedUp)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer actions */}
      <div className="relative mt-3 pt-2 border-t border-[rgb(var(--border-subtle)/0.06)] flex items-center justify-center gap-2">
        <span className="text-[9px] text-[rgb(var(--text-tertiary))] select-none">长按左侧图标拖拽排序</span>
        <button
          onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternal(providerMeta.accountUrl) }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border
            border-[rgb(var(--border-subtle)/0.1)] text-[rgb(var(--text-tertiary))]
            opacity-0 group-hover:opacity-100 hover:border-[rgb(var(--accent)/0.4)] hover:text-[rgb(var(--accent))] transition-all"
          title={`前往 ${providerMeta.name} 平台`}
        >
          <ExternalLink className="w-3 h-3" />
          官网
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin?.() }}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
            isPinned
              ? 'border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]'
              : 'border-[rgb(var(--border-subtle)/0.1)] text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 hover:border-[rgb(var(--accent)/0.3)] hover:text-[rgb(var(--accent))]'
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
    <div className={`flex items-center gap-2 rounded-xl bg-[rgb(var(--surface)/0.5)] border border-[rgb(var(--border-subtle)/0.04)] ${compact ? 'p-2' : 'p-2.5'}`}>
      <div className="opacity-60" style={{ color: `rgb(var(--accent))` }}>{icon}</div>
      <div className="min-w-0">
        <div className={`text-[rgb(var(--text-tertiary))] ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{label}</div>
        <div className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: `rgb(var(--accent))` }}>
          {loading ? (
            <span className="skeleton inline-block w-14 h-4" />
          ) : (
            <AnimatedNumber value={value} prefix={symbol} decimals={2} />
          )}
        </div>
      </div>
    </div>
  )
}
