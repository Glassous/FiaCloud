import { useState, useCallback } from 'react'
import { TopBar } from './components/layout/TopBar/TopBar'
import { Sidebar } from './components/layout/Sidebar/Sidebar'
import { FileExplorer } from './components/file-explorer/FileExplorer'
import { PreviewZone } from './components/preview/PreviewZone'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { useFile } from './contexts/FileContext'
import { useTheme } from './hooks/useTheme'
import './App.css'

function App() {
  const { openedFile } = useFile()
  const [showSettings, setShowSettings] = useState(false)

  useTheme()

  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'settings') {
      setShowSettings(true)
    }
  }, [])

  return (
    <div className="app">
      <TopBar onSettingsClick={() => setShowSettings(true)} />
      <div className="app__body">
        <Sidebar activeTab={showSettings ? 'settings' : 'files'} onTabChange={handleTabChange} />
        <main className="app__main">
          <div className="app__content">
            {!openedFile ? (
              <FileExplorer
                onOpenSettings={() => setShowSettings(true)}
              />
            ) : (
              <PreviewZone />
            )}
          </div>
        </main>
      </div>

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileSwitch={() => {
          setShowSettings(false);
          // Handled via useFile initialization if needed, 
          // but TopBar now handles it with setOpenedFile(null)
        }}
      />
    </div>
  )
}

export default App
