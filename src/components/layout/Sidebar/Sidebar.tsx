import { useAppConfig } from '../../../hooks/useAppConfig'
import { useFile } from '../../../contexts/FileContext'
import { getIconForFileItem } from '../../../lib/file-utils'
import './Sidebar.css'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { config, toggleSidebar, activeProfile } = useAppConfig()
  const { explorer, openedFile, setOpenedFile } = useFile()
  const expanded = config.sidebarExpanded

  return (
    <aside className={`sidebar ${expanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>
      <div className="sidebar__top">
        <button
          className="sidebar__toggle"
          onClick={toggleSidebar}
          title={expanded ? '收起侧栏' : '展开侧栏'}
        >
          <span className="material-symbols-outlined">
            {expanded ? 'menu_open' : 'menu'}
          </span>
        </button>

        <nav className="sidebar__nav-items">
          {openedFile && (
            <button
              className={`sidebar__nav-item ${activeTab === 'files' && !openedFile ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => {
                setOpenedFile(null)
                onTabChange('files')
              }}
              title="文件列表"
            >
              <span className="material-symbols-outlined">folder</span>
              <span className="text-label-medium sidebar__label">文件列表</span>
            </button>
          )}
        </nav>
      </div>

      <div className="sidebar__middle">
        {openedFile && (
          <div className="sidebar__file-list">
            <div className="sidebar__section-title text-label-small">当前目录</div>
            <div className="sidebar__files">
              {explorer.items.map((item) => {
                const isOpened = openedFile?.key === item.key
                const icon = getIconForFileItem(item.name, item.type === 'folder')

                return (
                  <button
                    key={item.key}
                    className={`sidebar__file-item ${isOpened ? 'sidebar__file-item--active' : ''}`}
                    onClick={() => {
                      if (item.type === 'folder') {
                        setOpenedFile(null)
                        explorer.navigateTo(activeProfile!, item.key)
                      } else {
                        setOpenedFile(item)
                      }
                    }}
                    title={item.name}
                  >
                    <span className="material-symbols-outlined sidebar__file-icon">
                      {icon}
                    </span>
                    <span className="sidebar__file-name text-body-small sidebar__label">
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar__bottom">
        <button
          className={`sidebar__nav-item ${activeTab === 'settings' ? 'sidebar__nav-item--active' : ''}`}
          onClick={() => onTabChange('settings')}
          title="设置"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-label-medium sidebar__label">设置</span>
        </button>
      </div>
    </aside>
  )
}
