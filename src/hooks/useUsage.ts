import { useState, useCallback } from 'react'
import type { UsageSummary, UsageRecord } from '@/types'
import { PROVIDERS } from '@/types'
import { useSettings } from '@/context/SettingsContext'

interface UsageState {
  data: UsageRecord[]
  summary: UsageSummary | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

function parseUsageData(raw: Record<string, any>): UsageRecord[] {
  const records: UsageRecord[] = []

  for (const [_url, response] of Object.entries(raw)) {
    if (!response) continue

    // 跳过错误响应
    if (response.code !== undefined && response.code !== 0) continue

    // 尝试多种常见的响应格式
    const items = response.data?.items ?? response.data ?? response.items ?? []
    if (Array.isArray(items)) {
      for (const item of items) {
        records.push({
          date: item.date || item.timestamp || item.created_at || '',
          tokens: item.tokens || item.token_count || item.usage || 0,
          cost: item.cost || item.amount || item.total_cost || 0,
          model: item.model || item.model_name || '',
        })
      }
    }

    // 如果是单个 summary 对象
    if (response.total_tokens !== undefined) {
      records.push({
        date: new Date().toISOString().split('T')[0],
        tokens: response.total_tokens,
        cost: response.total_cost ?? 0,
      })
    }
  }

  // 按日期去重合并
  const merged = new Map<string, UsageRecord>()
  for (const r of records) {
    const key = r.date || 'unknown'
    if (merged.has(key)) {
      const existing = merged.get(key)!
      existing.tokens = (existing.tokens || 0) + (r.tokens || 0)
      existing.cost = (existing.cost || 0) + (r.cost || 0)
    } else {
      merged.set(key, { ...r })
    }
  }

  return Array.from(merged.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function useUsage() {
  const { settings } = useSettings()
  const [state, setState] = useState<UsageState>({
    data: [],
    summary: null,
    loading: false,
    error: null,
    lastUpdated: null,
  })

  const fetchUsage = useCallback(async (provider?: string, apiKey?: string) => {
    const key = apiKey || settings.accounts[0]?.apiKey
    const prov = provider || settings.accounts[0]?.provider || 'deepseek'
    if (!key?.trim()) return

    // 该厂商不支持用量查询则跳过
    if (!PROVIDERS[prov as keyof typeof PROVIDERS]?.hasUsage) return

    if (!window.electronAPI) return

    setState(s => ({ ...s, loading: true, error: null }))

    try {
      const result = await window.electronAPI!.fetchUsage(prov, key.trim())

      const records = parseUsageData(result)
      const totalTokens = records.reduce((sum, r) => sum + (r.tokens || 0), 0)
      const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0)

      setState({
        data: records,
        summary: { totalTokens, totalCost, records },
        loading: false,
        error: null,
        lastUpdated: new Date(),
      })
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message || '获取用量失败' }))
    }
  }, [settings.accounts])

  const cancel = useCallback(() => {
    setState(s => ({ ...s, loading: false }))
  }, [])

  return { ...state, fetchUsage, cancel }
}
