'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { X, Image, FileText, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (result: UploadResult) => void;
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxSizeMB?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  preview?: string;
}

export default function FileUpload({
  onUpload,
  folder = 'general',
  resourceType = 'auto',
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  multiple = false,
  className,
  children,
}: FileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Handle single file for now

    // Validate file
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadState(prev => ({ ...prev, preview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }

    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0 }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('resourceType', resourceType);

      // Simulate progress (since we can't track real progress with FormData)
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadState(prev => ({ ...prev, progress: 100 }));
      
      setTimeout(() => {
        setUploadState({ isUploading: false, progress: 0 });
        onUpload(result.data);
        toast.success('File uploaded successfully');
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploadState({ isUploading: false, progress: 0 });
    }
  }, [folder, resourceType, maxSizeMB, allowedTypes, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setUploadState(prev => ({ ...prev, preview: undefined }));
  };

  const getFileIcon = () => {
    if (resourceType === 'image') return Image;
    if (resourceType === 'video') return Video;
    return FileText;
  };

  const FileIcon = getFileIcon();

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedTypes.join(',')}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {children ? (
        <div onClick={openFileDialog} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-gray-400 hover:bg-gray-50',
            uploadState.isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">
            {uploadState.isUploading ? 'Uploading...' : 'Upload files'}
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Max file size: {maxSizeMB}MB • Supported: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
          </p>
        </div>
      )}

      {uploadState.isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadState.progress}%</span>
          </div>
          <Progress value={uploadState.progress} className="w-full" />
        </div>
      )}

      {uploadState.preview && (
        <div className="relative inline-block">
          <img
            src={uploadState.preview}
            alt="Preview"
            className="h-32 w-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
