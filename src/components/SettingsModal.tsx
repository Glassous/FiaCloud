import React, { useState } from 'react';
import './SettingsModal.css';

export interface S3Config {
  id: string;
  name: string;
  endpoint: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  forcePathStyle?: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: S3Config[];
  selectedConfigId: string | null;
  onSaveConfig: (config: S3Config) => void;
  onSelectConfig: (id: string) => void;
  onDeleteConfig: (id: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  configs,
  selectedConfigId,
  onSaveConfig,
  onSelectConfig,
  onDeleteConfig,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<S3Config>>({});

  if (!isOpen) return null;

  const handleStartEdit = (config?: S3Config) => {
    if (config) {
      setEditingConfig(config);
    } else {
      setEditingConfig({
        id: crypto.randomUUID(),
        name: '',
        endpoint: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
        forcePathStyle: false,
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (
      !editingConfig.name ||
      !editingConfig.endpoint ||
      !editingConfig.accessKeyId ||
      !editingConfig.secretAccessKey ||
      !editingConfig.bucketName
    ) {
      alert('请填写所有必填项。');
      return;
    }

    let endpoint = editingConfig.endpoint.trim();
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }

    onSaveConfig({
      ...editingConfig as S3Config,
      endpoint,
    });
    setIsEditing(false);
    setEditingConfig({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingConfig({});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>S3 配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>配置名称 *</label>
                <input
                  type="text"
                  value={editingConfig.name || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                  placeholder="例如：我的 S3 配置"
                />
              </div>
              <div className="form-group">
                <label>服务端点 (Endpoint) *</label>
                <input
                  type="text"
                  value={editingConfig.endpoint || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, endpoint: e.target.value })}
                  placeholder="例如：s3.amazonaws.com"
                />
              </div>
              <div className="form-group">
                <label>区域 (Region) [选填]</label>
                <input
                  type="text"
                  value={editingConfig.region || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, region: e.target.value })}
                  placeholder="例如：us-east-1"
                />
              </div>
              <div className="form-group">
                <label>Access Key ID *</label>
                <input
                  type="text"
                  value={editingConfig.accessKeyId || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, accessKeyId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Secret Access Key *</label>
                <input
                  type="password"
                  value={editingConfig.secretAccessKey || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, secretAccessKey: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Bucket 名称 *</label>
                <input
                  type="text"
                  value={editingConfig.bucketName || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, bucketName: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="forcePathStyle"
                  checked={editingConfig.forcePathStyle || false}
                  onChange={(e) => setEditingConfig({ ...editingConfig, forcePathStyle: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="forcePathStyle" style={{ margin: 0, fontWeight: 'normal' }}>
                  强制使用 Path Style (如 MinIO 需勾选，阿里云/AWS 建议不勾选)
                </label>
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCancelEdit}>取消</button>
                <button className="btn-primary" onClick={handleSave}>保存</button>
              </div>
            </div>
          ) : (
            <div className="config-list">
              <button className="btn-primary add-btn" onClick={() => handleStartEdit()}>
                + 新建配置
              </button>
              
              {configs.length === 0 ? (
                <p className="empty-state">暂无配置，请添加一个。</p>
              ) : (
                <ul className="config-items">
                  {configs.map((config) => (
                    <li key={config.id} className={`config-item ${selectedConfigId === config.id ? 'active' : ''}`}>
                      <div className="config-info" onClick={() => onSelectConfig(config.id)}>
                        <span className="radio-indicator"></span>
                        <div className="config-details">
                          <strong>{config.name}</strong>
                          <small>{config.endpoint}</small>
                        </div>
                      </div>
                      <div className="config-actions">
                        <button className="btn-icon" onClick={() => handleStartEdit(config)}>编辑</button>
                        <button className="btn-icon delete" onClick={() => onDeleteConfig(config.id)}>删除</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
