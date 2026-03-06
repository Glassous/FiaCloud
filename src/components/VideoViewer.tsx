import React from 'react';
import './VideoViewer.css';

interface VideoViewerProps {
  url: string;
  filename: string;
}

const VideoViewer: React.FC<VideoViewerProps> = ({ url, filename }) => {
  return (
    <div className="video-viewer-container">
      <video 
        controls 
        className="video-viewer-content"
        src={url}
        title={filename}
      >
        您的浏览器不支持视频标签。
      </video>
    </div>
  );
};

export default VideoViewer;
