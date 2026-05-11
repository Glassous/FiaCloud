import { useEffect, useCallback } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useFile } from '../../contexts/FileContext'
import { formatFileSize, formatDate, getIconForFileItem } from '../../lib/file-utils'
import { Breadcrumb } from './Breadcrumb'
import type { FileItem } from '../../types'
import './FileExplorer.css'

interface FileExplorerProps {
  onOpenSettings: () => void
}

export function FileExplorer({ onOpenSettings }: FileExplorerProps) {
  const { activeProfile } = useAppConfig()
  const { explorer, setOpenedFile } = useFile()

  useEffect(() => {
    if (activeProfile) {
      explorer.loadFiles(activeProfile)
    }
  }, [activeProfile])

  const handleNavigate = useCallback((prefix: string) => {
    if (activeProfile) {
      explorer.navigateTo(activeProfile, prefix)
    }
  }, [activeProfile, explorer])

  const handleNavigateUp = useCallback(() => {
    if (activeProfile) {
      explorer.navigateUp(activeProfile)
    }
  }, [activeProfile, explorer])

  const handleItemClick = useCallback((item: FileItem) => {
    if (item.type === 'folder') {
      explorer.navigateTo(activeProfile!, item.key)
    } else {
      setOpenedFile(item)
    }
  }, [activeProfile, explorer, setOpenedFile])

  const handleRefresh = useCallback(() => {
    if (activeProfile) {
      explorer.refresh(activeProfile)
    }
  }, [activeProfile, explorer])

  if (!activeProfile) {
    return (
      <div className="explorer-empty">
        <img src="/logo.svg" alt="" className="explorer-empty__logo" />
        <p className="text-headline-small" style={{ color: 'var(--color-primary)' }}>欢迎使用 FiaCloud</p>
        <p className="text-body-medium" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
          点击侧栏的设置按钮，创建你的第一个存储配置
        </p>
        <button className="explorer-empty__btn" onClick={onOpenSettings}>
          <span className="material-symbols-outlined">settings</span>
          <span>前往设置</span>
        </button>
      </div>
    )
  }

  return (
    <div className="explorer">
      <div className="explorer__toolbar">
        <div className="explorer__toolbar-left">
          {explorer.currentPrefix && (
            <button className="explorer__tool-btn" onClick={handleNavigateUp} title="返回上级">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <Breadcrumb prefix={explorer.currentPrefix} onNavigate={handleNavigate} />
        </div>
        <div className="explorer__toolbar-right">
          <button className="explorer__tool-btn" onClick={handleRefresh} title="刷新">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <div className="explorer__content">
        {explorer.loading && explorer.items.length === 0 && (
          <div className="explorer__loading">
            <div className="explorer__spinner" />
          </div>
        )}

        {explorer.error && (
          <div className="explorer__error">
            <span className="material-symbols-outlined">error</span>
            <p className="text-body-medium">{explorer.error}</p>
            <button className="explorer__retry-btn" onClick={handleRefresh}>重试</button>
          </div>
        )}

        {!explorer.loading && !explorer.error && explorer.items.length === 0 && (
          <div className="explorer__empty-state">
            <span className="material-symbols-outlined explorer__empty-icon">cloud_off</span>
            <p className="text-body-medium">此目录为空</p>
          </div>
        )}

        {explorer.items.length > 0 && (
          <div className="explorer__list">
            {explorer.items.map((item) => {
              const icon = getIconForFileItem(item.name, item.type === 'folder')

              return (
                <button
                  key={item.key}
                  className="explorer__item"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="material-symbols-outlined explorer__item-icon">
                    {icon}
                  </span>
                  <div className="explorer__item-info">
                    <span className="text-body-medium explorer__item-name">{item.name}</span>
                    {item.type === 'file' && item.lastModified && (
                      <span className="text-body-small explorer__item-meta">
                        {formatFileSize(item.size || 0)} · {formatDate(item.lastModified)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
