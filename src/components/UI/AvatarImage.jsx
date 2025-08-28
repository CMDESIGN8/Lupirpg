// src/components/UI/AvatarImage.jsx
import React, { useState, useEffect } from 'react';

const AvatarImage = ({ src, alt, className = '' }) => {
  const [imageType, setImageType] = useState('unknown');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Detectar tipo de imagen
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (img.width > img.height) {
        setImageType('landscape');
      } else if (img.height > img.width) {
        setImageType('portrait');
      } else {
        setImageType('square');
      }
    };
    img.onerror = () => {
      setHasError(true);
    };
  }, [src]);

  const getImageClass = () => {
    if (hasError) return 'avatar-error';
    return `avatar-image ${imageType} ${className}`;
  };

  if (hasError) {
    return (
      <div className="avatar-error-placeholder">
        <div className="error-icon">⚠️</div>
        <span>Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={getImageClass()}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default AvatarImage;