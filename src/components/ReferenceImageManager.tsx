import React, { useState, useEffect } from 'react';
import { Image, Download, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { 
  getAllReferenceImagesWithTempLinks,
  getReferenceImageWithTempLink,
  createTemporaryImageLink 
} from '../api/supabase';

interface ReferenceImageManagerProps {
  briefId: string;
  conceptId?: string;
  onImageSelect?: (imageUrl: string, imageData: any) => void;
  showActions?: boolean;
}

export const ReferenceImageManager: React.FC<ReferenceImageManagerProps> = ({
  briefId,
  conceptId,
  onImageSelect,
  showActions = true
}) => {
  const [images, setImages] = useState<any[]>([]);
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
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500\" />
        <span className=\"ml-2 text-gray-600\">Loading reference images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"text-center py-8\">
        <p className=\"text-red-600 mb-4\">{error}</p>
        <button
          onClick={loadImages}
          className=\"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors\"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className=\"text-center py-8 text-gray-500\">
        <Image className=\"h-12 w-12 mx-auto mb-4 text-gray-300\" />
        <p>No reference images found</p>
        {conceptId && (
          <p className=\"text-sm mt-1\">Upload images for this concept to get started</p>
        )}
      </div>
    );
  }

  return (
    <div className=\"space-y-4\">
      <div className=\"flex items-center justify-between\">
        <h3 className=\"text-lg font-medium text-gray-900\">
          Reference Images ({images.length})
        </h3>
        <button
          onClick={loadImages}
          className=\"p-2 text-gray-400 hover:text-gray-600 transition-colors\"
          title=\"Refresh images\"
        >
          <RefreshCw className=\"h-4 w-4\" />
        </button>
      </div>

      <div className=\"grid grid-cols-1 gap-4\">
        {images.map((image) => (
          <div
            key={image.id}
            className=\"border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow\"
          >
            <div className=\"flex items-start justify-between\">
              <div className=\"flex-1\">
                <div className=\"flex items-center space-x-3 mb-2\">
                  <Image className=\"h-5 w-5 text-gray-400\" />
                  <div>
                    <h4 className=\"text-sm font-medium text-gray-900\">
                      {image.file_name || 'Reference Image'}
                    </h4>
                    <p className=\"text-xs text-gray-500\">
                      {formatFileSize(image.file_size)} • {formatDate(image.created_at)}
                    </p>
                  </div>
                </div>

                {image.prompt_used && (
                  <div className=\"mb-3\">
                    <p className=\"text-xs text-gray-500 mb-1\">Prompt:</p>
                    <p className=\"text-sm text-gray-700 bg-gray-50 p-2 rounded text-xs\">
                      {image.prompt_used}
                    </p>
                  </div>
                )}

                {image.image_data && Object.keys(image.image_data).length > 0 && (
                  <div className=\"mb-3\">
                    <p className=\"text-xs text-gray-500 mb-1\">Metadata:</p>
                    <div className=\"text-xs text-gray-600 bg-gray-50 p-2 rounded\">
                      {Object.entries(image.image_data).map(([key, value]) => (
                        <div key={key} className=\"flex justify-between\">
                          <span className=\"font-mono\">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {showActions && (
                <div className=\"flex items-center space-x-2 ml-4\">
                  {image.tempUrl && (
                    <>
                      <button
                        onClick={() => window.open(image.tempUrl, '_blank')}
                        className=\"p-2 text-gray-400 hover:text-blue-500 transition-colors\"
                        title=\"View image\"
                      >
                        <ExternalLink className=\"h-4 w-4\" />
                      </button>
                      
                      <button
                        onClick={() => copyTempLinkToClipboard(image.tempUrl)}
                        className=\"p-2 text-gray-400 hover:text-green-500 transition-colors\"
                        title=\"Copy download link\"
                      >
                        <Download className=\"h-4 w-4\" />
                      </button>
                      
                      {onImageSelect && (
                        <button
                          onClick={() => onImageSelect(image.tempUrl, image)}
                          className=\"px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors\"
                        >
                          Use in Prompt
                        </button>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={() => refreshTempLink(image.id)}
                    disabled={generatingLinks.has(image.id)}
                    className=\"p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50\"
                    title=\"Generate new download link\"
                  >
                    {generatingLinks.has(image.id) ? (
                      <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500\" />
                    ) : (
                      <RefreshCw className=\"h-4 w-4\" />
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