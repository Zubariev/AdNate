import React, { useState, useRef, forwardRef, ForwardedRef } from 'react';
import { Element } from '../types';
import DesignElement from './DesignElement';
import { ZoomIn, ZoomOut } from 'lucide-react';
import DesignPreview from './DesignPreview';
import CustomSizeDialog from './CustomSizeDialog';

interface CanvasProps {
  elements: Element[];
  setElements: (elements: Element[]) => void;
  width?: number;
  height?: number;
  onSizeChange?: (width: number, height: number) => void;
}

const Canvas = forwardRef(({ 
  elements, 
  setElements,
  width = 800, 
  height = 600,
  onSizeChange
}: CanvasProps, ref: ForwardedRef<HTMLDivElement>) => {
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);
  const rulerSize = 20;

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(2, prev + delta)));
  };

  const handleUpdateElement = (updatedElement: Element) => {
    setElements(elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    ));
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const renderRulers = () => {
    const horizontalMarks = [];
    const verticalMarks = [];
    const step = 50; // pixels between marks

    for (let i = 0; i < width; i += step) {
      horizontalMarks.push(
        <div
          key={`h-${i}`}
          className="absolute border-l border-gray-300"
          style={{
            left: i,
            height: rulerSize / 2,
            top: rulerSize / 2,
          }}
        >
          <span className="absolute -left-3 top-4 text-[8px] text-gray-500">
            {i}
          </span>
        </div>
      );
    }

    for (let i = 0; i < height; i += step) {
      verticalMarks.push(
        <div
          key={`v-${i}`}
          className="absolute border-t border-gray-300"
          style={{
            top: i,
            width: rulerSize / 2,
            left: rulerSize / 2,
          }}
        >
          <span className="absolute -top-3 left-4 text-[8px] text-gray-500">
            {i}
          </span>
        </div>
      );
    }

    return (
      <>
        <div
          className="absolute top-0 left-0 bg-white border-b border-r border-gray-300"
          style={{ width: rulerSize, height: rulerSize, zIndex: 2 }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-white border-r border-gray-300"
          style={{ width: rulerSize, paddingTop: rulerSize, zIndex: 1 }}
        >
          {verticalMarks}
        </div>
        <div
          className="absolute top-0 left-0 w-full bg-white border-b border-gray-300"
          style={{ height: rulerSize, paddingLeft: rulerSize, zIndex: 1 }}
        >
          {horizontalMarks}
        </div>
      </>
    );
  };

  return (
    <div className="relative flex-1 bg-gray-50">
      {renderRulers()}
      <div className="absolute z-10 flex items-center p-2 space-x-2 bg-white rounded-lg shadow-lg right-4 top-4">
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1 rounded hover:bg-gray-100"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="min-w-[40px] text-center text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(0.1)}
          className="p-1 rounded hover:bg-gray-100"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      
      <div className="absolute z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg left-4 top-4">
        <span className="px-2 text-sm">{width} × {height}</span>
        <button
          onClick={() => setIsCustomSizeOpen(true)}
          className="px-3 py-1 text-sm text-indigo-600 rounded-r-lg hover:bg-indigo-50"
        >
          Custom
        </button>
      </div>
      
      <div 
        ref={ref}
        className="relative overflow-auto"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <div
          className="relative mx-auto my-8 bg-white shadow-lg"
          style={{
            width,
            height,
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
          onClick={() => setSelectedElement(null)}
        >
          {elements
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <DesignElement
                key={`element-${element.id}`}
                element={element}
                isSelected={selectedElement?.id === element.id}
                onSelect={() => setSelectedElement(element)}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            ))}
        </div>
      </div>
      <CustomSizeDialog
        isOpen={isCustomSizeOpen}
        onClose={() => setIsCustomSizeOpen(false)}
        onApply={(w, h) => {
          if (onSizeChange) onSizeChange(w, h);
        }}
        currentWidth={width}
        currentHeight={height}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;