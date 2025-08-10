
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

interface DesignElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'icon';
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
}

interface CanvasSize {
  width: number;
  height: number;
}

interface DesignEditorProps {}

const DesignEditor: React.FC<DesignEditorProps> = () => {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });
  const [showImageGenerator, setShowImageGenerator] = useState<boolean>(false);
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState<boolean>(false);
  const [designName, setDesignName] = useState<string>('Untitled Design');
  const canvasRef = useRef<HTMLDivElement>(null);

  const addElement = useCallback((element: Omit<DesignElement, 'id' | 'zIndex'>) => {
    const newElement: DesignElement = {
      ...element,
      id: Date.now().toString(),
      zIndex: elements.length,
    };
    setElements(prev => [...prev, newElement]);
  }, [elements.length]);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
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
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement: DesignElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: elements.length,
      };
      setElements(prev => [...prev, newElement]);
    }
  }, [elements]);

  const exportDesign = useCallback(async () => {
    if (canvasRef.current) {
      try {
        const canvas = await html2canvas(canvasRef.current);
        const link = document.createElement('a');
        link.download = `${designName}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  }, [designName]);

  const handleCanvasSizeChange = useCallback((preset: string) => {
    const sizes: Record<string, CanvasSize> = {
      'social-post': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'banner': { width: 1200, height: 628 },
      'poster': { width: 600, height: 800 },
      'custom': canvasSize,
    };
    
    if (preset === 'custom') {
      setShowCustomSizeDialog(true);
    } else {
      setCanvasSize(sizes[preset]);
    }
  }, [canvasSize]);

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
          />
          <div className="flex-1 overflow-auto p-8 bg-gray-100">
            <Canvas
              ref={canvasRef}
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onDuplicateElement={duplicateElement}
              canvasSize={canvasSize}
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
              x: 100,
              y: 100,
              width: 200,
              height: 200,
              rotation: 0,
              opacity: 1,
              content: imageUrl,
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

export default DesignEditor;
