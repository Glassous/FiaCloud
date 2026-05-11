import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useFileExplorer } from '../hooks/useFileExplorer'
import { useAppConfig } from '../hooks/useAppConfig'
import type { FileItem } from '../types'

interface FileContextValue {
  explorer: ReturnType<typeof useFileExplorer>
  openedFile: FileItem | null
  setOpenedFile: (file: FileItem | null) => void
  showDetails: boolean
  setShowDetails: (show: boolean) => void
}

const FileContext = createContext<FileContextValue | undefined>(undefined)

export function FileProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useAppConfig()
  const explorer = useFileExplorer()
  const [openedFile, setOpenedFile] = useState<FileItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Initialize explorer when profile changes
  useEffect(() => {
    if (activeProfile) {
      explorer.loadFiles(activeProfile)
    }
  }, [activeProfile])

  return (
    <FileContext.Provider
      value={{
        explorer,
        openedFile,
        setOpenedFile,
        showDetails,
        setShowDetails,
      }}
    >
      {children}
    </FileContext.Provider>
  )
}

export function useFile() {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFile must be used within a FileProvider')
  }
  return context
}
