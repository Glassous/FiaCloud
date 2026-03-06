import React from 'react';
import './AudioViewer.css';

interface AudioViewerProps {
  url: string;
  filename: string;
}

const AudioViewer: React.FC<AudioViewerProps> = ({ url, filename }) => {
  return (
    <div className="audio-viewer-container">
      <div className="audio-visualizer-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="audio-icon">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      </div>
      <h3 style={{ margin: 0, color: 'var(--text-color)' }}>{filename}</h3>
      <audio 
        controls 
        className="audio-viewer-content"
        src={url}
        title={filename}
      >
        您的浏览器不支持音频标签。
      </audio>
    </div>
  );
};

export default AudioViewer;
