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
  id: string;
  user_id: string;
  name: string;
  data: {
    metadata: {
      id: string;
      name: string;
      width: number;
      height: number;
      createdAt: string;
      updatedAt: string;
      previewUrl?: string;
      fullUrl?: string;
      aspectRatio?: number;
    };
    elements: Array<Element>;
  };
  created_at: string;
  updated_at: string;
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