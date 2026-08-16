import { motion } from 'framer-motion'
import { useSettings } from '@/context/SettingsContext'
import { PROVIDERS, type ProviderId } from '@/types'
import { Plus, Trash2, Save, Download, Users, Check, Key, Info, Loader2, ChevronDown, Pencil } from 'lucide-react'
import { useState } from 'react'

const PRESET_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
]

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  const { settings, updateSettings, addAccount, removeAccount, updateAccount, saveToApp, exportToFile, loadFromFile } = useSettings()
  const [newLabel, setNewLabel] = useState('')
  const [newApiKey, setNewApiKey] = useState('')
  const [newSession, setNewSession] = useState('')
  const [newProvider, setNewProvider] = useState<ProviderId>('deepseek')
  const [appSaved, setAppSaved] = useState(false)
  const [fileSaved, setFileSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!newApiKey.trim()) return
    addAccount(newLabel || 'Unnamed', newApiKey.trim(), newSession.trim(), newProvider)
    setNewLabel('')
    setNewApiKey('')
    setNewSession('')
    setVerifyMsg(null)
  }

  const handleSaveToApp = async () => {
    const ok = await saveToApp()
    if (ok) {
      setAppSaved(true)
      setTimeout(() => setAppSaved(false), 2000)
    }
  }

  const handleExportToFile = async () => {
    const ok = await exportToFile()
    if (ok) {
      setFileSaved(true)
      setTimeout(() => setFileSaved(false), 2000)
    }
  }

  const handleLoad = async () => {
    const ok = await loadFromFile()
    if (ok) {
      setLoaded(true)
      setTimeout(() => setLoaded(false), 2000)
    }
  }

  const handleVerifyKey = async () => {
    if (!newApiKey.trim()) return
    setVerifying(true)
    setVerifyMsg(null)
    try {
      const result = await window.electronAPI!.verifyApiKey(newProvider, newApiKey.trim())
      if (result.success) {
        setVerifyMsg({ type: 'success', text: result.message })
      } else {
        setVerifyMsg({ type: 'error', text: result.message })
      }
    } catch {
      setVerifyMsg({ type: 'error', text: '网络错误，请检查连接' })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div
      className="p-4 rounded-xl border space-y-4 overflow-y-auto scrollbar-thin h-full"
      style={{
        background: `rgb(var(--surface-overlay) / 0.85)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: `rgb(var(--border-subtle) / 0.08)`,
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}
    >
      {/* Save / Export */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveToApp}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium
            bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]
            hover:bg-[rgb(var(--accent)/0.18)] transition-colors"
        >
          {appSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {appSaved ? '已保存' : '保存到软件'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportToFile}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium
            bg-[rgb(var(--text-tertiary)/0.1)] text-[rgb(var(--text-secondary))]
            hover:bg-[rgb(var(--text-tertiary)/0.18)] transition-colors"
        >
          {fileSaved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          {fileSaved ? '已导出' : '导出到文件'}
        </motion.button>
      </div>

      <hr className="hairline" />

      {/* Account list */}
      {settings.accounts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-tertiary))] mb-1">
            <Users className="w-3 h-3" />
            <span>{settings.accounts.length} 个账户</span>
          </div>
          {settings.accounts.map(acct => (
            <div
              key={acct.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{
                background: `rgb(var(--surface) / 0.4)`,
                borderColor: `rgb(var(--border-subtle) / 0.06)`,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px] px-1.5 py-px rounded font-medium text-white/90 flex-shrink-0"
                    style={{ backgroundColor: PROVIDERS[acct.provider]?.color || '#3b82f6' }}
                  >
                    {PROVIDERS[acct.provider]?.name || acct.provider}
                  </span>
                  {editingId === acct.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateAccount(acct.id, { label: editName || acct.label })
                          setEditingId(null)
                        }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={() => {
                        updateAccount(acct.id, { label: editName || acct.label })
                        setEditingId(null)
                      }}
                      className="flex-1 min-w-0 px-1.5 py-0.5 text-xs rounded
                        border border-[rgb(var(--accent)/0.4)]
                        text-[rgb(var(--text-primary))]
                        focus:outline-none"
                      style={{ background: `rgb(var(--surface))` }}
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs font-medium text-[rgb(var(--text-primary))] truncate">
                      {acct.label}
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (editingId === acct.id) {
                        updateAccount(acct.id, { label: editName || acct.label })
                        setEditingId(null)
                      } else {
                        setEditingId(acct.id)
                        setEditName(acct.label)
                      }
                    }}
                    className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--accent))] transition-colors p-0.5 flex-shrink-0"
                    title="编辑名称"
                  >
                    <Pencil className="w-3 h-3" />
                  </motion.button>
                </div>
                <div className="text-[10px] text-[rgb(var(--text-tertiary))] truncate">
                  {acct.apiKey.slice(0, 12)}...
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeAccount(acct.id)}
                className="text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ))}
        </div>
      )}

      {/* Add account */}
      <div className="space-y-2">
        <div className="text-[10px] text-[rgb(var(--text-tertiary))] font-medium">添加账户</div>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="账户名称（可选）"
          className="field-input"
        />
        <div className="relative">
          <select
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value as ProviderId)}
            className="field-input appearance-none cursor-pointer pr-8"
          >
            {Object.entries(PROVIDERS).map(([id, meta]) => (
              <option key={id} value={id}>{meta.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] pointer-events-none" />
        </div>
        <input
          type="password"
          value={newApiKey}
          onChange={(e) => setNewApiKey(e.target.value)}
          placeholder="API Key (sk-...)"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="field-input"
        />
        <input
          type="password"
          value={newSession}
          onChange={(e) => setNewSession(e.target.value)}
          placeholder="Session Token（可选，用于用量查询）"
          className="field-input"
        />
        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifyKey}
            disabled={!newApiKey.trim() || verifying}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px]
              bg-indigo-500/10 dark:bg-indigo-400/10
              text-indigo-600 dark:text-indigo-400
              hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            {verifying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Key className="w-3 h-3" />
            )}
            验证 API
          </motion.button>
          <div className="relative group/tip">
            <Info className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] cursor-help" />
            <div className="
              absolute bottom-full right-0 mb-1.5 w-56 px-2.5 py-2 rounded-lg
              bg-gray-800 dark:bg-gray-200 text-[10px] leading-relaxed
              text-gray-100 dark:text-gray-800
              shadow-xl
              opacity-0 invisible
              group-hover/tip:opacity-100 group-hover/tip:visible
              transition-all duration-150 z-50
              pointer-events-none
            ">
              <div className="font-medium mb-1">关于用量查询</div>
              用量数据现在通过 API Key 的 Bearer 认证直接获取，无需额外配置 Session Token。
              点击「验证 API」可测试 API Key 是否有效以及用量查询是否可用。
              Session Token 字段已变为可选，仅在 Bearer 方式失效时作为备选。
            </div>
          </div>
        </div>
        {verifyMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] px-2 py-1 rounded-md ${
              verifyMsg.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-red-500 bg-red-500/10'
            }`}
          >
            {verifyMsg.text}
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleAdd}
          disabled={!newApiKey.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium
            bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]
            hover:bg-[rgb(var(--accent)/0.18)]
            transition-colors duration-150
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          添加
        </motion.button>
      </div>

      <hr className="hairline" />

      {/* Refresh interval */}
      <div>
        <label className="block text-[11px] font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          自动刷新间隔：{settings.refreshInterval}s
        </label>
        <input
          type="range"
          min={10}
          max={300}
          step={10}
          value={settings.refreshInterval}
          onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-[rgb(var(--text-tertiary)/0.15)]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[rgb(var(--accent))]
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div className="flex justify-between text-[10px] text-[rgb(var(--text-tertiary))] mt-1">
          <span>10s</span>
          <span>5min</span>
        </div>
      </div>

      <hr className="hairline" />

      {/* Auto launch */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[rgb(var(--text-secondary))]">开机自启动</span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => updateSettings({ autoLaunch: !settings.autoLaunch })}
          className={`toggle-track ${settings.autoLaunch ? 'toggle-track-on' : 'toggle-track-off'}`}
        >
          <motion.div
            className="toggle-thumb"
            animate={{ left: settings.autoLaunch ? 'calc(100% - 1.125rem)' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      {/* View mode */}
      <div>
        <span className="block text-[11px] font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          视图模式
        </span>
        <div
          className="flex gap-0.5 p-0.5 rounded-lg"
          style={{ background: `rgb(var(--text-tertiary) / 0.1)` }}
        >
          {([
            ['正常', 'normal'],
            ['紧凑', 'compact'],
            ['极简', 'minimal'],
          ] as const).map(([label, mode]) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                updateSettings({ viewMode: mode })
                if (mode === 'minimal') onClose?.()
              }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all duration-150 ${
                settings.viewMode === mode
                  ? 'bg-white dark:bg-white/[0.14] text-[rgb(var(--accent))] shadow-sm'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interface style */}
      <div>
        <span className="block text-[11px] font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          界面风格
        </span>
        <div
          className="grid grid-cols-3 gap-0.5 p-0.5 rounded-lg"
          style={{ background: `rgb(var(--text-tertiary) / 0.1)` }}
        >
          {([
            ['默认', 'default'],
            ['野兽派', 'brutalist'],
            ['极简', 'editorial'],
            ['奢华', 'luxury'],
            ['纸印', 'paper'],
            ['霓虹', 'neon'],
          ] as const).map(([label, style]) => (
            <motion.button
              key={style}
              whileTap={{ scale: 0.97 }}
              onClick={() => updateSettings({ style })}
              className={`py-1.5 rounded-md text-[10px] font-medium transition-all duration-150 ${
                settings.style === style
                  ? 'bg-white dark:bg-white/[0.14] text-[rgb(var(--accent))] shadow-sm'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-[rgb(var(--text-secondary))]">强调色</span>
          <span className="text-[10px] text-[rgb(var(--text-tertiary))] font-mono">{settings.fontColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.fontColor}
            onChange={(e) => updateSettings({ fontColor: e.target.value })}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0
              [&::-webkit-color-swatch-wrapper]:p-0
              [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
          />
          <div className="flex gap-1.5 flex-1 justify-end">
            {PRESET_COLORS.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateSettings({ fontColor: c })}
                className="w-5 h-5 rounded-full border-2 transition-shadow"
                style={{
                  backgroundColor: c,
                  borderColor: settings.fontColor === c ? '#fff' : 'transparent',
                  boxShadow: settings.fontColor === c
                    ? `0 0 0 2px ${c}40`
                    : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
