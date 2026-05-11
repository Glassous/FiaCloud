import { useState } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useFile } from '../../contexts/FileContext'
import { createDefaultProfile, PROFILE_TEMPLATES } from '../../lib/profiles'
import type { S3Profile } from '../../types'
import './SettingsDialog.css'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  onProfileSwitch: () => void
}

export function SettingsDialog({ open, onClose, onProfileSwitch }: SettingsDialogProps) {
  const { config, addProfile, updateProfile, deleteProfile, setActiveProfile } = useAppConfig()
  const { setOpenedFile } = useFile()
  const [editingProfile, setEditingProfile] = useState<S3Profile | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (!open) return null

  const handleCreate = (templateKey?: string) => {
    const template = templateKey ? PROFILE_TEMPLATES[templateKey] : undefined
    const profile = createDefaultProfile(template)
    addProfile(profile)
    setEditingProfile(profile)
  }

  const handleSave = () => {
    if (editingProfile) {
      updateProfile({ ...editingProfile, updatedAt: Date.now() })
      setEditingProfile(null)
    }
  }

  const handleSelect = (profile: S3Profile) => {
    setOpenedFile(null)
    setActiveProfile(profile.id)
    onProfileSwitch()
    onClose()
  }

  const handleDelete = (id: string) => {
    deleteProfile(id)
    if (editingProfile?.id === id) {
      setEditingProfile(null)
    }
    setConfirmDeleteId(null)
  }

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const updateField = (field: keyof S3Profile, value: string | boolean) => {
    if (!editingProfile) return
    setEditingProfile({ ...editingProfile, [field]: value })
  }

  return (
    <div className="settings-overlay animate-fade-in" onClick={onClose}>
      <div className="settings-dialog animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="text-title-large">设置</h2>
          <button className="settings-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-sidebar">
            <div className="settings-sidebar__header text-label-medium">配置列表</div>

            <div className="settings-profiles">
              {config.profiles.map((p) => (
                <div
                  key={p.id}
                  className={`settings-profile-item ${editingProfile?.id === p.id ? 'settings-profile-item--active' : ''} ${config.activeProfileId === p.id ? 'settings-profile-item--selected' : ''}`}
                  onClick={() => setEditingProfile(p)}
                >
                  <div className="settings-profile-item__info">
                    <span className="material-symbols-outlined settings-profile-item__icon">
                      {config.activeProfileId === p.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-body-medium settings-profile-item__name">{p.name}</span>
                  </div>
                  <div className="settings-profile-item__actions">
                    {config.activeProfileId !== p.id && (
                      <button
                        className="settings-profile-item__btn"
                        onClick={(e) => { e.stopPropagation(); handleSelect(p) }}
                        title="使用此配置"
                      >
                        <span className="material-symbols-outlined">play_arrow</span>
                      </button>
                    )}
                    <button
                      className="settings-profile-item__btn settings-profile-item__btn--danger"
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id) }}
                      title="删除"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="settings-add-group">
              <span className="text-label-medium">快速添加</span>
              <div className="settings-add-buttons">
                {Object.entries(PROFILE_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    className="settings-add-btn"
                    onClick={() => handleCreate(key)}
                  >
                    <span className="text-label-small">{tpl.name}</span>
                  </button>
                ))}
                <button className="settings-add-btn" onClick={() => handleCreate()}>
                  <span className="text-label-small">自定义</span>
                </button>
              </div>
            </div>
          </div>

          <div className="settings-editor">
            {editingProfile ? (
              <>
                <div className="settings-editor__fields">
                  <div className="settings-field">
                    <label className="text-label-medium">名称</label>
                    <input
                      className="settings-input"
                      value={editingProfile.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="text-label-medium">Endpoint</label>
                    <input
                      className="settings-input"
                      value={editingProfile.endpoint}
                      onChange={(e) => updateField('endpoint', e.target.value)}
                      placeholder="例: s3.amazonaws.com"
                    />
                  </div>

                  <div className="settings-field-row">
                    <div className="settings-field">
                      <label className="text-label-medium">Region</label>
                      <input
                        className="settings-input"
                        value={editingProfile.region}
                        onChange={(e) => updateField('region', e.target.value)}
                        placeholder="us-east-1"
                      />
                    </div>
                    <div className="settings-field">
                      <label className="text-label-medium">Bucket</label>
                      <input
                        className="settings-input"
                        value={editingProfile.bucket}
                        onChange={(e) => updateField('bucket', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="text-label-medium">Access Key ID</label>
                    <input
                      className="settings-input"
                      value={editingProfile.accessKeyId}
                      onChange={(e) => updateField('accessKeyId', e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="text-label-medium">Secret Access Key</label>
                    <div className="settings-input-group">
                      <input
                        className="settings-input"
                        type={showSecrets[editingProfile.id] ? 'text' : 'password'}
                        value={editingProfile.secretAccessKey}
                        onChange={(e) => updateField('secretAccessKey', e.target.value)}
                      />
                      <button
                        className="settings-input-toggle"
                        onClick={() => toggleSecret(editingProfile.id)}
                      >
                        <span className="material-symbols-outlined">
                          {showSecrets[editingProfile.id] ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="text-label-medium">自定义公开 URL（可选）</label>
                    <input
                      className="settings-input"
                      value={editingProfile.publicUrl || ''}
                      onChange={(e) => updateField('publicUrl', e.target.value)}
                      placeholder="https://cdn.example.com"
                    />
                  </div>

                  <div className="settings-checkboxes">
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={editingProfile.forcePathStyle}
                        onChange={(e) => updateField('forcePathStyle', e.target.checked)}
                      />
                      <span className="text-body-small">Path Style（R2/MinIO 需要）</span>
                    </label>
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={editingProfile.accelerate}
                        onChange={(e) => updateField('accelerate', e.target.checked)}
                      />
                      <span className="text-body-small">加速端点</span>
                    </label>
                  </div>
                </div>

                <div className="settings-editor__footer">
                  <button className="settings-btn settings-btn--primary" onClick={handleSave}>
                    保存
                  </button>
                  <button className="settings-btn" onClick={() => setEditingProfile(null)}>
                    取消
                  </button>
                </div>
              </>
            ) : (
              <div className="settings-empty">
                <span className="material-symbols-outlined settings-empty__icon">tune</span>
                <p className="text-body-medium">选择左侧的配置进行编辑</p>
                <p className="text-body-small">或点击下方按钮创建新配置</p>
                <button className="settings-btn settings-btn--primary" onClick={() => handleCreate()}>
                  新建配置
                </button>
              </div>
            )}
          </div>
        </div>

        {confirmDeleteId && (
          <div className="settings-overlay settings-overlay--nested" onClick={() => setConfirmDeleteId(null)}>
            <div className="settings-confirm animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <p className="text-body-large">确定要删除此配置吗？</p>
              <p className="text-body-small" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                此操作不可撤销
              </p>
              <div className="settings-confirm__actions">
                <button className="settings-btn" onClick={() => setConfirmDeleteId(null)}>取消</button>
                <button className="settings-btn settings-btn--danger" onClick={() => handleDelete(confirmDeleteId)}>删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
