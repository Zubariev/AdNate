import { useState, forwardRef } from 'react';
import { Element } from '../types.ts';
import DesignElement from './DesignElement.tsx';
import { ZoomIn, ZoomOut } from 'lucide-react';
import CustomSizeDialog from './CustomSizeDialog.tsx';

interface CanvasProps {
  elements: Element[];
  selectedElement: Element | null;
  onSelectElement: (element: Element | null) => void;
  onUpdateElement: (id: string, updates: Partial<Element>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  canvasSize: { width: number; height: number };
  zoom: number;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ 
  elements, 
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  canvasSize,
  zoom
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);

  const handleZoom = (delta: number) => {
    // Zoom is now controlled by parent component
    // This could be removed or handled differently
  };

  const handleUpdateElement = (updatedElement: Element) => {
    onUpdateElement(updatedElement.id, updatedElement);
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
            width: canvasSize.width,
            height: canvasSize.height,
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
              onDelete={onDeleteElement}
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
          // Size changes are now handled by parent component
        }}
        currentWidth={canvasSize.width}
        currentHeight={canvasSize.height}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;