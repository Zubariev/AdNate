import React, { useState, useEffect } from 'react';
import { Element } from '../types.ts';
import { ChevronUp, ChevronDown, Copy, Trash, Bold, Italic } from 'lucide-react';

interface PropertiesPanelProps {
  element: Element;
  onUpdateElement: (id: string, updates: Partial<Element>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}) => {
  const [elementState, setElementState] = useState<Element | null>(null);

  const fonts = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Georgia',
    'Verdana',
    'Courier New',
    'Impact',
  ];

  useEffect(() => {
    setElementState(element);
  }, [element]);

  if (!elementState) {
    return (
      <div className="flex justify-center items-center p-4 h-full text-gray-500">
        Select an element to edit its properties
      </div>
    );
  }

  const handlePropertyUpdate = (property: keyof Element, value: string | number | boolean) => {
    onUpdateElement(elementState.id, { [property]: value });
  };

  const handleNumberInput = (
    value: string,
    property: keyof Element,
    min?: number,
    max?: number
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    
    let finalValue = num;
    if (min !== undefined) finalValue = Math.max(min, finalValue);
    if (max !== undefined) finalValue = Math.min(max, finalValue);
    
    handlePropertyUpdate(property, finalValue);
  };

  return (
    <div className="overflow-y-auto p-4 h-full bg-white">
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onDuplicateElement(elementState.id)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteElement(elementState.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
              title="Delete"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">X</label>
                <input
                  type="number"
                  value={elementState.x}
                  onChange={(e) => handleNumberInput(e.target.value, 'x')}
                  className="px-2 py-1 w-full text-sm rounded border"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  value={elementState.y}
                  onChange={(e) => handleNumberInput(e.target.value, 'y')}
                  className="px-2 py-1 w-full text-sm rounded border"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">Width</label>
                <input
                  type="number"
                  value={elementState.width}
                  onChange={(e) => handleNumberInput(e.target.value, 'width', 10)}
                  className="px-2 py-1 w-full text-sm rounded border"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Height</label>
                <input
                  type="number"
                  value={elementState.height}
                  onChange={(e) => handleNumberInput(e.target.value, 'height', 10)}
                  className="px-2 py-1 w-full text-sm rounded border"
                />
              </div>
            </div>
          </div>

          {/* Text Properties */}
          {elementState.type === 'text' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Text</label>
                <textarea
                  value={elementState.content}
                  onChange={(e) => handlePropertyUpdate('content', e.target.value)}
                  className="px-2 py-1 w-full text-sm rounded border"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Font</label>
                <select
                  value={elementState.fontFamily}
                  onChange={(e) => handlePropertyUpdate('fontFamily', e.target.value)}
                  className="px-2 py-1 w-full text-sm rounded border"
                >
                  {fonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Font Size</label>
                <input
                  type="number"
                  value={elementState.fontSize}
                  onChange={(e) => handleNumberInput(e.target.value, 'fontSize', 8, 200)}
                  className="px-2 py-1 w-full text-sm rounded border"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handlePropertyUpdate('isBold', !elementState.isBold)}
                  className={`p-2 rounded ${elementState.isBold ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePropertyUpdate('isItalic', !elementState.isItalic)}
                  className={`p-2 rounded ${elementState.isItalic ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Color Properties */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="color"
              value={elementState.color}
              onChange={(e) => handlePropertyUpdate('color', e.target.value)}
              className="w-full h-8"
            />
          </div>

          {elementState.type !== 'image' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Background</label>
              <input
                type="color"
                value={elementState.backgroundColor}
                onChange={(e) => handlePropertyUpdate('backgroundColor', e.target.value)}
                className="w-full h-8"
              />
            </div>
          )}

          {/* Rotation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rotation</label>
            <input
              type="range"
              min="0"
              max="360"
              value={elementState.rotation || 0}
              onChange={(e) => handleNumberInput(e.target.value, 'rotation', 0, 360)}
              className="w-full"
            />
            <input
              type="number"
              value={elementState.rotation || 0}
              onChange={(e) => handleNumberInput(e.target.value, 'rotation', 0, 360)}
              className="px-2 py-1 w-full text-sm rounded border"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={elementState.opacity * 100}
              onChange={(e) => handleNumberInput((parseInt(e.target.value) / 100).toString(), 'opacity', 0, 1)}
              className="w-full"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;