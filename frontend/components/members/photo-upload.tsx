'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, User, Camera, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PhotoUploadProps {
  memberId?: string;
  currentPhotoUrl?: string | null;
  onUploadComplete?: (photoUrl: string | null) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  memberId,
  currentPhotoUrl,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (JPG, PNG, GIF, etc.)';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image must be smaller than 5MB';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload if memberId is provided
    if (memberId) {
      await uploadPhoto(file);
    }
  }, [memberId, onUploadComplete, onUploadError]);

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/v1/gym/members/${memberId}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setPreviewUrl(result.photo.url);
        onUploadComplete?.(result.photo.url);
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      // Reset preview to current photo on error
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, isUploading, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const removePhoto = async () => {
    if (!memberId || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/gym/members/${memberId}/photo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setPreviewUrl(null);
        onUploadComplete?.(null);
      } else {
        throw new Error(result.message || 'Delete failed');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Delete failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative group border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive && !disabled && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !isUploading && 'hover:border-primary cursor-pointer',
          error && 'border-red-300 bg-red-50',
          'border-gray-300'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Photo Preview */}
        {previewUrl ? (
          <div className="relative inline-block">
            <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={previewUrl}
                alt="Member photo"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            
            {/* Remove Button */}
            {memberId && !isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-gray-600">Uploading photo...</p>
              </div>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <div className="flex items-center justify-center mb-2">
                  {dragActive ? (
                    <Camera className="w-6 h-6 text-primary mr-2" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400 mr-2" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {dragActive ? 'Drop photo here' : 'Upload member photo'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Drag and drop or click to select • Max 5MB • JPG, PNG, GIF
                </p>
              </>
            )}
          </div>
        )}

        {/* Upload Instructions for Existing Photo */}
        {previewUrl && !isUploading && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Change Photo</p>
              <p className="text-xs">Click or drag new image</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        {memberId ? (
          'Photo will be saved immediately after upload'
        ) : (
          'Add member details first to save photo'
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
