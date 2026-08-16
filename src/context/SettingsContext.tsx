import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { AppSettings, AccountConfig, ViewMode } from '@/types'
import { generateId } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  accounts: [],
  activeAccountId: null,
  refreshInterval: 60,
  floatMode: true,
  darkMode: true,
  style: 'default',
  viewMode: 'normal',
  fontColor: '#3b82f6',
  pinnedAccountIds: [],
  accountOrder: [],
  autoLaunch: false,
}

// 各界面风格的强制强调色；default 使用用户自定义 fontColor
const THEME_ACCENT: Record<string, string | null> = {
  default: null,
  brutalist: '#ff2a2a',
  editorial: '#c75d3b',
  luxury: '#c9a96a',
  paper: '#a63a2b',
  neon: '#00f0ff',
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  resetSettings: () => void
  addAccount: (label: string, apiKey: string, sessionToken?: string, provider?: string) => AccountConfig
  removeAccount: (id: string) => void
  updateAccount: (id: string, patch: Partial<AccountConfig>) => void
  saveToApp: () => Promise<boolean>
  exportToFile: () => Promise<boolean>
  loadFromFile: () => Promise<boolean>
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
  reorderAccounts: (ids: string[]) => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  addAccount: () => ({ id: '', label: '', provider: 'deepseek', apiKey: '', sessionToken: '' }),
  removeAccount: () => {},
  updateAccount: () => {},
  saveToApp: async () => false,
  exportToFile: async () => false,
  loadFromFile: async () => false,
  togglePin: () => {},
  isPinned: () => false,
  reorderAccounts: () => {},
})

const STORAGE_KEY = 'api-monitor-settings'

