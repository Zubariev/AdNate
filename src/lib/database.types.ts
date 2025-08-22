export interface Database {
  public: {
    Tables: {
      designs: {
        Row: {
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
            };
            elements: Array<{
              id: string;
              type: 'text' | 'shape' | 'image' | 'icon';
              x: number;
              y: number;
              width: number;
              height: number;
              rotation: number;
              content?: string;
              fontSize?: number;
              fontFamily?: string;
              color?: string;
              backgroundColor?: string;
              opacity: number;
              shapeType?: string;
              layerDepth: number;
              locked?: boolean;
              isBold?: boolean;
              isItalic?: boolean;
              iconName?: string;
            }>;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          data: {
            metadata: {
              width: number;
              height: number;
            };
            elements: Array<{
              id: string;
              type: 'text' | 'shape' | 'image' | 'icon';
              x: number;
              y: number;
              width: number;
              height: number;
              rotation: number;
              content?: string;
              fontSize?: number;
              fontFamily?: string;
              color?: string;
              backgroundColor?: string;
              opacity: number;
              shapeType?: string;
              layerDepth: number;
              locked?: boolean;
              isBold?: boolean;
              isItalic?: boolean;
              iconName?: string;
            }>;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          data?: {
            metadata: {
              width: number;
              height: number;
            };
            elements: Array<{
              id: string;
              type: 'text' | 'shape' | 'image' | 'icon';
              x: number;
              y: number;
              width: number;
              height: number;
              rotation: number;
              content?: string;
              fontSize?: number;
              fontFamily?: string;
              color?: string;
              backgroundColor?: string;
              opacity: number;
              shapeType?: string;
              layerDepth: number;
              locked?: boolean;
              isBold?: boolean;
              isItalic?: boolean;
              iconName?: string;
            }>;
          };
          updated_at?: string;
        };
      };
    };
  };
}