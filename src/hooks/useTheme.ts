import { useEffect, useCallback, useRef } from 'react'
import { useAppConfig } from './useAppConfig'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark-theme', resolved === 'dark')
}

export function useTheme() {
  const { config, setTheme } = useAppConfig()
  const mqRef = useRef<MediaQueryList | null>(null)

  useEffect(() => {
    applyThemeClass(resolveTheme(config.theme))
  }, [config.theme])

  useEffect(() => {
    if (config.theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mqRef.current = mq

    const handler = () => {
      applyThemeClass(mq.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [config.theme])

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const idx = order.indexOf(config.theme)
    setTheme(order[(idx + 1) % order.length])
  }, [config.theme, setTheme])

  return {
    themeMode: config.theme,
    resolvedTheme: resolveTheme(config.theme),
    cycleTheme,
    setTheme,
  }
}
