import React, { useState, useEffect } from 'react';
import { Image, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { 
  getAllReferenceImagesWithTempLinks,
  getReferenceImageWithTempLink,
} from '../api/supabase';
import { ReferenceImage } from '../types';

interface ReferenceImageManagerProps {
  briefId: string;
  conceptId?: string;
  onImageSelect?: (imageUrl: string, imageData: ReferenceImage) => void;
  showActions?: boolean;
}

export const ReferenceImageManager: React.FC<ReferenceImageManagerProps> = ({
  briefId,
  conceptId,
  onImageSelect,
  showActions = true
}) => {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadImages();
  }, [briefId, conceptId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allImages = await getAllReferenceImagesWithTempLinks(briefId, 3600);
      
      // Filter by concept if specified
      const filteredImages = conceptId 
        ? allImages.filter(img => img.concept_id === conceptId)
        : allImages;
      
      setImages(filteredImages);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load reference images');
    } finally {
      setLoading(false);
    }
  };

  const refreshTempLink = async (imageId: string) => {
    try {
      setGeneratingLinks(prev => new Set(prev).add(imageId));
      
      const imageWithNewLink = await getReferenceImageWithTempLink(imageId, 3600);
      
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, tempUrl: imageWithNewLink.tempUrl }
            : img
        )
      );
    } catch (err) {
      console.error('Error refreshing temp link:', err);
      setError('Failed to refresh download link');
    } finally {
      setGeneratingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const copyTempLinkToClipboard = async (tempUrl: string) => {
    try {
      await navigator.clipboard.writeText(tempUrl);
      // You could add a toast notification here
      console.log('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading reference images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={loadImages}
          className="px-4 py-2 text-white bg-blue-500 rounded transition-colors hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Image className="mx-auto mb-4 w-12 h-12 text-gray-300" />
        <p>No reference images found</p>
        {conceptId && (
          <p className="mt-1 text-sm">Upload images for this concept to get started</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Reference Images ({images.length})
        </h3>
        <button
          onClick={loadImages}
          className="p-2 text-gray-400 transition-colors hover:text-gray-600"
          title="Refresh images"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="p-4 rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2 space-x-3">
                  <Image className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {image.file_name || 'Reference Image'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.file_size)} • {formatDate(image.created_at)}
                    </p>
                  </div>
                </div>

                {image.prompt_used && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs text-gray-500">Prompt:</p>
                    <p className="p-2 text-xs text-sm text-gray-700 bg-gray-50 rounded">
                      {image.prompt_used}
                    </p>
                  </div>
                )}

                {image.image_data && Object.keys(image.image_data).length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs text-gray-500">Metadata:</p>
                    <div className="p-2 text-xs text-gray-600 bg-gray-50 rounded">
                      {Object.entries(image.image_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-mono">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="flex items-center ml-4 space-x-2">
                  {image.tempUrl && (
                    <>
                      <button
                        onClick={() => window.open(image.tempUrl, '_blank')}
                        className="p-2 text-gray-400 transition-colors hover:text-blue-500"
                        title="View image"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => image.tempUrl && copyTempLinkToClipboard(image.tempUrl)}
                        className="p-2 text-gray-400 transition-colors hover:text-green-500"
                        title="Copy download link"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {onImageSelect && (
                        <button
                          onClick={() => image.tempUrl && onImageSelect(image.tempUrl, image)}
                          className="px-3 py-1 text-xs text-white bg-blue-500 rounded transition-colors hover:bg-blue-600"
                        >
                          Use in Prompt
                        </button>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={() => refreshTempLink(image.id)}
                    disabled={generatingLinks.has(image.id)}
                    className="p-2 text-gray-400 transition-colors hover:text-blue-500 disabled:opacity-50"
                    title="Generate new download link"
                  >
                    {generatingLinks.has(image.id) ? (
                      <div className="w-4 h-4 rounded-full border-b-2 border-blue-500 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferenceImageManager;