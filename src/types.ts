export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'star';
export type ElementType = 'text' | 'image' | 'shape' | 'icon';

export interface DesignMetadata {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignData {
  metadata: DesignMetadata;
  elements: Element[];
}

export interface Element {
  id: string;
  type: 'text' | 'shape' | 'image' | 'icon';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  shapeType?: ShapeType;
  zIndex: number;
  locked?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  iconName?: string;
}