import React from 'react';
import { DesignElement } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { sanitizeDesignText } from '../lib/sanitization';

interface PropertiesPanelProps {
  selectedElement: DesignElement | null;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  if (!selectedElement) {
    return (
      <div className="w-80 border-l border-gray-200 p-4">
        <p className="text-gray-500">Select an element to edit properties</p>
      </div>
    );
  }

  const handleInputChange = (property: keyof DesignElement, value: any) => {
    let sanitizedValue = value;

    // Sanitize and validate inputs based on property type
    switch (property) {
      case 'content':
        sanitizedValue = sanitizeDesignText(value);
        // Limit content length for security
        if (sanitizedValue.length > 1000) {
          sanitizedValue = sanitizedValue.substring(0, 1000);
        }
        break;

      case 'x':
      case 'y':
        sanitizedValue = Math.max(0, Math.min(Number(value) || 0, 5000));
        break;

      case 'width':
      case 'height':
        sanitizedValue = Math.max(1, Math.min(Number(value) || 1, 5000));
        break;

      case 'fontSize':
        sanitizedValue = Math.max(8, Math.min(Number(value) || 16, 200));
        break;

      case 'rotation':
        sanitizedValue = Math.max(-360, Math.min(Number(value) || 0, 360));
        break;

      case 'zIndex':
        sanitizedValue = Math.max(0, Math.min(Number(value) || 0, 9999));
        break;

      case 'borderWidth':
        sanitizedValue = Math.max(0, Math.min(Number(value) || 0, 20));
        break;

      case 'opacity':
        sanitizedValue = Math.max(0, Math.min(Number(value) || 1, 1));
        break;

      case 'color':
      case 'backgroundColor':
      case 'borderColor':
        // Validate hex color format
        if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return; // Don't update if invalid color format
        }
        break;

      case 'fontFamily':
        // Allow only safe font families
        const safeFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
        if (!safeFonts.includes(value)) {
          sanitizedValue = 'Arial';
        }
        break;
    }

    onUpdateElement(selectedElement.id, { [property]: sanitizedValue });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      onDeleteElement(selectedElement.id);
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Properties</h3>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x">X</Label>
              <Input
                id="x"
                type="number"
                min="0"
                max="5000"
                value={selectedElement.x}
                onChange={(e) => handleInputChange('x', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="y">Y</Label>
              <Input
                id="y"
                type="number"
                min="0"
                max="5000"
                value={selectedElement.y}
                onChange={(e) => handleInputChange('y', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label>Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                min="1"
                max="5000"
                value={selectedElement.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                min="1"
                max="5000"
                value={selectedElement.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="content">Text Content</Label>
              <Textarea
                id="content"
                maxLength={1000}
                value={selectedElement.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter text content..."
              />
              <div className="text-xs text-gray-500">
                {(selectedElement.content || '').length}/1000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[selectedElement.fontSize || 16]}
                  onValueChange={([value]) => handleInputChange('fontSize', value)}
                  min={8}
                  max={200}
                  step={1}
                  className="flex-1"
                />
                <Input
                  id="fontSize"
                  type="number"
                  min="8"
                  max="200"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => handleInputChange('fontSize', e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={selectedElement.fontFamily || 'Arial'}
                onValueChange={(value) => handleInputChange('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Text Color</Label>
              <Input
                id="color"
                type="color"
                value={selectedElement.color || '#000000'}
                onChange={(e) => handleInputChange('color', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <Input
            id="backgroundColor"
            type="color"
            value={selectedElement.backgroundColor || '#ffffff'}
            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
          />
        </div>

        {/* Border */}
        <div className="space-y-2">
          <Label>Border</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="borderWidth">Width</Label>
              <Input
                id="borderWidth"
                type="number"
                min="0"
                max="20"
                value={selectedElement.borderWidth || 0}
                onChange={(e) => handleInputChange('borderWidth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="borderColor">Color</Label>
              <Input
                id="borderColor"
                type="color"
                value={selectedElement.borderColor || '#000000'}
                onChange={(e) => handleInputChange('borderColor', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="space-y-2">
          <Label htmlFor="rotation">Rotation</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[selectedElement.rotation || 0]}
              onValueChange={([value]) => handleInputChange('rotation', value)}
              min={-360}
              max={360}
              step={1}
              className="flex-1"
            />
            <Input
              id="rotation"
              type="number"
              min="-360"
              max="360"
              value={selectedElement.rotation || 0}
              onChange={(e) => handleInputChange('rotation', e.target.value)}
              className="w-20"
            />
          </div>
        </div>

        {/* Z-Index */}
        <div className="space-y-2">
          <Label htmlFor="zIndex">Layer Order</Label>
          <Input
            id="zIndex"
            type="number"
            min="0"
            max="9999"
            value={selectedElement.zIndex || 0}
            onChange={(e) => handleInputChange('zIndex', e.target.value)}
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label htmlFor="opacity">Opacity</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[selectedElement.opacity || 1]}
              onValueChange={([value]) => handleInputChange('opacity', value)}
              min={0}
              max={1}
              step={0.1}
              className="flex-1"
            />
            <Input
              id="opacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={selectedElement.opacity || 1}
              onChange={(e) => handleInputChange('opacity', e.target.value)}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};