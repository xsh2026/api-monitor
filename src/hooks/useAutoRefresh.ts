import { useEffect, useRef } from 'react'
import { useSettings } from '@/context/SettingsContext'

export function useAutoRefresh(callback: () => void, enabled: boolean = true) {
  const { settings } = useSettings()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    callbackRef.current()

    const ms = settings.refreshInterval * 1000
    intervalRef.current = setInterval(() => {
      callbackRef.current()
    }, Math.max(ms, 10000))

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, settings.refreshInterval])
}
