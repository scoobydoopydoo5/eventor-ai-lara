import { useState } from 'react';
import { Button } from './button';
import { Sparkles, Upload, RefreshCw, Loader2 } from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { Card } from './card';

interface ImageGeneratorUploaderProps {
  prompt: string;
  context?: any;
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

export const ImageGeneratorUploader = ({
  prompt,
  context,
  currentImage,
  onImageChange,
  label = 'Event Image'
}: ImageGeneratorUploaderProps) => {
  const { generateImage, isGenerating } = useImageGeneration();
  const [uploading, setUploading] = useState(false);

  const handleGenerate = async () => {
    const image = await generateImage(prompt, context);
    if (image) {
      onImageChange(image);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading:', error);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">{label}</label>
      {currentImage && (
        <Card className="overflow-hidden">
          <img src={currentImage} alt={label} className="w-full h-48 object-cover rounded-xl" />
        </Card>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating || uploading}
          className="flex-1"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : currentImage ? (
            <RefreshCw className="h-4 w-4 mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {currentImage ? 'Regenerate' : 'Generate'} with AI
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isGenerating || uploading}
          className="flex-1"
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Upload Image
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
