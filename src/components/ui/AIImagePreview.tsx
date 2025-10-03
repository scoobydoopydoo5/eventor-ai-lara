import { useState } from 'react';

interface AIImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
}

export const AIImagePreview = ({ src, alt, className = '' }: AIImagePreviewProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={() => setShowPreview(true)}
      />
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <img src={src} alt={alt} className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </>
  );
};