// 旧版本迁移：compactView boolean → viewMode string
function migrate(data: any): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...data }
  // 每次启动始终从正常模式开始
  merged.viewMode = 'normal'
  if (data.compactView === true && data.viewMode === undefined) {
    merged.viewMode = 'compact'
  }
  // 确保 accounts 存在
  merged.accounts = (data.accounts || []).map((a: any) => ({
    ...a,
    provider: a.provider || 'deepseek',  // 旧账户默认 DeepSeek
  }))
  merged.activeAccountId = data.activeAccountId || null
  merged.pinnedAccountIds = Array.isArray(data.pinnedAccountIds) ? data.pinnedAccountIds : []
  merged.accountOrder = Array.isArray(data.accountOrder) ? data.accountOrder : []
  merged.autoLaunch = data.autoLaunch === true  // 旧数据无此字段，默认 false
  merged.style = ['default', 'brutalist', 'editorial', 'luxury', 'paper', 'neon'].includes(data.style)
    ? data.style
    : 'default'
  // 旧格式 apiKey 单字段迁移
  if (data.apiKey && !merged.accounts.length) {
    merged.accounts = [{
      id: generateId(),
      label: '默认账户',
      provider: 'deepseek',
      apiKey: data.apiKey,
      sessionToken: data.sessionToken || '',
    }]
    merged.activeAccountId = merged.accounts[0].id
  }
  return merged
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return migrate(JSON.parse(stored))
    } catch {}
    return DEFAULT_SETTINGS
  })

  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)  // 防止初始 mount 时覆盖系统注册表

  // 首次加载：优先从文件读取，同时同步自启动状态
  useEffect(() => {
    Promise.all([
      window.electronAPI?.readSettings(),
      window.electronAPI?.getAutoLaunch(),
    ]).then(([fileData, autoLaunch]) => {
      const base = fileData ? migrate(fileData) : settingsRef.current
      // 同步 Electron 实际的自启动状态（以防用户通过系统设置手动更改）
      if (typeof autoLaunch === 'boolean') {
        base.autoLaunch = autoLaunch
      }
      setSettings(base)
      settingsRef.current = base
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base))
      initializedRef.current = true
    }).catch(() => {
      // 即使文件读取失败，也要标记初始化完成，避免后续同步被阻塞
      initializedRef.current = true
    })
  }, [])

  // 自动同步到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // 自动保存到 userData（debounce 800ms）
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      window.electronAPI?.writeSettings(settingsRef.current)
    }, 800)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [settings])

  // 同步 dark mode（深浅色切换在任意风格下都生效）
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  // 同步界面风格（data-style 属性驱动 CSS 主题切换）
  useEffect(() => {
    if (settings.style === 'default') {
      document.documentElement.removeAttribute('data-style')
    } else {
      document.documentElement.setAttribute('data-style', settings.style)
    }
  }, [settings.style])

  // 同步字体颜色到 CSS 变量（同时写 hex 和 RGB 两个变量）
  // 各风格强制对应强调色，default 模式使用用户自定义 fontColor
  useEffect(() => {
    const hex = THEME_ACCENT[settings.style] ?? settings.fontColor
    document.documentElement.style.setProperty('--accent-color', hex)
    // 将 hex 转为 RGB 分量，供 rgb(var(--accent)) 使用
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`)
  }, [settings.fontColor, settings.style])

  // 同步悬浮模式
  useEffect(() => {
    window.electronAPI?.setAlwaysOnTop(settings.floatMode)
  }, [settings.floatMode])

  // 同步开机自启动 — 仅在初始化完成后同步，防止初始渲染时用 false 覆盖注册表
  // autoLaunch 变更时立即写入文件（不等 800ms 防抖），确保下次启动能读到正确的状态
  useEffect(() => {
    if (!initializedRef.current) return
    window.electronAPI?.setAutoLaunch(settings.autoLaunch)
    window.electronAPI?.writeSettings(settingsRef.current)
  }, [settings.autoLaunch])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const addAccount = useCallback((label: string, apiKey: string, sessionToken = '', provider = 'deepseek') => {
    const account: AccountConfig = { id: generateId(), label, provider: provider as any, apiKey, sessionToken }
    setSettings(prev => ({
      ...prev,
      accounts: [...prev.accounts, account],
      activeAccountId: prev.activeAccountId ?? account.id,
      accountOrder: [...(prev.accountOrder || []), account.id],
    }))
    return account
  }, [])

  const removeAccount = useCallback((id: string) => {
    setSettings(prev => {
      const accounts = prev.accounts.filter(a => a.id !== id)
      const activeAccountId = prev.activeAccountId === id
        ? (accounts[0]?.id ?? null) : prev.activeAccountId
      return {
        ...prev, accounts, activeAccountId,
        accountOrder: (prev.accountOrder || []).filter(i => i !== id),
      }
    })
  }, [])

  const updateAccount = useCallback((id: string, patch: Partial<AccountConfig>) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...patch } : a),
    }))
  }, [])

  const saveToApp = useCallback(async (): Promise<boolean> => {
    return window.electronAPI?.writeSettings(settingsRef.current) ?? false
  }, [])

  const exportToFile = useCallback(async (): Promise<boolean> => {
    return window.electronAPI?.saveSettingsToFile(settingsRef.current) ?? false
  }, [])

  const loadFromFile = useCallback(async (): Promise<boolean> => {
    const data = await window.electronAPI?.readSettings()
    if (!data) return false
    setSettings(migrate(data))
    return true
  }, [])

  const togglePin = useCallback((id: string) => {
    setSettings(prev => {
      const ids = prev.pinnedAccountIds || []
      if (ids.includes(id)) {
        return { ...prev, pinnedAccountIds: ids.filter(i => i !== id) }
      }
      return { ...prev, pinnedAccountIds: [...ids, id] }
    })
  }, [])

  const isPinned = useCallback((id: string): boolean => {
    return (settingsRef.current.pinnedAccountIds || []).includes(id)
  }, [])

  const reorderAccounts = useCallback((ids: string[]) => {
    setSettings(prev => ({ ...prev, accountOrder: ids }))
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings, updateSettings, resetSettings,
      addAccount, removeAccount, updateAccount,
      saveToApp, exportToFile, loadFromFile,
      togglePin, isPinned, reorderAccounts,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useActiveAccount(): AccountConfig | null {
  const { settings } = useSettings()
  if (settings.accounts.length === 0) return null
  if (settings.activeAccountId) {
    return settings.accounts.find(a => a.id === settings.activeAccountId) ?? settings.accounts[0]
  }
  return settings.accounts[0]
}

export function useSettings() {
  return useContext(SettingsContext)
}
