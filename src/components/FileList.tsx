import React, { useState, useEffect } from 'react';
import { listS3Objects, type S3File } from '../services/s3';
import { type S3Config } from './SettingsModal';
import './FileList.css';
import ContextMenu from './ContextMenu';

interface FileListProps {
  config: S3Config;
  onSelectFile: (file: S3File) => void;
  onContextMenuAction?: (action: 'upload' | 'rename' | 'download' | 'delete', file: S3File | null) => void;
  inlineRenamingKey: string | null;
  onInlineRenameSubmit: (file: S3File, newName: string) => void;
  onInlineRenameCancel: () => void;
}

interface FileTreeItemProps {
  file: S3File;
  config: S3Config;
  level: number;
  onSelectFile: (file: S3File) => void;
  onContextMenu: (e: React.MouseEvent, file: S3File) => void;
  prefix: string;
  isRenaming: boolean;
  onRenameSubmit: (newName: string) => void;
  onRenameCancel: () => void;
  // 传递给递归子项
  isRenamingKey: string | null;
  onRenameSubmitProp: (file: S3File, newName: string) => void;
  onRenameCancelProp: () => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
  file, 
  config, 
  level, 
  onSelectFile, 
  onContextMenu, 
  prefix,
  isRenaming,
  onRenameSubmit,
  onRenameCancel,
  isRenamingKey,
  onRenameSubmitProp,
  onRenameCancelProp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editValue, setEditValue] = useState(file.name);

  useEffect(() => {
    if (isRenaming) {
      setEditValue(file.name);
    }
  }, [isRenaming, file.name]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (file.isFolder) {
      if (!isExpanded && !hasLoaded) {
        setLoading(true);
        setError(null);
        try {
          const newPrefix = prefix + file.name + '/';
          const result = await listS3Objects(config, newPrefix);
          setChildren(result);
          setHasLoaded(true);
        } catch (err: any) {
          setError(err.message || '加载失败');
        } finally {
          setLoading(false);
        }
      }
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRenameSubmit(editValue);
    } else if (e.key === 'Escape') {
      onRenameCancel();
    }
  };

  return (
    <>
      <div 
        className={`file-tree-item ${file.isFolder ? 'is-folder' : 'is-file'} ${isRenaming ? 'is-renaming' : ''}`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={isRenaming ? undefined : handleToggle}
        onContextMenu={handleContextMenu}
      >
        <span className="file-icon">{file.isFolder ? '📁' : '📄'}</span>
        {isRenaming ? (
          <div className="inline-rename-container">
            <input
              className="inline-rename-input"
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <div className="inline-rename-actions">
              <button 
                className="inline-action-btn confirm" 
                onClick={(e) => { e.stopPropagation(); onRenameSubmit(editValue); }}
                title="确定"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button 
                className="inline-action-btn cancel" 
                onClick={(e) => { e.stopPropagation(); onRenameCancel(); }}
                title="取消"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <span className="file-name">{file.name}</span>
        )}
        {loading && <span className="loading-spinner">↻</span>}
        {error && <span className="error-icon" title={error}>!</span>}
      </div>
      
      <div className={`file-tree-children ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && children.length === 0 && !loading && hasLoaded && (
           <div className="empty-folder-message" style={{ paddingLeft: `${(level + 1) * 20 + 12}px` }}>
             (空文件夹)
           </div>
        )}
        {children.map((child) => (
          <FileTreeItem
            key={child.key}
            file={child}
            config={config}
            level={level + 1}
            onSelectFile={onSelectFile}
            onContextMenu={onContextMenu}
            prefix={prefix + file.name + '/'}
            isRenaming={child.key === isRenamingKey}
            onRenameSubmit={(newName) => onRenameSubmitProp(child, newName)}
            onRenameCancel={onRenameCancelProp}
            isRenamingKey={isRenamingKey}
            onRenameSubmitProp={onRenameSubmitProp}
            onRenameCancelProp={onRenameCancelProp}
          />
        ))}
      </div>
    </>
  );
};

const FileList: React.FC<FileListProps> = ({ 
  config, 
  onSelectFile, 
  onContextMenuAction,
  inlineRenamingKey,
  onInlineRenameSubmit,
  onInlineRenameCancel
}) => {
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: S3File | null;
  } | null>(null);

  const loadRootFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listS3Objects(config, '');
      setFiles(result);
    } catch (err: any) {
      setError(err.message || '加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRootFiles();
  }, [config]);

  const handleRefresh = () => {
    loadRootFiles();
  };

  const handleContextMenu = (e: React.MouseEvent, file: S3File | null) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file,
    });
  };

  const handleMenuAction = (action: 'upload' | 'rename' | 'download' | 'delete') => {
    if (onContextMenuAction) {
      onContextMenuAction(action, contextMenu?.file || null);
    }
    setContextMenu(null);
  };

  return (
    <div 
      className="file-list-container" 
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      <div className="file-list-header">
        <div className="header-title">文件列表</div>
        <button className="refresh-btn" onClick={handleRefresh} title="刷新">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>

      {loading && files.length === 0 && (
        <div className="file-list-loading">加载中...</div>
      )}

      {error && (
        <div className="file-list-error">
          <p>{error}</p>
          <button onClick={handleRefresh}>重试</button>
        </div>
      )}

      <div className="file-tree-root">
        {files.length === 0 && !loading && !error && (
          <div className="empty-bucket">Bucket 为空</div>
        )}
        
        {files.map((file) => (
          <FileTreeItem
            key={file.key}
            file={file}
            config={config}
            level={0}
            onSelectFile={onSelectFile}
            onContextMenu={handleContextMenu}
            prefix=""
            isRenaming={file.key === inlineRenamingKey}
            onRenameSubmit={(newName) => onInlineRenameSubmit(file, newName)}
            onRenameCancel={onInlineRenameCancel}
            isRenamingKey={inlineRenamingKey}
            onRenameSubmitProp={onInlineRenameSubmit}
            onRenameCancelProp={onInlineRenameCancel}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          showRename={!!contextMenu.file}
          showDownload={!!contextMenu.file}
          showDelete={!!contextMenu.file}
          onAction={handleMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default FileList;
