import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import Canvas from './Canvas';
import ElementPanel from './ElementPanel';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel';
import Toolbar from './Toolbar';
import ImageGenerator from './ImageGenerator';
import CustomSizeDialog from './CustomSizeDialog';
import html2canvas from 'html2canvas';

// TypeScript interfaces
interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'icon' | 'line'; // Added 'line'
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  opacity: number;
  shapeType?: string;
  zIndex: number;
  locked?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  iconName?: string;
  properties?: Record<string, any>; // Added for generic properties
}

interface CanvasSize {
  width: number;
  height: number;
}

interface DesignEditorProps {
  initialElements?: DesignElement[];
  onSave?: (elements: DesignElement[]) => void;
  onExport?: (format: string) => void;
}

const DesignEditor: React.FC<DesignEditorProps> = ({ initialElements = [], onSave, onExport }) => {
  const [elements, setElements] = useState<DesignElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });
  const [showImageGenerator, setShowImageGenerator] = useState<boolean>(false);
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState<boolean>(false);
  const [designName, setDesignName] = useState<string>('Untitled Design');
  const [zoom, setZoom] = useState<number>(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addElement = useCallback((element: Partial<DesignElement>) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: element.type || 'text',
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 100,
      height: element.height || 50,
      rotation: element.rotation || 0,
      content: element.content || '',
      fontSize: element.fontSize || 16,
      fontFamily: element.fontFamily || 'Arial',
      color: element.color || '#000000',
      backgroundColor: element.backgroundColor || 'transparent',
      opacity: element.opacity !== undefined ? element.opacity : 1,
      shapeType: element.shapeType,
      zIndex: elements.length,
      locked: element.locked || false,
      isBold: element.isBold || false,
      isItalic: element.isItalic || false,
      iconName: element.iconName,
      properties: element.properties || {},
    };
    setElements(prev => [...prev, newElement]);
  }, [elements.length]);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
    // Update selectedElement if it's the one being updated
    if (selectedElement?.id === id) {
      setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedElement]);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const duplicateElement = useCallback((id: string) => {
    const elementToDuplicate = elements.find(el => el.id === id);
    if (elementToDuplicate) {
      const newElement: DesignElement = {
        ...elementToDuplicate,
        id: Date.now().toString(),
        x: elementToDuplicate.x + 20, // Offset for visibility
        y: elementToDuplicate.y + 20,
        zIndex: elements.length, // Ensure new element is on top
      };
      setElements(prev => [...prev, newElement]);
    }
  }, [elements]);

  const exportDesign = useCallback(async () => {
    if (onExport) {
      // Assuming onExport is for exporting the data structure, not the rendered image
      onExport('json'); // Or any other format
    } else {
      // Default export to PNG using html2canvas
      if (canvasRef.current) {
        try {
          const canvas = await html2canvas(canvasRef.current);
          const link = document.createElement('a');
          link.download = `${designName}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } catch (error) {
          console.error('Export failed:', error);
        }
      }
    }
  }, [designName, onExport]);

  const handleCanvasSizeChange = useCallback((preset: string) => {
    const sizes: Record<string, CanvasSize> = {
      'social-post': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'banner': { width: 1200, height: 628 },
      'poster': { width: 600, height: 800 },
      'custom': canvasSize, // Keep current size if 'custom' is selected, dialog will handle actual change
    };

    if (preset === 'custom') {
      setShowCustomSizeDialog(true);
    } else if (sizes[preset]) {
      setCanvasSize(sizes[preset]);
    }
  }, [canvasSize]); // Dependency on canvasSize is for the 'custom' case to pass current size

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(elements);
    } else {
      console.log('Saving elements:', elements);
    }
  }, [onSave, elements]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            value={designName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesignName(e.target.value)}
            className="text-lg font-semibold border-none shadow-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowImageGenerator(true)}
          >
            AI Image
          </Button>
          <Button onClick={exportDesign}>
            Export
          </Button>
          <Button onClick={handleSave} variant="secondary">
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <ElementPanel onAddElement={addElement} />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar 
            onCanvasSizeChange={handleCanvasSizeChange}
            canvasSize={canvasSize}
            onZoomChange={setZoom} // Assuming Toolbar will handle zoom
            currentZoom={zoom}
          />
          <div className="flex-1 overflow-auto p-8 bg-gray-100" ref={canvasRef}>
            <Canvas
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onDuplicateElement={duplicateElement}
              canvasSize={canvasSize}
              zoom={zoom}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <LayerPanel
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
            />
          </div>
          {selectedElement && (
            <div className="border-t border-gray-200">
              <PropertiesPanel
                element={selectedElement}
                onUpdateElement={(updates) => updateElement(selectedElement.id, updates)}
                onDeleteElement={() => deleteElement(selectedElement.id)}
                onDuplicateElement={() => duplicateElement(selectedElement.id)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showImageGenerator && (
        <ImageGenerator
          onClose={() => setShowImageGenerator(false)}
          onImageGenerated={(imageUrl: string) => {
            addElement({
              type: 'image',
              content: imageUrl,
              width: 200, // Default width for generated image
              height: 200, // Default height for generated image
              x: canvasSize.width / 2 - 100, // Center horizontally
              y: canvasSize.height / 2 - 100, // Center vertically
            });
            setShowImageGenerator(false);
          }}
        />
      )}

      {showCustomSizeDialog && (
        <CustomSizeDialog
          currentSize={canvasSize}
          onSizeChange={(size: CanvasSize) => {
            setCanvasSize(size);
            setShowCustomSizeDialog(false);
          }}
          onClose={() => setShowCustomSizeDialog(false)}
        />
      )}
    </div>
  );
};

export { DesignEditor };