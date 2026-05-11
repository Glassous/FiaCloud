import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { getObjectInfo } from '../../lib/s3-client'
import { formatFileSize, formatDateFull, getFileExtension, getFileCategory } from '../../lib/file-utils'
import type { FileItem } from '../../types'
import './FileDetailPanel.css'

interface FileDetailPanelProps {
  file: FileItem | null
  onClose: () => void
  isEmbedded?: boolean
}

interface FileDetailInfo {
  contentType?: string
  contentLength?: number
  lastModified?: Date
  eTag?: string
  metadata?: Record<string, string>
}

function useFileMetadata(file: FileItem | null, activeProfile: ReturnType<typeof useAppConfig>['activeProfile']) {
  const [detailState, setDetailState] = useState<{ info: FileDetailInfo | null; loading: boolean }>({ info: null, loading: false })
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!file || !activeProfile || file.type === 'folder') return

    const fetchId = ++fetchIdRef.current
    setDetailState((prev) => ({ ...prev, loading: true }))

    getObjectInfo(activeProfile, file.key)
      .then((result) => {
        if (fetchId === fetchIdRef.current) {
          setDetailState({ info: result, loading: false })
        }
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) {
          setDetailState({ info: null, loading: false })
        }
      })
  }, [file, activeProfile])

  return detailState
}

export function FileDetailPanel({ file, onClose, isEmbedded }: FileDetailPanelProps) {
  const { activeProfile } = useAppConfig()
  const detailState = useFileMetadata(file, activeProfile)

  const handleCopyPath = useCallback(() => {
    if (file) {
      navigator.clipboard.writeText(file.key)
    }
  }, [file])

  if (!file) return null

  const ext = getFileExtension(file.name)
  const category = getFileCategory(ext)

  return (
    <aside className={`detail-panel ${isEmbedded ? 'detail-panel--embedded' : 'animate-slide-in-right'}`}>
      {!isEmbedded && (
        <div className="detail-panel__header">
          <h3 className="text-title-medium">文件详情</h3>
          <button className="detail-panel__close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="detail-panel__body">
        <div className="detail-panel__preview-area">
          <span className="material-symbols-outlined detail-panel__file-icon">
            {ext ? getFileCategory(ext) === '图片' ? 'image'
              : getFileCategory(ext) === '视频' ? 'movie'
              : getFileCategory(ext) === '音频' ? 'audio_file'
              : getFileCategory(ext) === '文档' ? 'picture_as_pdf'
              : getFileCategory(ext) === '代码' ? 'code'
              : getFileCategory(ext) === '压缩包' ? 'folder_zip'
              : 'draft'
            : 'draft'}
          </span>
        </div>

        <div className="detail-panel__name text-title-medium">{file.name}</div>
        <div className="detail-panel__path text-body-small">{file.key}</div>

        <div className="detail-panel__divider" />

        <div className="detail-panel__section">
          <div className="detail-panel__row">
            <span className="text-body-small detail-panel__label">类型</span>
            <span className="text-body-small detail-panel__value">
              {category}
              {ext && <span className="detail-panel__ext">.{ext}</span>}
            </span>
          </div>

          {file.size !== undefined && (
            <div className="detail-panel__row">
              <span className="text-body-small detail-panel__label">大小</span>
              <span className="text-body-small detail-panel__value">
                {formatFileSize(file.size)}
                <span className="detail-panel__bytes">({file.size.toLocaleString()} B)</span>
              </span>
            </div>
          )}

          {file.lastModified && (
            <div className="detail-panel__row">
              <span className="text-body-small detail-panel__label">修改时间</span>
              <span className="text-body-small detail-panel__value">
                {formatDateFull(file.lastModified)}
              </span>
            </div>
          )}

          {detailState.loading && (
            <div className="detail-panel__loading">
              <div className="detail-panel__mini-spinner" />
              <span className="text-body-small">加载元数据...</span>
            </div>
          )}

          {detailState.info && !detailState.loading && (
            <>
              {detailState.info.contentType && (
                <div className="detail-panel__row">
                  <span className="text-body-small detail-panel__label">MIME</span>
                  <span className="text-body-small detail-panel__value">{detailState.info.contentType}</span>
                </div>
              )}

              {detailState.info.eTag && (
                <div className="detail-panel__row">
                  <span className="text-body-small detail-panel__label">ETag</span>
                  <span className="text-body-small detail-panel__value detail-panel__mono">
                    {detailState.info.eTag.replace(/"/g, '')}
                  </span>
                </div>
              )}

              {detailState.info.metadata && Object.keys(detailState.info.metadata).length > 0 && (
                <>
                  <div className="detail-panel__divider" />
                  <div className="text-label-medium detail-panel__section-title">自定义元数据</div>
                  {Object.entries(detailState.info.metadata).map(([k, v]) => (
                    <div className="detail-panel__row" key={k}>
                      <span className="text-body-small detail-panel__label">{k}</span>
                      <span className="text-body-small detail-panel__value">{v}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="detail-panel__footer">
        <button className="detail-panel__action" onClick={handleCopyPath}>
          <span className="material-symbols-outlined">content_copy</span>
          <span className="text-label-medium">复制路径</span>
        </button>
      </div>
    </aside>
  )
}
