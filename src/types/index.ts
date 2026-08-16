export interface BalanceInfo {
  currency: 'CNY' | 'USD'
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

export interface BalanceResponse {
  is_available: boolean
  balance_infos: BalanceInfo[]
}

export interface BalanceError {
  error: true
  status?: number
  message: string
}

export type BalanceResult = BalanceResponse | BalanceError

export interface UsageRecord {
  date: string
  tokens?: number
  cost?: number
  model?: string
}

export interface UsageSummary {
  totalTokens: number
  totalCost: number
  records: UsageRecord[]
}

/** 厂商 ID */
export type ProviderId = 'deepseek' | 'stepfun' | 'unisound' | 'minimax'

/** 厂商元数据（UI 渲染用） */
export interface ProviderMeta {
  id: ProviderId
  name: string
  color: string      // 标签/徽章背景色
  hasUsage: boolean  // 是否支持用量查询
  showBalance: boolean // 是否显示余额数字
  balanceNote?: string // 余额不可查时的说明文字
  accountUrl: string   // 点击卡片跳转的平台地址
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  deepseek: { id: 'deepseek', name: 'DeepSeek', color: '#3b82f6', hasUsage: false, showBalance: true, accountUrl: 'https://platform.deepseek.com/usage' },
  stepfun: { id: 'stepfun', name: 'StepFun', color: '#8b5cf6', hasUsage: false, showBalance: false, balanceNote: 'Step Plan 订阅制，余额请前往平台查看', accountUrl: 'https://platform.stepfun.com/' },
  unisound: { id: 'unisound', name: '云知声', color: '#06b6d4', hasUsage: false, showBalance: false, balanceNote: 'MaaS 平台不支持 API 查余额，请前往 maas.unisound.com 查看', accountUrl: 'https://maas.unisound.com/' },
  minimax: { id: 'minimax', name: 'MiniMax', color: '#f97316', hasUsage: false, showBalance: false, balanceNote: 'Coding Plan 不支持 API 查余额，请前往平台查看', accountUrl: 'https://platform.minimax.io/' },
}

/** 单个 API 账户 */
export interface AccountConfig {
  id: string          // unique id
  label: string       // display name
  provider: ProviderId
  apiKey: string
  sessionToken: string  // 保留但不再强制需要；用量查询现改为 Bearer auth
}

/** 按账户聚合的余额数据 */
export interface AccountBalance {
  accountId: string
  accountLabel: string
  provider: ProviderId
  data: BalanceInfo[] | null
  isAvailable: boolean
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export type ViewMode = 'normal' | 'compact' | 'minimal'

export interface AppSettings {
  accounts: AccountConfig[]
  activeAccountId: string | null
  refreshInterval: number
  floatMode: boolean
  darkMode: boolean
  viewMode: ViewMode
  fontColor: string
  pinnedAccountIds: string[]
  accountOrder: string[]
  autoLaunch: boolean
}

export interface ElectronAPI {
  getPlatform: () => Promise<string>
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>
  getAlwaysOnTop: () => Promise<boolean>
  minimizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  quitApp: () => Promise<void>
  fetchBalance: (provider: string, apiKey: string) => Promise<BalanceResult>
  fetchUsage: (provider: string, apiKey: string) => Promise<Record<string, any>>
  verifyApiKey: (provider: string, apiKey: string) => Promise<{ success: boolean; message: string }>
  onRefreshData: (callback: () => void) => () => void
  writeSettings: (data: any) => Promise<boolean>
  readSettings: () => Promise<any>
  saveSettingsToFile: (data: any) => Promise<boolean>
  resizeWindow: (width: number, height: number) => Promise<boolean>
  moveWindow: (x: number, y: number) => Promise<boolean>
  openExternal: (url: string) => Promise<void>
  setWindowResizable: (flag: boolean) => Promise<void>
  setAutoLaunch: (enable: boolean) => Promise<boolean>
  getAutoLaunch: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
