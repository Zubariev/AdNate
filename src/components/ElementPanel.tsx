import React, { useRef } from 'react';
import { 
  Type, 
  Square, 
  Circle, 
  Triangle,
  Hexagon,
  Star,
  Heart,
  MessageCircle,
  ArrowRight,
  Upload
} from 'lucide-react';
import { ElementType } from '../types';

interface ElementPanelProps {
  onAddElement: (type: ElementType) => void;
}

const ElementPanel: React.FC<ElementPanelProps> = ({ onAddElement }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shapes = [
    { name: 'Rectangle', icon: Square },
    { name: 'Circle', icon: Circle },
    { name: 'Triangle', icon: Triangle },
    { name: 'Hexagon', icon: Hexagon },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
    { name: 'Message', icon: MessageCircle },
    { name: 'Arrow', icon: ArrowRight }
  ];

  const handleAddElement = (type: ElementType) => {
    // Simply pass the type to the parent component
    // The parent will handle creating the element with proper defaults
    onAddElement(type);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // For now, just add an image element type
      // The parent component will handle the actual element creation
      onAddElement('image');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="overflow-y-auto h-full bg-white">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Elements</h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAddElement('text')}
              className="flex flex-col items-center p-3 rounded-lg border transition-colors hover:bg-gray-50"
            >
              <Type className="mb-1 w-5 h-5" />
              <span className="text-xs">Text</span>
            </button>

            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center p-3 rounded-lg border transition-colors hover:bg-gray-50"
            >
              <Upload className="mb-1 w-5 h-5" />
              <span className="text-xs">Upload Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Shapes</h2>
          <div className="grid grid-cols-3 gap-2">
            {shapes.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleAddElement('shape')}
                className="flex flex-col items-center p-3 rounded-lg border transition-colors hover:bg-gray-50"
              >
                <Icon className="mb-1 w-5 h-5" />
                <span className="text-xs">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementPanel;