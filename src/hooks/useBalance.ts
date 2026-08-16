import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { BalanceResult, AccountBalance } from '@/types'
import { useSettings } from '@/context/SettingsContext'

// 重试参数：只对网络/5xx 类瞬时错误做有限重试，并限制总耗时。
// 429（限流）与 401（无效 Key）属确定性错误，立即返回、不重试——
// 重试 429 只会让限流更严重，同时把整个刷新拖慢十几秒。
const MAX_RETRIES = 1
const BASE_DELAY_MS = 1000

// 刷新节流：距上次刷新不足该间隔时忽略本次请求，避免重复请求触发限流
const MIN_REFRESH_INTERVAL_MS = 3000

// 消耗记录（累计，跨重启保留）本地存储 key
const COST_STORAGE_KEY = 'api-monitor-cost'

interface PersistedCost {
  cumulativeByAccount: Record<string, number>
}

function loadCumulativeSpent(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COST_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedCost
      return parsed.cumulativeByAccount ?? {}
    }
  } catch {}
  return {}
}

function saveCumulativeSpent(map: Record<string, number>) {
  try {
    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify({ cumulativeByAccount: map }))
  } catch {}
}

function sumValues(map: Record<string, number>): number {
  return Object.values(map).reduce((s, v) => s + (v || 0), 0)
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useBalance() {
  const { settings } = useSettings()
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const abortRef = useRef(false)
  const inFlightRef = useRef(false)
  const lastFetchRef = useRef(0)

  // ── 消耗统计 ──
  // 历史累计消耗（跨重启，从 localStorage 恢复，本会话内不再变动）
  const [historicalSpent] = useState<Record<string, number>>(() => loadCumulativeSpent())
  // 本次运行消耗（重启清零，靠余额差计算）
  const [sessionSpent, setSessionSpent] = useState<Record<string, number>>({})
  // 本次运行各账户的基线余额（首次成功查询时记录，充值则重置）
  const baselineRef = useRef<Record<string, number>>({})

  // 累计消耗 = 历史累计 + 本次运行
  const cumulativeSpent = useMemo(() => {
    const merged = { ...historicalSpent }
    for (const [id, v] of Object.entries(sessionSpent)) {
      merged[id] = (merged[id] || 0) + v
    }
    return merged
  }, [historicalSpent, sessionSpent])

  // 累计值写入本地（跨重启保留）
  useEffect(() => {
    saveCumulativeSpent(cumulativeSpent)
  }, [cumulativeSpent])

  /** 按 accountId 合并更新单个账户状态 */
  const upsert = useCallback((next: AccountBalance) => {
    setAccountBalances(prev => {
      const filtered = prev.filter(b => b.accountId !== next.accountId)
      return [...filtered, next]
    })
  }, [])

  /** 单个账户的余额查询（含有限重试） */
  const fetchOne = useCallback(async (provider: string, apiKey: string): Promise<BalanceResult> => {
    let lastError: string | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortRef.current) break

      try {
        if (!window.electronAPI) {
          return { error: true, message: 'Electron API 未就绪' }
        }
        const result: BalanceResult = await window.electronAPI.fetchBalance(provider, apiKey.trim())
        if ('error' in result) {
          // 确定性错误：立即返回，不重试
          if (result.status === 401) {
            return { error: true, status: 401, message: 'API Key 无效，请检查' }
          }
          if (result.status === 429) {
            return { error: true, status: 429, message: '请求太频繁，请稍后再试' }
          }
          // 其他错误（网络/5xx）：有限重试
          lastError = result.message
          if (attempt < MAX_RETRIES) {
            await delay(BASE_DELAY_MS * Math.pow(2, attempt))
            continue
          }
          return { error: true, message: result.message }
        }
        return result
      } catch (e: any) {
        lastError = e.message || '请求失败'
        if (attempt < MAX_RETRIES) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt))
          continue
        }
      }
    }
    return { error: true, message: lastError || '请求失败' }
  }, [])

  /** 并行拉取所有账户，逐账户实时更新（快账户先显示，慢账户不阻塞整体） */
  const fetchAll = useCallback(async () => {
    const accounts = settings.accounts
    if (accounts.length === 0) return

    const now = Date.now()
    // 已在拉取中，或距上次刷新不足节流间隔 → 忽略本次
    if (inFlightRef.current || now - lastFetchRef.current < MIN_REFRESH_INTERVAL_MS) return

    inFlightRef.current = true
    lastFetchRef.current = now
    abortRef.current = false
    setGlobalLoading(true)

    try {
      await Promise.all(
        accounts.map(async (acct) => {
          const base = {
            accountId: acct.id,
            accountLabel: acct.label,
            provider: acct.provider || 'deepseek',
          }

          if (!acct.apiKey.trim()) {
            upsert({ ...base, data: null, isAvailable: false, loading: false, error: '请设置 API Key', lastUpdated: null } as AccountBalance)
            return
          }

          // 先设置为 loading
          upsert({ ...base, data: null, isAvailable: false, loading: true, error: null, lastUpdated: null } as AccountBalance)

          const result = await fetchOne(acct.provider || 'deepseek', acct.apiKey)

          if (abortRef.current) return

          if ('error' in result) {
            upsert({ ...base, data: null, isAvailable: false, loading: false, error: result.message, lastUpdated: null } as AccountBalance)
          } else {
            // 余额差法计算本次运行消耗
            const total = (result.balance_infos || []).reduce(
              (s, b) => s + (parseFloat(b.total_balance) || 0), 0
            )
            const prevBaseline = baselineRef.current[acct.id]
            // 首次成功记基线；余额增加（充值）则重置基线，避免负消耗
            if (prevBaseline === undefined || total > prevBaseline) {
              baselineRef.current[acct.id] = total
            }
            const spent = Math.max(0, baselineRef.current[acct.id] - total)
            setSessionSpent(prev => ({ ...prev, [acct.id]: spent }))

            upsert({
              ...base,
              data: result.balance_infos,
              isAvailable: result.is_available,
              loading: false,
              error: null,
              lastUpdated: new Date(),
            } as AccountBalance)
          }
        })
      )

      if (!abortRef.current) {
        setGlobalLoading(false)
      }
    } finally {
      inFlightRef.current = false
    }
  }, [settings.accounts, fetchOne, upsert])

  const cancel = useCallback(() => {
    abortRef.current = true
    setGlobalLoading(false)
  }, [])

  // 计算汇总状态（兼容旧 UI）
  const allData = accountBalances.flatMap(b => b.data || [])
  const anyLoading = globalLoading || accountBalances.some(b => b.loading)
  const firstError = accountBalances.find(b => b.error)?.error || null
  const latestUpdate = accountBalances
    .map(b => b.lastUpdated)
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a))[0] || null

  return {
    accountBalances,
    // 兼容旧接口
    data: allData,
    isAvailable: allData.length > 0,
    loading: anyLoading,
    error: firstError,
    lastUpdated: latestUpdate,
    fetchBalance: fetchAll,
    cancel,
    // 消耗统计：本次运行 + 历史累计
    sessionSpent,
    sessionTotalSpent: sumValues(sessionSpent),
    cumulativeSpent,
    cumulativeTotalSpent: sumValues(cumulativeSpent),
  }
}
