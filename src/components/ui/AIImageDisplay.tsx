import { useState, useEffect } from 'react';
import { Skeleton } from './skeleton';
import { useImageGeneration } from '@/hooks/useImageGeneration';

interface AIImageDisplayProps {
  searchQuery?: string;
  aiPrompt?: string;
  fallbackIcon?: string;
  className?: string;
  alt: string;
}

export const AIImageDisplay = ({
  searchQuery,
  aiPrompt,
  fallbackIcon = '🖼️',
  className = 'w-full h-48 object-cover',
  alt
}: AIImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { getImageWithFallback } = useImageGeneration();

  useEffect(() => {
    loadImage();
  }, [searchQuery, aiPrompt]);

  const loadImage = async () => {
    if (!searchQuery && !aiPrompt) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getImageWithFallback(
        searchQuery || '',
        aiPrompt || searchQuery
      );
      
      if (result?.url) {
        setImageUrl(result.url);
      }
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className={className} />;
  }

  if (!imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted text-4xl`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`rounded-xl ${className}`}
      onError={() => setImageUrl(null)}
    />
  );
};
