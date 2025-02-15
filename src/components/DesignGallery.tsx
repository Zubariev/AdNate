import React from 'react';
import { Plus, Copy, Pencil, Trash } from 'lucide-react';
import DesignPreview from './DesignPreview';
import { Design } from '../lib/database.types';

interface DesignGalleryProps {
  designs: Design[];
  onLoadDesign: (design: Design) => void;
  onDeleteDesign: (id: string) => void;
  onDuplicateDesign: (design: Design) => void;
  onCreateNew: () => void;
}

const DesignGallery: React.FC<DesignGalleryProps> = ({
  designs,
  onLoadDesign,
  onDeleteDesign,
  onDuplicateDesign,
  onCreateNew,
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="p-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            My Designs
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={onCreateNew}
            className="flex flex-col items-center justify-center p-8 text-center transition-all duration-300 bg-white border-2 border-indigo-200 border-dashed shadow-sm rounded-xl group hover:border-indigo-400 hover:bg-indigo-50/50 aspect-video hover:shadow-md"
          >
            <div className="flex items-center justify-center w-16 h-16 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:scale-110">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">Create New Design</h3>
            <p className="mt-2 text-sm text-gray-600">Start from scratch</p>
          </button>

          {designs.map((design) => (
            <div
              key={design.id}
              className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div 
                className="relative overflow-hidden cursor-pointer aspect-video"
                onClick={() => onLoadDesign(design)}
              >
                <DesignPreview 
                  elements={design.data.elements || []}
                  width={design.data.metadata.width}
                  height={design.data.metadata.height}
                />
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 group-hover:opacity-100" />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{design.data.metadata.name}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(design.data.metadata.updatedAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-600">
                    {design.data.elements?.length || 0} elements
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateDesign(design);
                      }}
                      className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-indigo-50"
                      title="Duplicate"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadDesign(design);
                      }}
                      className="p-2 text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                      title="Edit"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDesign(design.id);
                      }}
                      className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignGallery;