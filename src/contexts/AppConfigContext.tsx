import { createContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppConfig, S3Profile } from '../types'
import { loadConfig, saveConfig } from '../lib/storage'

type ConfigAction =
  | { type: 'SET_THEME'; theme: AppConfig['theme'] }
  | { type: 'SET_DEFAULT_VIEW'; view: AppConfig['defaultView'] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_EXPANDED'; expanded: boolean }
  | { type: 'ADD_PROFILE'; profile: S3Profile }
  | { type: 'UPDATE_PROFILE'; profile: S3Profile }
  | { type: 'DELETE_PROFILE'; profileId: string }
  | { type: 'SET_ACTIVE_PROFILE'; profileId: string }
  | { type: 'LOAD_CONFIG'; config: AppConfig }

function configReducer(state: AppConfig, action: ConfigAction): AppConfig {
  let next: AppConfig

  switch (action.type) {
    case 'SET_THEME':
      next = { ...state, theme: action.theme }
      break
    case 'SET_DEFAULT_VIEW':
      next = { ...state, defaultView: action.view }
      break
    case 'TOGGLE_SIDEBAR':
      next = { ...state, sidebarExpanded: !state.sidebarExpanded }
      break
    case 'SET_SIDEBAR_EXPANDED':
      next = { ...state, sidebarExpanded: action.expanded }
      break
    case 'ADD_PROFILE':
      next = {
        ...state,
        profiles: [...state.profiles, action.profile],
        activeProfileId: state.profiles.length === 0 ? action.profile.id : state.activeProfileId,
      }
      break
    case 'UPDATE_PROFILE':
      next = {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id === action.profile.id ? action.profile : p
        ),
      }
      break
    case 'DELETE_PROFILE':
      next = {
        ...state,
        profiles: state.profiles.filter((p) => p.id !== action.profileId),
        activeProfileId:
          state.activeProfileId === action.profileId
            ? state.profiles.find((p) => p.id !== action.profileId)?.id || ''
            : state.activeProfileId,
      }
      break
    case 'SET_ACTIVE_PROFILE':
      next = { ...state, activeProfileId: action.profileId }
      break
    case 'LOAD_CONFIG':
      next = action.config
      break
    default:
      return state
  }

  saveConfig(next)
  return next
}

export interface ConfigContextValue {
  config: AppConfig
  activeProfile: S3Profile | null
  dispatch: React.Dispatch<ConfigAction>
  setTheme: (theme: AppConfig['theme']) => void
  setDefaultView: (view: AppConfig['defaultView']) => void
  toggleSidebar: () => void
  addProfile: (profile: S3Profile) => void
  updateProfile: (profile: S3Profile) => void
  deleteProfile: (profileId: string) => void
  setActiveProfile: (profileId: string) => void
}

export const AppConfigContext = createContext<ConfigContextValue | undefined>(undefined)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(configReducer, null, loadConfig)

  const activeProfile = config.profiles.find((p) => p.id === config.activeProfileId) || null

  const setTheme = useCallback((theme: AppConfig['theme']) => dispatch({ type: 'SET_THEME', theme }), [])
  const setDefaultView = useCallback((view: AppConfig['defaultView']) => dispatch({ type: 'SET_DEFAULT_VIEW', view }), [])
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), [])
  const addProfile = useCallback((profile: S3Profile) => dispatch({ type: 'ADD_PROFILE', profile }), [])
  const updateProfile = useCallback((profile: S3Profile) => dispatch({ type: 'UPDATE_PROFILE', profile }), [])
  const deleteProfile = useCallback((profileId: string) => dispatch({ type: 'DELETE_PROFILE', profileId }), [])
  const setActiveProfile = useCallback((profileId: string) => dispatch({ type: 'SET_ACTIVE_PROFILE', profileId }), [])

  return (
    <AppConfigContext.Provider
      value={{
        config,
        activeProfile,
        dispatch,
        setTheme,
        setDefaultView,
        toggleSidebar,
        addProfile,
        updateProfile,
        deleteProfile,
        setActiveProfile,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  )
}
