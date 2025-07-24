'use client';

import FileUpload from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/upload';

interface ImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export default function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  className
}: ImageUploadProps) {
  const handleUpload = (result: UploadResult) => {
    const newUrls = [...value, result.url];
    onChange(newUrls);
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {value.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
              <img
                src={optimizeImageUrl(url, { width: 300, height: 300, quality: 80 })}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {canAddMore && (
          <div className="aspect-square">
            <FileUpload
              onUpload={handleUpload}
              folder="products"
              resourceType="image"
              maxSizeMB={5}
              allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
            >
              <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add Image</span>
              </div>
            </FileUpload>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-sm text-gray-500">
          {value.length} of {maxImages} images uploaded
        </p>
      )}
    </div>
  );
}
