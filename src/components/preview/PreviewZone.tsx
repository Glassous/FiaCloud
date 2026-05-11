import { useState, useEffect, useCallback } from 'react'
import { useFile } from '../../contexts/FileContext'
import { useAppConfig } from '../../hooks/useAppConfig'
import { getPreviewType } from '../../lib/file-utils'
import { getObject, uploadObject, getDownloadUrl, getPreviewUrl } from '../../lib/s3-client'
import { FileDetailPanel } from './FileDetailPanel'
import './PreviewZone.css'

export function PreviewZone() {
  const { activeProfile } = useAppConfig()
  const { openedFile, setOpenedFile, showDetails, setShowDetails } = useFile()
  const [content, setContent] = useState<string>('')
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModified, setIsModified] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [originalContent, setOriginalContent] = useState<string>('')

  const previewType = openedFile ? getPreviewType(openedFile.name) : 'none'

  // Reset states when file changes
  useEffect(() => {
    setIsEditing(false)
    setIsModified(false)
    setMediaUrl('')
    setContent('')
  }, [openedFile])

  const loadContent = useCallback(async () => {
    if (!openedFile || !activeProfile) return

    setLoading(true)
    setError(null)
    try {
      if (previewType === 'text') {
        const { body } = await getObject(activeProfile, openedFile.key)
        const text = new TextDecoder().decode(body)
        setContent(text)
        setOriginalContent(text)
        setIsModified(false)
      } else if (previewType !== 'none') {
        const url = await getPreviewUrl(activeProfile, openedFile.key)
        setMediaUrl(url)
      }
    } catch (err: any) {
      setError(err.message || '加载文件失败')
    } finally {
      setLoading(false)
    }
  }, [openedFile, activeProfile, previewType])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const handleSave = async () => {
    if (!openedFile || !activeProfile || !isModified) return

    setSaving(true)
    try {
      await uploadObject(activeProfile, openedFile.key, content)
      setIsModified(false)
      setOriginalContent(content)
      setIsEditing(false)
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setContent(originalContent)
    setIsModified(false)
    setIsEditing(false)
  }

  const handleDownload = async () => {
    if (!openedFile || !activeProfile) return
    try {
      const url = await getDownloadUrl(activeProfile, openedFile.key)
      window.open(url, '_blank')
    } catch (err: any) {
      alert('获取下载链接失败: ' + err.message)
    }
  }

  if (!openedFile) return null

  return (
    <div className="preview-zone">
      <header className="preview-zone__header">
        <div className="preview-zone__header-left">
          <button
            className="preview-zone__close-btn"
            onClick={() => setOpenedFile(null)}
            title="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <span className="preview-zone__filename text-title-medium truncate">
            {openedFile.name}
            {isModified && <span className="preview-zone__modified-dot">•</span>}
          </span>
        </div>

        <div className="preview-zone__header-right">
          {previewType === 'text' && !isEditing && (
            <button
              className="preview-zone__tool-btn"
              onClick={() => setIsEditing(true)}
              title="编辑"
            >
              <span className="material-symbols-outlined">edit</span>
              <span className="text-label-medium">编辑</span>
            </button>
          )}

          {isEditing && (
            <>
              <button
                className="preview-zone__tool-btn"
                onClick={handleSave}
                disabled={!isModified || saving}
                title="保存"
              >
                <span className="material-symbols-outlined">
                  {saving ? 'sync' : 'save'}
                </span>
                <span className="text-label-medium">保存</span>
              </button>
              <button
                className="preview-zone__tool-btn"
                onClick={handleCancelEdit}
                title="取消"
              >
                <span className="material-symbols-outlined">close</span>
                <span className="text-label-medium">取消</span>
              </button>
            </>
          )}

          <button
            className={`preview-zone__tool-btn ${showDetails ? 'preview-zone__tool-btn--active' : ''}`}
            onClick={() => setShowDetails(!showDetails)}
            title="详情"
          >
            <span className="material-symbols-outlined">info</span>
            <span className="text-label-medium">详情</span>
          </button>

          <button
            className="preview-zone__tool-btn"
            onClick={handleDownload}
            title="下载"
          >
            <span className="material-symbols-outlined">download</span>
            <span className="text-label-medium">下载</span>
          </button>
        </div>
      </header>

      <div className="preview-zone__body">
        {showDetails ? (
          <div className="preview-zone__details">
            <FileDetailPanel file={openedFile} onClose={() => setShowDetails(false)} isEmbedded />
          </div>
        ) : (
          <div className="preview-zone__content">
            {loading ? (
              <div className="preview-zone__loading">
                <div className="preview-zone__spinner" />
                <p className="text-body-medium">正在加载...</p>
              </div>
            ) : error ? (
              <div className="preview-zone__error">
                <span className="material-symbols-outlined">error</span>
                <p className="text-body-medium">{error}</p>
                <button className="preview-zone__retry-btn" onClick={loadContent}>重试</button>
              </div>
            ) : (
              <>
                {previewType === 'text' && (
                  isEditing ? (
                    <textarea
                      className="preview-zone__editor"
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value)
                        setIsModified(true)
                      }}
                      spellCheck={false}
                      autoFocus
                    />
                  ) : (
                    <div className="preview-zone__readonly-text">
                      {content}
                    </div>
                  )
                )}
                {previewType === 'image' && mediaUrl && (
                  <div className="preview-zone__media-container">
                    <img src={mediaUrl} alt={openedFile.name} className="preview-zone__image" />
                  </div>
                )}
                {previewType === 'video' && mediaUrl && (
                  <div className="preview-zone__media-container">
                    <video src={mediaUrl} controls className="preview-zone__video" />
                  </div>
                )}
                {previewType === 'audio' && mediaUrl && (
                  <div className="preview-zone__media-container">
                    <audio src={mediaUrl} controls className="preview-zone__audio" />
                  </div>
                )}
                {previewType === 'none' && (
                  <div className="preview-zone__unsupported">
                    <span className="material-symbols-outlined">draft</span>
                    <p className="text-body-medium">此文件类型不支持预览</p>
                    <button className="preview-zone__download-link" onClick={handleDownload}>
                      下载文件以查看内容
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
