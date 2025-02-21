import { useState, forwardRef } from 'react';
import { Element } from '../types.ts';
import DesignElement from './DesignElement.tsx';
import { ZoomIn, ZoomOut } from 'lucide-react';
import CustomSizeDialog from './CustomSizeDialog.tsx';

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

  return (
    <div className="relative flex-1 bg-gray-100">
      <div className="absolute top-4 right-4 z-10 space-x-2">
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
        className="overflow-auto relative"
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