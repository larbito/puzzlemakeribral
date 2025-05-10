import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onUpload: (file: File) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-48 object-contain"
            />
            <p className="text-sm text-gray-600">Drop a new image to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the image here'
                : 'Drag and drop an image here, or click to select'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 