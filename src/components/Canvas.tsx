import { useState, forwardRef } from 'react';
import { Element } from '../types.ts';
import DesignElement from './DesignElement.tsx';

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
  canvasSize,
  zoom
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleUpdateElement = (updatedElement: Element) => {
    onUpdateElement(updatedElement.id, updatedElement);
  };

  return (
    <div className="relative flex-1 bg-gray-100">
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
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;