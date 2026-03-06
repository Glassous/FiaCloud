import React from 'react';
import './ImageViewer.css';

interface ImageViewerProps {
  url: string;
  alt: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ url, alt }) => {
  return (
    <div className="image-viewer-container">
      <img src={url} alt={alt} className="image-viewer-content" />
    </div>
  );
};

export default ImageViewer;
