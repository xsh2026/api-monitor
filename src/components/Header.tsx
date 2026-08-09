import { motion, useReducedMotion } from 'framer-motion'
import { useSettings } from '@/context/SettingsContext'
import { Pin, PinOff, Sun, Moon, Minimize2, X, Settings2, PanelBottomClose, PanelBottom } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'

interface HeaderProps {
  showSettings: boolean
  onToggleSettings: () => void
}

export function Header({ showSettings, onToggleSettings }: HeaderProps) {
  const { settings, updateSettings } = useSettings()
  const preferReducedMotion = useReducedMotion() ?? false
  const isMinimal = settings.viewMode === 'minimal'

  const handleSettingsClick = () => {
    onToggleSettings()
    if (!showSettings) {
      // Opening: force normal view + wider window
      updateSettings({ viewMode: 'normal' })
      setTimeout(() => window.electronAPI?.resizeWindow(780, 680), 100)
    } else {
      // Closing: restore to normal width
      setTimeout(() => window.electronAPI?.resizeWindow(420, 680), 100)
    }
  }

  return (
    <>
      {/* Custom title bar */}
      <div
        className={`flex items-center justify-between ${isMinimal ? 'px-1 py-0.5' : 'px-4 py-2.5'}`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: logo + title */}
        <div className="flex items-center gap-1.5">
          <motion.div
            className={`rounded-md flex items-center justify-center shadow-sm ${isMinimal ? 'w-4 h-4' : 'w-7 h-7 rounded-lg'}`}
            style={{ backgroundColor: `var(--accent-color, rgb(var(--accent)))` }}
            whileHover={preferReducedMotion ? {} : { scale: 1.05 }}
          >
            <svg width={isMinimal ? 8 : 14} height={isMinimal ? 8 : 14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </motion.div>
          {!isMinimal && (
            <span className="text-sm font-semibold tracking-tight text-[rgb(var(--text-primary))]">
              API Monitor
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Settings */}
          <IconButton
            onClick={handleSettingsClick}
            active={showSettings}
            tooltip="设置"
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            <Settings2 className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>

          {/* View toggle */}
          <IconButton
            onClick={() => updateSettings({ viewMode: isMinimal ? 'normal' : 'minimal' })}
            tooltip={isMinimal ? '正常视图' : '极简视图'}
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            {isMinimal ? (
              <PanelBottom className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <PanelBottomClose className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* Float / Always on top */}
          <IconButton
            onClick={() => updateSettings({ floatMode: !settings.floatMode })}
            active={settings.floatMode}
            tooltip={settings.floatMode ? '取消置顶' : '窗口置顶'}
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            {settings.floatMode ? (
              <Pin className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <PinOff className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* Theme toggle */}
          <IconButton
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            tooltip={settings.darkMode ? '浅色模式' : '深色模式'}
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            {settings.darkMode ? (
              <Moon className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            ) : (
              <Sun className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            )}
          </IconButton>

          {/* Minimize to minimal + top-left */}
          <IconButton
            onClick={() => {
              updateSettings({ viewMode: 'minimal' })
              setTimeout(() => window.electronAPI?.moveWindow(0, 0), 200)
            }}
            tooltip="切换到极简视图并移到左上角"
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            <Minimize2 className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>

          {/* Quit */}
          <IconButton
            onClick={() => window.electronAPI?.quitApp()}
            tooltip="退出程序"
            className="hover:bg-red-500/10 hover:text-red-500"
            compact={isMinimal}
            preferReducedMotion={preferReducedMotion}
          >
            <X className={isMinimal ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </IconButton>
        </div>
      </div>

      {/* Settings panel rendered in App for side-by-side layout */}
    </>
  )
}

function IconButton({
  onClick,
  active,
  tooltip,
  className = '',
  compact = false,
  preferReducedMotion,
  children,
}: {
  onClick: () => void
  active?: boolean
  tooltip: string
  className?: string
  compact?: boolean
  preferReducedMotion?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={preferReducedMotion ? {} : { scale: 1.1 }}
      whileTap={preferReducedMotion ? {} : { scale: 0.92 }}
      title={tooltip}
      className={`
        flex items-center justify-center
        transition-colors duration-150
        ${compact ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg'}
        ${active
          ? 'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]'
          : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle)/0.06)]'
        }
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}

// SettingsPanel moved to ./SettingsPanel.tsx
