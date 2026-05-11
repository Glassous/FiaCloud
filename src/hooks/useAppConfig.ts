import { useContext } from 'react'
import { AppConfigContext, type ConfigContextValue } from '../contexts/AppConfigContext'

export function useAppConfig(): ConfigContextValue {
  const ctx = useContext(AppConfigContext)
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider')
  return ctx
}
