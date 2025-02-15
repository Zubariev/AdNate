import React, { useState, useRef } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle,
  Hexagon,
  Star,
  Heart,
  MessageCircle,
  ArrowRight,
  Check,
  X,
  Plus,
  Minus,
  DollarSign,
  ShoppingCart,
  Search,
  Menu,
  User,
  Settings,
  Bell,
  Home,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  Share2,
  Upload
} from 'lucide-react';
import { ElementType, ShapeType } from '../types';

interface ElementPanelProps {
  onAddElement: (element: Partial<Element>) => void;
}

const ElementPanel: React.FC<ElementPanelProps> = ({ onAddElement }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const shapes = [
    { name: 'Rectangle', icon: Square, type: 'rectangle' },
    { name: 'Circle', icon: Circle, type: 'circle' },
    { name: 'Triangle', icon: Triangle, type: 'triangle' },
    { name: 'Hexagon', icon: Hexagon, type: 'hexagon' },
    { name: 'Star', icon: Star, type: 'star' },
    { name: 'Heart', icon: Heart, type: 'heart' },
    { name: 'Message', icon: MessageCircle, type: 'message' },
    { name: 'Arrow', icon: ArrowRight, type: 'arrow' }
  ];

  const uiIcons = [
    { name: 'Menu', icon: Menu },
    { name: 'Search', icon: Search },
    { name: 'User', icon: User },
    { name: 'Settings', icon: Settings },
    { name: 'Bell', icon: Bell },
    { name: 'Home', icon: Home },
    { name: 'Calendar', icon: Calendar },
    { name: 'Check', icon: Check },
    { name: 'Close', icon: X },
    { name: 'Plus', icon: Plus },
    { name: 'Minus', icon: Minus }
  ];

  const businessIcons = [
    { name: 'Cart', icon: ShoppingCart },
    { name: 'Price', icon: DollarSign },
    { name: 'Mail', icon: Mail },
    { name: 'Phone', icon: Phone },
    { name: 'Location', icon: MapPin },
    { name: 'Website', icon: Globe },
    { name: 'Share', icon: Share2 }
  ];

  const handleAddElement = (type: ElementType, shapeType?: ShapeType, iconName?: string) => {
    if (type === 'text') {
      onAddElement({
        id: crypto.randomUUID(),
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        content: 'Double click to edit text',
        color: '#000000',
        backgroundColor: 'transparent',
        fontSize: 16,
        fontFamily: 'Arial',
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        isBold: false,
        isItalic: false
      });
      return;
    }

    const newElement = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      color: '#000000',
      backgroundColor: '#ffffff',
    };

    if (type === 'shape' && shapeType) {
      newElement.shapeType = shapeType;
    }

    if (type === 'icon' && iconName) {
      newElement.iconName = iconName;
    }

    onAddElement(newElement);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onAddElement({
        id: crypto.randomUUID(),
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        content: e.target?.result as string,
        rotation: 0,
        opacity: 1,
        zIndex: 1
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Elements</h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAddElement('text')}
              className="flex flex-col items-center p-3 transition-colors border rounded-lg hover:bg-gray-50"
            >
              <Type className="w-5 h-5 mb-1" />
              <span className="text-xs">Text</span>
            </button>

            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center p-3 transition-colors border rounded-lg hover:bg-gray-50"
            >
              <Upload className="w-5 h-5 mb-1" />
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
            {shapes.map(({ name, icon: Icon, type }) => (
              <button
                key={name}
                onClick={() => handleAddElement('shape', type)}
                className="flex flex-col items-center p-3 transition-colors border rounded-lg hover:bg-gray-50"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">UI Icons</h2>
          <div className="grid grid-cols-3 gap-2">
            {uiIcons.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleAddElement('icon', undefined, name)}
                className="flex flex-col items-center p-3 transition-colors border rounded-lg hover:bg-gray-50"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Business Icons</h2>
          <div className="grid grid-cols-3 gap-2">
            {businessIcons.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleAddElement('icon', undefined, name)}
                className="flex flex-col items-center p-3 transition-colors border rounded-lg hover:bg-gray-50"
              >
                <Icon className="w-5 h-5 mb-1" />
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