import React, { useState, useRef, forwardRef } from 'react';
import { Element } from '../types';
import DesignElement from './DesignElement';
import { ZoomIn, ZoomOut } from 'lucide-react';
import CustomSizeDialog from './CustomSizeDialog';

interface CanvasProps {
  elements: Element[];
  setElements: (elements: Element[]) => void;
  selectedElement: Element | null;
  onSelectElement: (element: Element | null) => void;
  width?: number;
  height?: number;
  onSizeChange?: (width: number, height: number) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ 
  elements, 
  setElements,
  selectedElement,
  onSelectElement,
  width = 800, 
  height = 600,
  onSizeChange
}, ref) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);

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
            height: 20 / 2,
            top: 20 / 2,
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
            width: 20 / 2,
            left: 20 / 2,
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
          style={{ width: 20, height: 20, zIndex: 2 }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-white border-r border-gray-300"
          style={{ width: 20, paddingTop: 20, zIndex: 1 }}
        >
          {verticalMarks}
        </div>
        <div
          className="absolute top-0 left-0 w-full bg-white border-b border-gray-300"
          style={{ height: 20, paddingLeft: 20, zIndex: 1 }}
        >
          {horizontalMarks}
        </div>
      </>
    );
  };

  return (
    <div className="relative flex-1 bg-gray-100">
      <div className="absolute z-10 space-x-2 top-4 right-4">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        >
          <ZoomOut className="w-4 h-4" />
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
          onClick={() => onSelectElement(null)}
        >
          {elements.map((element) => (
            <DesignElement
              key={element.id}
              element={element}
              isSelected={selectedElement?.id === element.id}
              onSelect={() => onSelectElement(element)}
              onUpdate={handleUpdateElement}
              onDelete={(id) => setElements(elements.filter(el => el.id !== id))}
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