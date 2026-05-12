import type { AppConfig } from '../types'

const STORAGE_KEY = 'fiacloud_config'

const DEFAULT_CONFIG: AppConfig = {
  activeProfileId: '',
  profiles: [],
  theme: 'system',
  defaultView: 'grid',
  sidebarExpanded: false,
}

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function exportConfig(config: AppConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiacloud-config-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function validateConfig(config: any): config is AppConfig {
  if (!config || typeof config !== 'object') return false
  
  // Basic validation of required fields
  const hasProfiles = Array.isArray(config.profiles)
  const hasTheme = ['light', 'dark', 'system'].includes(config.theme)
  const hasDefaultView = ['grid', 'list'].includes(config.defaultView)
  
  return hasProfiles && hasTheme && hasDefaultView
}
