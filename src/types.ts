export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'star';
export type ElementType = 'text' | 'image' | 'shape' | 'line';

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
  type: 'text' | 'shape' | 'image' | 'line';
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
  layerDepth: number;
  locked?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface Brief {
  id: string;
  user_id: string;
  project_name: string;
  target_audience: string;
  key_message: string;
  brand_guidelines: string;
  banner_sizes: string;
  brand_context: string;
  objective: string;
  consumer_journey: string;
  emotional_connection: string;
  visual_style: string;
  performance_metrics: string;
  constraints: string[];
  created_at: string;
  updated_at: string;
  enhanced_brief?: EnhancedBriefData;
  enhanced_brief_updated_at?: string;
}

export interface EnhancedBriefData {
  objective: string;
  key_message: string;
  banner_sizes: string;
  project_name: string;
  visual_style: string;
  brand_context: string;
  target_audience: string;
  brand_guidelines: string;
  consumer_journey: string;
  performance_metrics: string;
  emotional_connection: string;
}

export interface Concept {
  id: string;
  brief_id: string;
  title: string;
  description: string;
  elements: Record<string, unknown>;
  rationale: Record<string, unknown>;
  midjourneyPrompts: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImage {
  id: string;
  user_id: string;
  brief_id: string;
  concept_id: string;
  image_url: string;
  image_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  image_data?: Record<string, unknown>;
  prompt_used: string;
  created_at: string;
  updated_at: string;
  tempUrl?: string;
}