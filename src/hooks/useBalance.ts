import { useState, useCallback, useRef } from 'react'
import type { BalanceResult, AccountBalance } from '@/types'
import { useSettings } from '@/context/SettingsContext'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1500

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useBalance() {
  const { settings } = useSettings()
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const [globalRetryCount, setGlobalRetryCount] = useState(0)
  const abortRef = useRef(false)

  /** 单个账户的余额查询（含重试） */
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
          if (result.status === 401) {
            return { error: true, status: 401, message: 'API Key 无效，请检查' }
          }
          if (result.status === 429) {
            lastError = '请求太频繁，正在重试...'
            await delay(BASE_DELAY_MS * (attempt + 1) * 1.5)
            continue
          }
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

  /** 并行拉取所有账户 */
  const fetchAll = useCallback(async (isRetry = false) => {
    const accounts = settings.accounts
    if (accounts.length === 0) return

    abortRef.current = false
    setGlobalLoading(true)
    setGlobalRetryCount(r => isRetry ? r + 1 : 0)

    const results = await Promise.all(
      accounts.map(async (acct) => {
        const base = {
          accountId: acct.id,
          accountLabel: acct.label,
          provider: acct.provider || 'deepseek',
        }

        if (!acct.apiKey.trim()) {
          return { ...base, data: null, isAvailable: false, loading: false, error: '请设置 API Key', lastUpdated: null } as AccountBalance
        }

        // 先设置为 loading
        setAccountBalances(prev => {
          const filtered = prev.filter(b => b.accountId !== acct.id)
          return [...filtered, { ...base, data: null, isAvailable: false, loading: true, error: null, lastUpdated: null } as AccountBalance]
        })

        const result = await fetchOne(acct.provider || 'deepseek', acct.apiKey)

        if (abortRef.current) return null

        if ('error' in result) {
          return { ...base, data: null, isAvailable: false, loading: false, error: result.message, lastUpdated: null } as AccountBalance
        }

        return {
          ...base,
          data: result.balance_infos,
          isAvailable: result.is_available,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        } as AccountBalance
      })
    )

    if (!abortRef.current) {
      setAccountBalances(results.filter(Boolean) as AccountBalance[])
      setGlobalLoading(false)
      setGlobalRetryCount(0)
    }
  }, [settings.accounts, fetchOne])

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
    retryCount: globalRetryCount,
    fetchBalance: fetchAll,
    cancel,
  }
}
