import React, { useState, useCallback } from 'react';
import { Upload, Image, X, Download } from 'lucide-react';
import { 
  createReferenceImageWithStorage, 
  createTemporaryImageLink, 
  downloadImageAsFile,
  getReferenceImageWithTempLink 
} from '../api/supabase';

interface ImageUploaderProps {
  briefId: string;
  conceptId: string;
  onImageUploaded?: (referenceImage: any) => void;
  onError?: (error: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  briefId,
  conceptId,
  onImageUploaded,
  onError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const promptUsed = `Image uploaded for concept ${conceptId}`;
      const imageData = {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        fileType: file.type
      };

      const referenceImage = await createReferenceImageWithStorage(
        conceptId,
        briefId,
        file,
        promptUsed,
        imageData
      );

      setUploadedImages(prev => [...prev, referenceImage]);
      onImageUploaded?.(referenceImage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      onError?.(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [briefId, conceptId, onImageUploaded, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const generateTempLink = useCallback(async (imageId: string) => {
    try {
      const imageWithLink = await getReferenceImageWithTempLink(imageId, 3600);
      if (imageWithLink.tempUrl) {
        window.open(imageWithLink.tempUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating temp link:', error);
      onError?.('Failed to generate download link');
    }
  }, [onError]);

  return (
    <div className=\"space-y-4\">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type=\"file\"
          id=\"file-upload\"
          className=\"hidden\"
          accept=\"image/*\"
          onChange={handleFileInput}
          disabled={isUploading}
        />
        
        <div className=\"space-y-4\">
          <div className=\"flex justify-center\">
            {isUploading ? (
              <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500\" />
            ) : (
              <Upload className=\"h-12 w-12 text-gray-400\" />
            )}
          </div>
          
          <div>
            <p className=\"text-lg font-medium text-gray-900\">
              {isUploading ? 'Uploading...' : 'Upload Reference Image'}
            </p>
            <p className=\"text-sm text-gray-500 mt-1\">
              Drag and drop an image here, or{' '}
              <label
                htmlFor=\"file-upload\"
                className=\"text-blue-500 hover:text-blue-600 cursor-pointer\"
              >
                browse to choose a file
              </label>
            </p>
            <p className=\"text-xs text-gray-400 mt-2\">
              Supports: PNG, JPG, GIF (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className=\"space-y-3\">
          <h3 className=\"text-sm font-medium text-gray-900\">Uploaded Images</h3>
          <div className=\"grid grid-cols-1 gap-3\">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className=\"flex items-center justify-between p-3 border border-gray-200 rounded-lg\"
              >
                <div className=\"flex items-center space-x-3\">
                  <Image className=\"h-5 w-5 text-gray-400\" />
                  <div>
                    <p className=\"text-sm font-medium text-gray-900\">
                      {image.file_name || 'Reference Image'}
                    </p>
                    <p className=\"text-xs text-gray-500\">
                      {image.file_size ? `${Math.round(image.file_size / 1024)} KB` : 'Unknown size'} • 
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className=\"flex items-center space-x-2\">
                  <button
                    onClick={() => generateTempLink(image.id)}
                    className=\"p-2 text-gray-400 hover:text-blue-500 transition-colors\"
                    title=\"Generate download link\"
                  >
                    <Download className=\"h-4 w-4\" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;