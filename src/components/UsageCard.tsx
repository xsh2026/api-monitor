import { motion } from 'framer-motion'
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

  // 极简模式：只显示关键数字一行，极致紧凑
  if (viewMode === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className="flex items-center gap-1 px-1 py-1 rounded-md
          bg-white/30 dark:bg-white/[0.02]
          border border-gray-200/20 dark:border-white/[0.03]"
      >
        <Zap className="w-2.5 h-2.5 flex-shrink-0" style={{ color: 'var(--accent-color)' }} />
        <span className="text-[10px] text-gray-500">用量</span>
        <span className="text-xs font-bold" style={{ color: 'var(--accent-color)' }}>
          {loading ? '...' : formatTokens(summary.totalTokens)}
        </span>
        <span className="flex-1 text-right text-[10px] font-medium text-emerald-500">
          {loading ? '...' : `¥${summary.totalCost.toFixed(4)}`}
        </span>
      </motion.div>
    )
  }

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
        relative overflow-hidden rounded-2xl p-5
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-xl
        border border-white/20 dark:border-white/[0.06]
        shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
        transition-shadow duration-300
        group
      `}
    >
      {/* 背景光晕 — 使用强调色 */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.06] blur-3xl group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{ background: `var(--accent-color)` }}
      />

      {/* 加载闪烁 */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/[0.02] to-transparent animate-shimmer bg-[length:200%_100%]" />
      )}

      {/* 头部 */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-current/20"
            style={{ backgroundColor: `var(--accent-color)` }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              用量概览
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {summary.records.length} 条记录
            </div>
          </div>
        </div>
      </div>

      {/* 主数据区 */}
      <div className="relative grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3" style={{ color: `var(--accent-color)` }} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">总 Token</span>
          </div>
          {loading ? (
            <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          ) : (
            <div className="text-lg font-bold" style={{ color: `var(--accent-color)` }}>
              <AnimatedNumber value={summary.totalTokens} decimals={0} />
            </div>
          )}
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            ≈ {formatTokens(summary.totalTokens)} tokens
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">总费用</span>
          </div>
          {loading ? (
            <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          ) : (
            <div className="text-lg font-bold text-emerald-500">
              <AnimatedNumber value={summary.totalCost} prefix="¥" decimals={4} />
            </div>
          )}
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            {summary.totalCost < 0.01 ? '< 0.01 元' : ''}
          </div>
        </div>
      </div>

      {/* 迷你趋势图 */}
      {chartData.length >= 2 && (
        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Token 消耗趋势
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={settings.fontColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={settings.fontColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
                  activeDot={{ r: 4, strokeWidth: 0, fill: settings.fontColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  )
}
