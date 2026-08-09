import { motion } from 'framer-motion'
import { useSettings } from '@/context/SettingsContext'
import { PROVIDERS, type ProviderId } from '@/types'
import { Pin, PinOff, Sun, Moon, Minimize2, X, Settings2, Plus, Trash2, Save, Download, Users, Check, Key, Info, Loader2, PanelBottomClose, PanelBottom, ChevronDown, Pencil } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
]

export function Header() {
  const { settings, updateSettings } = useSettings()
  const [showSettings, setShowSettings] = useState(false)
  const isMinimal = settings.viewMode === 'minimal'

  return (
    <>
      {/* 自定义标题栏 */}
      <div
        className={`flex items-center justify-between ${isMinimal ? 'px-1 py-0.5' : 'px-4 py-2.5'}`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* 左侧：标题 */}
        <div className="flex items-center gap-1">
          <motion.div
            className={`rounded-md flex items-center justify-center shadow-sm shadow-current/20 ${isMinimal ? 'w-4 h-4' : 'w-7 h-7 rounded-lg'}`}
            style={{ backgroundColor: `var(--accent-color)` }}
            whileHover={{ scale: 1.05, rotate: -5 }}
          >
            <svg width={isMinimal ? 8 : 14} height={isMinimal ? 8 : 14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </motion.div>
          {!isMinimal && (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-tight">
              API Monitor
            </span>
          )}
        </div>

        {/* 右侧：控制按钮 */}
        <div
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* 设置 */}
          <IconButton
            onClick={() => {
              const next = !showSettings
              setShowSettings(next)
              if (next) {
                // 打开设置 → 自动切正常视图
                updateSettings({ viewMode: 'normal' })
                setTimeout(() => window.electronAPI?.resizeWindow(420, 680), 200)
              }
            }}
            active={showSettings}
            tooltip="设置"
            compact={isMinimal}
          >
            <Settings2 className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>

          {/* 视图切换：正常 ↔ 极简 */}
          <IconButton
            onClick={() => updateSettings({ viewMode: isMinimal ? 'normal' : 'minimal' })}
            tooltip={isMinimal ? '切换到正常视图' : '切换到极简视图'}
            compact={isMinimal}
          >
            {isMinimal ? (
              <PanelBottom className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <PanelBottomClose className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* 悬浮 */}
          <IconButton
            onClick={() => updateSettings({ floatMode: !settings.floatMode })}
            active={settings.floatMode}
            tooltip={settings.floatMode ? '取消置顶' : '窗口置顶'}
            compact={isMinimal}
          >
            {settings.floatMode ? (
              <Pin className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <PinOff className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* 主题 */}
          <IconButton
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            tooltip={settings.darkMode ? '浅色模式' : '深色模式'}
            compact={isMinimal}
          >
            {settings.darkMode ? (
              <Moon className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <Sun className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* 最小化 → 极简模式 + 移到左上角 */}
          <IconButton
            onClick={() => {
              updateSettings({ viewMode: 'minimal' })
              setTimeout(() => window.electronAPI?.moveWindow(0, 0), 200)
            }}
            tooltip="切换到极简视图并移到左上角"
            compact={isMinimal}
          >
            <Minimize2 className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>

          {/* 关闭 */}
          <IconButton
            onClick={() => window.electronAPI?.quitApp()}
            tooltip="退出程序"
            className="hover:bg-red-500/10 hover:text-red-500"
            compact={isMinimal}
          >
            <X className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>
        </div>
      </div>

      {/* 设置面板 */}
      <motion.div
        initial={false}
        animate={{
          height: showSettings ? 'auto' : 0,
          opacity: showSettings ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <SettingsPanel onClose={() => setShowSettings(false)} />
      </motion.div>
    </>
  )
}

function IconButton({
  onClick,
  active,
  tooltip,
  className = '',
  compact = false,
  children,
}: {
  onClick: () => void
  active?: boolean
  tooltip: string
  className?: string
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={tooltip}
      className={`
        flex items-center justify-center
        transition-colors duration-200
        ${compact ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg'}
        ${active
          ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400'
          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
        }
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
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
    addAccount(newLabel || '未命名', newApiKey.trim(), newSession.trim(), newProvider)
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
      className="mx-4 mb-3 p-4 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06] space-y-4 max-h-[460px] overflow-y-auto scrollbar-thin"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* 保存按钮 */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveToApp}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium
            bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400
            hover:bg-blue-500/20 dark:hover:bg-blue-400/20 transition-colors"
        >
          {appSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {appSaved ? '已保存' : '保存到软件'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportToFile}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium
            bg-gray-200/50 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400
            hover:bg-gray-300/50 dark:hover:bg-white/[0.1] transition-colors"
        >
          {fileSaved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          {fileSaved ? '已导出' : '导出到文件'}
        </motion.button>
      </div>

      <div className="border-t border-gray-200/50 dark:border-white/[0.06]" />

      {/* 账户列表 */}
      {settings.accounts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-3 h-3" />
            <span>{settings.accounts.length} 个账户</span>
          </div>
          {settings.accounts.map(acct => (
            <div
              key={acct.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/[0.03]
                border border-gray-200/30 dark:border-white/[0.04]"
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
                        bg-white dark:bg-white/[0.08]
                        border border-blue-500/50
                        text-gray-900 dark:text-gray-100
                        focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
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
                    className="text-gray-500 hover:text-blue-500 transition-colors p-0.5 flex-shrink-0"
                    title="编辑名称"
                  >
                    <Pencil className="w-3 h-3" />
                  </motion.button>
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {acct.apiKey.slice(0, 12)}...
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeAccount(acct.id)}
                className="text-gray-600 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ))}
        </div>
      )}

      {/* 添加新账户 */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">添加账户</div>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="账户名称（可选）"
          className="w-full px-3 py-2 text-xs rounded-lg
            bg-white dark:bg-white/[0.06]
            border border-gray-200 dark:border-white/[0.08]
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
            transition-all duration-200"
        />
        {/* 厂商选择 */}
        <div className="relative">
          <select
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value as ProviderId)}
            className="w-full px-3 py-2 pr-8 text-xs rounded-lg appearance-none cursor-pointer
              bg-gray-100 dark:bg-white/[0.08]
              border border-gray-300 dark:border-white/[0.1]
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
              transition-all duration-200"
          >
            {Object.entries(PROVIDERS).map(([id, meta]) => (
              <option key={id} value={id}>{meta.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
        </div>
        <input
          type="password"
          value={newApiKey}
          onChange={(e) => setNewApiKey(e.target.value)}
          placeholder="API Key (sk-...)"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-full px-3 py-2 text-xs rounded-lg
            bg-white dark:bg-white/[0.06]
            border border-gray-200 dark:border-white/[0.08]
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
            transition-all duration-200"
        />
        <input
          type="password"
          value={newSession}
          onChange={(e) => setNewSession(e.target.value)}
          placeholder="Session Token（可选，用于用量查询）"
          className="w-full px-3 py-2 pr-10 text-xs rounded-lg
            bg-white dark:bg-white/[0.06]
            border border-gray-200 dark:border-white/[0.08]
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
            transition-all duration-200"
        />
        {/* Session Token 操作区 */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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
          {/* 带 tooltip 的 info 图标 */}
          <div className="relative group/tip">
            <Info className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 cursor-help" />
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
              用量数据现在直接通过 API Key 的 Bearer 认证获取，无需额外配置 Session Token。
              点击「验证 API」可测试 API Key 是否有效以及用量查询是否可用。
              Session Token 字段已变为可选，仅在 Bearer 方式失效时作为备选。
            </div>
          </div>
        </div>
        {/* 验证反馈 */}
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
            bg-gradient-to-r from-blue-500/10 to-indigo-500/10
            dark:from-blue-400/10 dark:to-indigo-400/10
            text-blue-600 dark:text-blue-400
            hover:from-blue-500/20 hover:to-indigo-500/20
            dark:hover:from-blue-400/20 dark:hover:to-indigo-400/20
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          添加
        </motion.button>
      </div>

      <div className="border-t border-gray-200/50 dark:border-white/[0.06]" />

      {/* 刷新间隔 */}
      <div>
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          自动刷新间隔：{settings.refreshInterval}s
        </label>
        <input
          type="range"
          min={10}
          max={300}
          step={10}
          value={settings.refreshInterval}
          onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/[0.08]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-blue-500/30
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>10s</span>
          <span>5min</span>
        </div>
      </div>

      <div className="border-t border-gray-200/50 dark:border-white/[0.06]" />

      {/* 开机自启动 */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">开机自启动</span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => updateSettings({ autoLaunch: !settings.autoLaunch })}
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
            settings.autoLaunch
              ? 'bg-blue-500'
              : 'bg-gray-300 dark:bg-white/[0.12]'
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: settings.autoLaunch ? 'calc(100% - 1.125rem)' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      {/* 视图模式：三态分段选择器 */}
      <div>
        <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          视图模式
        </span>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-gray-200/50 dark:bg-white/[0.06]">
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
                if (mode === 'minimal') onClose()
              }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
                settings.viewMode === mode
                  ? 'bg-white dark:bg-white/[0.12] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 强调色 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">强调色</span>
          <span className="text-[10px] text-gray-500 font-mono">{settings.fontColor}</span>
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
          {/* 预设色板 */}
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
