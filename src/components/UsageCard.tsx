import { motion, useReducedMotion } from 'framer-motion'
import type { UsageSummary } from '@/types'
import { AnimatedNumber } from './AnimatedNumber'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useMemo, useId } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSettings } from '@/context/SettingsContext'

interface UsageCardProps {
  summary: UsageSummary
  loading: boolean
  index: number
  viewMode: string
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(0)
}

export function UsageCard({ summary, loading, index, viewMode = 'normal' }: UsageCardProps) {
  const { settings } = useSettings()
  const preferReducedMotion = useReducedMotion()
  const gradientId = useId()

  const chartData = useMemo(() => {
    return summary.records
      .slice(0, 14)
      .reverse()
      .map((r, i) => ({
        name: r.date?.slice(-5) || `D${i}`,
        tokens: r.tokens || 0,
        cost: r.cost || 0,
      }))
  }, [summary.records])

  if (!summary.records.length && !loading) return null

  // ── Minimal mode ──
  if (viewMode === 'minimal') {
    return (
      <motion.div
        initial={preferReducedMotion ? false : { opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="flex items-center gap-1 px-1 py-1 rounded-md
          bg-[rgb(var(--surface-overlay)/0.5)]
          border border-[rgb(var(--border-subtle)/0.06)]"
      >
        <Zap className="w-2.5 h-2.5 flex-shrink-0" style={{ color: `rgb(var(--accent))` }} />
        <span className="text-[10px] text-[rgb(var(--text-secondary))]">Usage</span>
        <span className="text-xs font-bold" style={{ color: `rgb(var(--accent))` }}>
          {loading ? '...' : formatTokens(summary.totalTokens)}
        </span>
        <span className="flex-1 text-right text-[10px] font-medium text-emerald-500">
          {loading ? '...' : `$${summary.totalCost.toFixed(4)}`}
        </span>
      </motion.div>
    )
  }

  // ── Normal mode ──
  return (
    <motion.div
      initial={preferReducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="glass-card relative overflow-hidden p-4 group"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.04] blur-3xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none"
        style={{ background: `rgb(var(--accent))` }}
      />

      {/* Shimmer loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgb(var(--accent)/0.04)] to-transparent animate-shimmer bg-[length:200%_100%] pointer-events-none" />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `rgb(var(--accent))` }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">Usage Overview</div>
            <div className="text-[10px] text-[rgb(var(--text-tertiary))]">{summary.records.length} records</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative grid grid-cols-2 gap-2.5 mb-3">
        <div className="p-3 rounded-xl bg-[rgb(var(--surface)/0.5)] border border-[rgb(var(--border-subtle)/0.04)]">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3" style={{ color: `rgb(var(--accent))` }} />
            <span className="text-[10px] text-[rgb(var(--text-tertiary))]">Total Tokens</span>
          </div>
          {loading ? (
            <span className="skeleton inline-block w-16 h-6" />
          ) : (
            <div className="text-lg font-bold" style={{ color: `rgb(var(--accent))` }}>
              <AnimatedNumber value={summary.totalTokens} decimals={0} />
            </div>
          )}
          <div className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">
            ~ {formatTokens(summary.totalTokens)} tokens
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[rgb(var(--surface)/0.5)] border border-[rgb(var(--border-subtle)/0.04)]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] text-[rgb(var(--text-tertiary))]">Total Cost</span>
          </div>
          {loading ? (
            <span className="skeleton inline-block w-16 h-6" />
          ) : (
            <div className="text-lg font-bold text-emerald-500">
              <AnimatedNumber value={summary.totalCost} prefix="$" decimals={4} />
            </div>
          )}
          <div className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">
            {summary.totalCost < 0.01 ? '< 0.01 USD' : ''}
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {chartData.length >= 2 && (
        <div className="relative">
          <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-2">
            Token Trend
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={settings.fontColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={settings.fontColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--surface-overlay))',
                    border: '1px solid rgb(var(--border-subtle) / 0.1)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    color: 'rgb(var(--text-primary))',
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 2 }}
                  formatter={(v: number) => [formatTokens(v), 'Tokens']}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke={settings.fontColor}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: settings.fontColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  )
}
