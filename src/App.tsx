import { useState, useEffect, useCallback } from 'react';
import './App.css';
import SettingsModal, { type S3Config } from './components/SettingsModal';
import FileList from './components/FileList';
import FileViewer from './components/FileViewer';
import ImageViewer from './components/ImageViewer';
import VideoViewer from './components/VideoViewer';
import AudioViewer from './components/AudioViewer';
import ConfirmDialog from './components/ConfirmDialog';
import { 
  type S3File, 
  getS3ObjectContent, 
  putS3ObjectContent, 
  downloadS3Object, 
  renameS3Object,
  uploadS3Object,
  deleteS3Object,
  listAllRecursive
} from './services/s3';
import { useRef } from 'react';

function App() {
  const [configs, setConfigs] = useState<S3Config[]>(() => {
    const saved = localStorage.getItem('s3_configs');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(() => {
    return localStorage.getItem('s3_selected_config_id');
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(true);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renamingValue, setRenamingValue] = useState<string>('');
  const [inlineRenamingKey, setInlineRenamingKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('fia_theme') as any) || 'system';
  });
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('fia_theme', theme);

    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    if (theme === 'system') {
      setEffectiveTheme(getSystemTheme());
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setEffectiveTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const selectedConfig = configs.find(c => c.id === selectedConfigId);

  const isTextFile = (filename: string) => {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.html', '.css', '.xml', '.yml', '.yaml', '.csv', '.sql', '.py', '.java', '.c', '.cpp'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isVideoFile = (filename: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isAudioFile = (filename: string) => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadFileContent = useCallback(async (file: S3File) => {
    if (!selectedConfig) return;

    // Reset states
    setFileContent('');
    setEditedContent('');
    setPreviewUrl(null);

    if (isTextFile(file.name)) {
      setIsLoadingContent(true);
      try {
        const content = await getS3ObjectContent(selectedConfig, file.key);
        setFileContent(content);
        setEditedContent(content);
      } catch (error) {
        console.error('Failed to load file content:', error);
        alert('加载文件内容失败');
      } finally {
        setIsLoadingContent(false);
      }
    } else if (isImageFile(file.name) || isVideoFile(file.name) || isAudioFile(file.name)) {
      setIsLoadingContent(true);
      try {
        const blob = await downloadS3Object(selectedConfig, file.key);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Failed to load media:', error);
        alert('加载媒体文件失败');
      } finally {
        setIsLoadingContent(false);
      }
    }
  }, [selectedConfig]);

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    } else {
      setFileContent('');
      setEditedContent('');
    }
  }, [selectedFile, loadFileContent]);

  const handleSaveFile = async () => {
    if (!selectedConfig || !selectedFile) return;

    setIsSaving(true);
    try {
      await putS3ObjectContent(selectedConfig, selectedFile.key, editedContent);
      setFileContent(editedContent);
      alert('保存成功');
    } catch (error) {
      console.error('Failed to save file content:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadFile = async (fileToDownload?: S3File) => {
    const file = fileToDownload || selectedFile;
    if (!selectedConfig || !file) return;

    setIsDownloading(true);
    try {
      const blob = await downloadS3Object(selectedConfig, file.key);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartRename = () => {
    if (!selectedFile) return;
    setRenamingValue(selectedFile.name);
    setIsRenaming(true);
  };

  const handleConfirmRename = async () => {
    if (!selectedConfig || !selectedFile || !renamingValue || renamingValue === selectedFile.name) {
      setIsRenaming(false);
      return;
    }

    const oldKey = selectedFile.key;
    const pathParts = oldKey.split('/');
    pathParts[pathParts.length - 1] = renamingValue;
    const newKey = pathParts.join('/');

    try {
      await renameS3Object(selectedConfig, oldKey, newKey);
      // Update selected file state locally
      setSelectedFile({
        ...selectedFile,
        key: newKey,
        name: renamingValue
      });
      setIsRenaming(false);
      // Trigger file list refresh
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to rename file:', error);
      alert('重命名失败');
    }
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
  };

  const handleInlineRenameSubmit = async (file: S3File, newName: string) => {
    if (!selectedConfig || !file || !newName || newName === file.name) {
      setInlineRenamingKey(null);
      return;
    }

    const oldKey = file.key;
    const pathParts = oldKey.split('/');
    const isFolder = oldKey.endsWith('/');
    
    if (isFolder) {
      // For folders, the last part is empty, the part before it is the folder name
      pathParts[pathParts.length - 2] = newName;
    } else {
      pathParts[pathParts.length - 1] = newName;
    }
    const newKey = pathParts.join('/');

    try {
      await renameS3Object(selectedConfig, oldKey, newKey);
      
      // If the currently selected file was renamed (or its parent was renamed), update selection
      if (selectedFile && (selectedFile.key === oldKey || selectedFile.key.startsWith(oldKey))) {
        const relativePath = selectedFile.key.slice(oldKey.length);
        setSelectedFile({
          ...selectedFile,
          key: newKey + relativePath,
          name: selectedFile.key === oldKey ? newName : selectedFile.name
        });
      }
      
      setInlineRenamingKey(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to rename file:', error);
      alert('重命名失败');
      setInlineRenamingKey(null);
    }
  };

  const handleContextMenuAction = async (action: 'upload' | 'rename' | 'download' | 'delete', file: S3File | null) => {
    if (!selectedConfig) return;

    if (action === 'upload') {
      let uploadPath = '';
      if (!file) {
        uploadPath = ''; // Root
      } else if (file.isFolder) {
        uploadPath = file.key;
      } else {
        // Parent folder of the file
        const parts = file.key.split('/');
        parts.pop();
        uploadPath = parts.length > 0 ? parts.join('/') + '/' : '';
      }
      uploadTargetRef.current = uploadPath;
      fileInputRef.current?.click();
    } else if (action === 'rename' && file) {
      // Directly set inline renaming state for sidebar
      setInlineRenamingKey(file.key);
    } else if (action === 'download' && file) {
      if (!file.isFolder) {
        // Single file download - directly pass file
        handleDownloadFile(file);
      } else {
        // Folder download - download all files recursively
        try {
          const keys = await listAllRecursive(selectedConfig, file.key);
          if (keys.length === 0) {
            alert('该文件夹为空');
            return;
          }
          if (keys.length > 10) {
            setConfirmState({
              isOpen: true,
              title: '批量下载确认',
              message: `将下载 ${keys.length} 个文件，是否继续？`,
              type: 'warning',
              onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                await performFolderDownload(keys);
              }
            });
            return;
          }
          
          await performFolderDownload(keys);
        } catch (err) {
          console.error('Folder download failed:', err);
          alert('文件夹下载失败');
        }
      }
    } else if (action === 'delete' && file) {
      const typeStr = file.isFolder ? '文件夹' : '文件';
      const message = `确定要删除${typeStr} "${file.name}" 吗？${file.isFolder ? '\n警告：这将删除该文件夹下的所有内容！' : ''}`;
      
      setConfirmState({
        isOpen: true,
        title: `删除${typeStr}`,
        message,
        type: 'danger',
        onConfirm: async () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          try {
            setIsSaving(true);
            await deleteS3Object(selectedConfig, file.key);
            
            // If the deleted file was the currently selected one, clear selection
            if (selectedFile && (selectedFile.key === file.key || selectedFile.key.startsWith(file.key))) {
              setSelectedFile(null);
            }
            
            setRefreshKey(prev => prev + 1);
            alert('删除成功');
          } catch (err) {
            console.error('Delete failed:', err);
            alert('删除失败');
          } finally {
            setIsSaving(false);
          }
        }
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConfig) return;

    const targetKey = uploadTargetRef.current + file.name;
    
    try {
      setIsSaving(true);
      await uploadS3Object(selectedConfig, targetKey, file);
      setRefreshKey(prev => prev + 1);
      alert('上传成功');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上传失败');
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    localStorage.setItem('s3_configs', JSON.stringify(configs));
  }, [configs]);

  useEffect(() => {
    if (selectedConfigId) {
      localStorage.setItem('s3_selected_config_id', selectedConfigId);
    } else {
      localStorage.removeItem('s3_selected_config_id');
    }
  }, [selectedConfigId]);

  const handleSaveConfig = (config: S3Config) => {
    setConfigs((prev) => {
      const index = prev.findIndex((c) => c.id === config.id);
      if (index >= 0) {
        const newConfigs = [...prev];
        newConfigs[index] = config;
        return newConfigs;
      } else {
        return [...prev, config];
      }
    });
    
    // Auto-select if it's the first one
    if (configs.length === 0) {
      setSelectedConfigId(config.id);
    }
  };

  const handleDeleteConfig = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    if (selectedConfigId === id) {
      setSelectedConfigId(null);
    }
  };

  const handleSelectConfig = (id: string) => {
    setSelectedConfigId(id);
    setSelectedFile(null); // Clear selection when switching config
  };

  const handleSelectFile = (file: S3File) => {
    setSelectedFile(file);
    setIsPreviewMode(true);
  };

  const performFolderDownload = async (keys: string[]) => {
    if (!selectedConfig) return;
    for (const key of keys) {
      const blob = await downloadS3Object(selectedConfig, key);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = key.split('/').pop() || 'file';
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('fia_sidebar_width');
    return saved ? parseInt(saved, 10) : 250;
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(600, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    localStorage.setItem('fia_sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo">
          <img src="/fia-cloud-app-icon.svg" alt="FiaCloud Logo" className="logo-icon" />
          <h1 className="app-title">FiaCloud</h1>
        </div>
        
        <div className="header-actions">
          {selectedFile && (
            <div className="file-toolbar">
              <button 
                className="download-btn" 
                onClick={() => handleDownloadFile()}
                disabled={isDownloading}
                title="下载源文件"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {isDownloading ? '下载中...' : '下载'}
              </button>
              
              {isTextFile(selectedFile.name) && (
                <>
                  <div className="mode-switch">
                    <button 
                      className={`switch-btn ${isPreviewMode ? 'active' : ''}`}
                      onClick={() => setIsPreviewMode(true)}
                    >
                      预览
                    </button>
                    <button 
                      className={`switch-btn ${!isPreviewMode ? 'active' : ''}`}
                      onClick={() => setIsPreviewMode(false)}
                    >
                      源码
                    </button>
                  </div>
                  {!isPreviewMode && (
                    <button 
                      className="save-btn" 
                      onClick={handleSaveFile}
                      disabled={isSaving || fileContent === editedContent}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          
          <div className="theme-switch">
            <button 
              className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
              title="跟随系统"
            >
              系统
            </button>
            <button 
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              title="浅色模式"
            >
              浅色
            </button>
            <button 
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              title="深色模式"
            >
              深色
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar" style={{ width: sidebarWidth }}>
          <div className="file-list">
            {selectedConfig ? (
              <FileList 
                key={`${selectedConfig.id}-${refreshKey}`}
                config={selectedConfig} 
                onSelectFile={handleSelectFile} 
                onContextMenuAction={handleContextMenuAction}
                inlineRenamingKey={inlineRenamingKey}
                onInlineRenameSubmit={handleInlineRenameSubmit}
                onInlineRenameCancel={() => setInlineRenamingKey(null)}
              />
            ) : (
              <div className="file-list-placeholder">
                <p>未选择配置。</p>
                <p>请配置 S3 设置。</p>
              </div>
            )}
          </div>
          
          <div className="sidebar-footer">
            <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg> 设置
            </button>
          </div>
        </aside>

        <div className="resizer" onMouseDown={handleMouseDown} />

        <main className="app-main">
          <div className="main-content-area">
            {selectedFile ? (
              <div className="preview-container">
                <div className="preview-header">
                  {isRenaming ? (
                    <div className="rename-input-container">
                      <input
                        type="text"
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                      />
                      <button className="confirm-btn" onClick={handleConfirmRename}>确定</button>
                      <button className="cancel-btn" onClick={handleCancelRename}>取消</button>
                    </div>
                  ) : (
                    <div className="filename-container">
                      <h2>{selectedFile.name}</h2>
                      <button className="edit-btn" onClick={handleStartRename} title="重命名">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="file-details">
                    <span>大小: {selectedFile.size ? (selectedFile.size / 1024).toFixed(2) + ' KB' : '未知'}</span>
                    <span>修改时间: {selectedFile.lastModified ? new Date(selectedFile.lastModified).toLocaleString() : '未知'}</span>
                  </div>
                </div>
                
                <div className="preview-body">
                  {isLoadingContent ? (
                    <div className="loading-overlay">加载内容中...</div>
                  ) : isTextFile(selectedFile.name) ? (
                    <FileViewer
                      fileName={selectedFile.name}
                      content={editedContent}
                      isPreviewMode={isPreviewMode}
                      onContentChange={(val) => setEditedContent(val || '')}
                      theme={effectiveTheme}
                    />
                  ) : isImageFile(selectedFile.name) && previewUrl ? (
                    <ImageViewer url={previewUrl} alt={selectedFile.name} />
                  ) : isVideoFile(selectedFile.name) && previewUrl ? (
                    <VideoViewer url={previewUrl} filename={selectedFile.name} />
                  ) : isAudioFile(selectedFile.name) && previewUrl ? (
                    <AudioViewer url={previewUrl} filename={selectedFile.name} />
                  ) : (
                    <div className="no-preview">
                      <p>该文件类型暂不支持直接预览内容</p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedConfig ? (
              <div className="main-placeholder">
                <h2>请打开某个文件</h2>
                <p>请选择左侧文件进行预览。</p>
              </div>
            ) : (
              <div className="main-placeholder">
                <h2>欢迎使用 FiaCloud</h2>
                <p>请选择或创建一个 S3 配置以开始使用。</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        configs={configs}
        selectedConfigId={selectedConfigId}
        onSaveConfig={handleSaveConfig}
        onSelectConfig={handleSelectConfig}
        onDeleteConfig={handleDeleteConfig}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
