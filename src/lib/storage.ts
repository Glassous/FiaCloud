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
