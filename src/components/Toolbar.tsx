import React, { useState, useEffect } from 'react';
import { Code, Save, Download, ArrowLeft } from 'lucide-react';
import { Element, DesignData } from '../types.ts';
import html2canvas from 'html2canvas/dist/html2canvas.js';

interface ToolbarProps {
  elements: Element[];
  canvasRef: React.RefObject<HTMLDivElement>;
  currentDesign: DesignData | null;
  onSaveDesign: () => void;
  onShowGallery: () => void;
  onImportJSON: (elements: Element[]) => void;
  onTemplateSelect: (width: number, height: number) => void;
  saving: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  elements, 
  canvasRef,
  currentDesign,
  onSaveDesign,
  onShowGallery,
  onImportJSON,
  onTemplateSelect,
  saving
}) => {
  const [isJSONEditorOpen, setIsJSONEditorOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState('');

  const templates = [
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Facebook Cover', width: 851, height: 315 },
    { name: 'Custom', width: 800, height: 800 }
  ];

  useEffect(() => {
    if (currentDesign?.data) {
      console.log('Current design in Toolbar:', currentDesign);
      const designJSON = JSON.stringify({
        metadata: {
          id: currentDesign.id,
          name: currentDesign.data.metadata.name,
          width: currentDesign.data.metadata.width,
          height: currentDesign.data.metadata.height,
          createdAt: currentDesign.data.metadata.createdAt,
          updatedAt: currentDesign.data.metadata.updatedAt
        },
        elements: elements
      }, null, 2);
      setJsonContent(designJSON);
    } else {
      const designJSON = JSON.stringify({
        metadata: {
          id: '',
          name: "Untitled Design",
          width: 800,
          height: 730,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        elements: []
      }, null, 2);
      setJsonContent(designJSON);
    }
  }, [currentDesign, elements]);

  const handleExportJSON = () => {
    const designData = {
      metadata: currentDesign?.data?.metadata || {
        id: currentDesign?.id || '',
        name: 'Untitled Design',
        width: canvasRef.current?.offsetWidth || 800,
        height: canvasRef.current?.offsetHeight || 800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      elements: elements
    };
    
    const designJSON = JSON.stringify(designData, null, 2);
    setJsonContent(designJSON);
    setIsJSONEditorOpen(true);
    setError('');
  };

  const handleImportJSON = () => {
    try {
      const parsedData = JSON.parse(jsonContent);
      if (!parsedData.elements || !Array.isArray(parsedData.elements)) {
        throw new Error('Invalid JSON format: must contain elements array');
      }
      onImportJSON(parsedData.elements);
      if (parsedData.metadata) {
        onTemplateSelect(parsedData.metadata.width, parsedData.metadata.height);
      }
      setError('');
      setIsJSONEditorOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleSaveImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${currentDesign?.data?.metadata?.name || 'design'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error saving image:', err);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 h-16">
      <div className="flex items-center space-x-4">
        <button
          onClick={onShowGallery}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go to Designs Gallery</span>
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <span className="text-xl font-bold">Design Editor</span>
        <div className="flex items-center space-x-2">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => onTemplateSelect(template.width, template.height)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportJSON}
          className="flex items-center px-4 py-2 space-x-1 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Code className="w-4 h-4" />
          <span>Edit JSON</span>
        </button>
        <button
          onClick={handleSaveImage}
          className="flex items-center px-4 py-2 space-x-1 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Download className="w-4 h-4" />
          <span>Save Image</span>
        </button>
        <button 
          onClick={onSaveDesign}
          disabled={saving}
          className={`flex items-center px-4 py-2 space-x-1 text-white rounded-md ${
            saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Design'}</span>
        </button>
      </div>

      {isJSONEditorOpen && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="w-[800px] rounded-lg bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Design JSON</h2>
              <button
                onClick={() => setIsJSONEditorOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-4">
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="h-[400px] w-full rounded-md border border-gray-300 font-mono text-sm"
                spellCheck={false}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsJSONEditorOpen(false)}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJSON}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;