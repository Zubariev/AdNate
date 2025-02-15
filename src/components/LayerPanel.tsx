import React from 'react';
import { Element } from '../types';
import { ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock, MoreVertical } from 'lucide-react';

interface LayerPanelProps {
  elements: Element[];
  selectedElement: Element | null;
  onSelectElement: (element: Element | null) => void;
  onUpdateElement: (element: Element) => void;
  onReorderLayers: (startIndex: number, endIndex: number) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onReorderLayers,
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const draggedElement = elements[draggedIndex];
    if (!draggedElement) return;

    if (draggedIndex !== index) {
      onReorderLayers(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getElementLabel = (element: Element) => {
    switch (element.type) {
      case 'text':
        return `Text: ${element.content.slice(0, 20)}${element.content.length > 20 ? '...' : ''}`;
      case 'shape':
        return `Shape: ${element.shapeType}`;
      case 'image':
        return 'Image';
      default:
        return 'Element';
    }
  };

  const toggleVisibility = (element: Element) => {
    onUpdateElement({
      ...element,
      opacity: element.opacity === 0 ? 1 : 0,
    });
  };

  const toggleLock = (element: Element) => {
    onUpdateElement({
      ...element,
      locked: !element.locked,
    });
  };

  const moveToFront = (element: Element) => {
    onUpdateElement({
      ...element,
      zIndex: Math.max(...elements.map(e => e.zIndex)) + 1,
    });
  };

  const moveToBack = (element: Element) => {
    onUpdateElement({
      ...element,
      zIndex: Math.min(...elements.map(e => e.zIndex)) - 1,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold">Layers</h2>
      </div>
      <div className="space-y-1">
        {[...elements]
          .sort((a, b) => b.zIndex - a.zIndex)
          .map((element, index) => (
            <div
              key={element.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center justify-between rounded-md p-2 ${
                selectedElement?.id === element.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div
                className="flex flex-1 cursor-pointer items-center space-x-2"
                onClick={() => onSelectElement(element)}
              >
                <MoreVertical className="h-4 w-4 cursor-grab text-gray-400" />
                <span className="text-sm">{getElementLabel(element)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleVisibility(element)}
                  className="rounded p-1 hover:bg-gray-100"
                  title={element.opacity === 0 ? 'Show' : 'Hide'}
                >
                  {element.opacity === 0 ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                <button
                  onClick={() => toggleLock(element)}
                  className="rounded p-1 hover:bg-gray-100"
                  title={element.locked ? 'Unlock' : 'Lock'}
                >
                  {element.locked ? (
                    <Lock className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                <div className="flex flex-col">
                  <button
                    onClick={() => moveToFront(element)}
                    className="rounded p-1 hover:bg-gray-100"
                    title="Bring to Front"
                  >
                    <ChevronUp className="h-3 w-3 text-gray-500" />
                  </button>
                  <button
                    onClick={() => moveToBack(element)}
                    className="rounded p-1 hover:bg-gray-100"
                    title="Send to Back"
                  >
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default LayerPanel;