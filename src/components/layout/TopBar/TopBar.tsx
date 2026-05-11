import { useState, useRef, useEffect } from 'react'
import { useAppConfig } from '../../../hooks/useAppConfig'
import { useFile } from '../../../contexts/FileContext'
import { useTheme } from '../../../hooks/useTheme'
import './TopBar.css'

interface TopBarProps {
  onSettingsClick: () => void
}

export function TopBar({ onSettingsClick }: TopBarProps) {
  const { config, activeProfile, setActiveProfile } = useAppConfig()
  const { setOpenedFile } = useFile()
  const { themeMode, cycleTheme } = useTheme()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileSwitch = (profileId: string) => {
    setOpenedFile(null)
    setActiveProfile(profileId)
    setShowSwitcher(false)
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <img src="/logo-wide.svg" alt="FiaCloud" className="topbar__logo" />
      </div>

      <div className="topbar__center">
        <div className="topbar__switcher-container" ref={switcherRef}>
          <button 
            className={`topbar__bucket-btn ${showSwitcher ? 'topbar__bucket-btn--active' : ''}`}
            onClick={() => setShowSwitcher(!showSwitcher)}
          >
            <div className="topbar__profile-info">
              <span className="text-title-small">
                {activeProfile ? activeProfile.name : '选择存储配置'}
              </span>
              {activeProfile && (
                <span className="text-label-small topbar__bucket-name">
                  {activeProfile.bucket}
                </span>
              )}
            </div>
          </button>

          {showSwitcher && (
            <div className="topbar__switcher-card animate-fade-in">
              <div className="topbar__switcher-header text-label-small">快捷切换</div>
              <div className="topbar__switcher-list">
                {config.profiles.map((p) => (
                  <button
                    key={p.id}
                    className={`topbar__switcher-item ${p.id === config.activeProfileId ? 'topbar__switcher-item--active' : ''}`}
                    onClick={() => handleProfileSwitch(p.id)}
                  >
                    <div className="topbar__switcher-item-info">
                      <span className="text-body-medium">{p.name}</span>
                      <span className="text-label-small">{p.bucket}</span>
                    </div>
                    {p.id === config.activeProfileId && (
                      <span className="material-symbols-outlined">check</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="topbar__switcher-footer">
                <button className="topbar__switcher-manage-btn" onClick={() => { setShowSwitcher(false); onSettingsClick(); }}>
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-label-small">管理配置</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar__right">
        <button
          className="topbar__theme-btn"
          onClick={cycleTheme}
          title={themeMode === 'system' ? '跟随系统' : themeMode === 'light' ? '浅色' : '深色'}
        >
          <span className="material-symbols-outlined">
            {themeMode === 'system' ? 'brightness_auto' : themeMode === 'light' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </header>
  )
}
