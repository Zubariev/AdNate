import React from 'react';
import { Database } from '../lib/database.types';

type Element = Database['public']['Tables']['designs']['Row']['data']['elements'][number];

interface DesignPreviewProps {
  elements: Element[];
  width: number;
  height: number;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({ elements, width, height }) => {
  // Calculate container dimensions while maintaining aspect ratio
  const containerWidth = 200; // Fixed container width
  const containerHeight = (height / width) * containerWidth;
  const scale = containerWidth / width;

  return (
    <div 
      className="relative w-full h-full bg-[#f0f0f0]"
    >
      <div 
        className="absolute bg-white"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: width,
          height: height,
          position: 'absolute',
        }}>
          {elements.map((element) => {
            const style: React.CSSProperties = {
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity,
              layerDepth: element.layerDepth,
              color: element.color,
              backgroundColor: element.type === 'text' ? 'transparent' : element.backgroundColor,
              fontSize: `${element.fontSize}px`,
              fontFamily: element.fontFamily,
              fontWeight: element.isBold ? 'bold' : 'normal',
              fontStyle: element.isItalic ? 'italic' : 'normal',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            };

            switch (element.type) {
              case 'text':
                return (
                  <div key={element.id} style={style}>
                    {element.content}
                  </div>
                );
              case 'shape':
                return (
                  <div key={element.id} style={style}>
                    <div 
                      className={element.shapeType === 'circle' ? 'rounded-full' : 'rounded-none'}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: element.backgroundColor,
                      }} 
                    />
                  </div>
                );
              case 'image':
                return (
                  <img
                    key={element.id}
                    src={element.content}
                    alt=""
                    style={{
                      ...style,
                      objectFit: 'cover',
                    }}
                  />
                );
              case 'icon':
                return (
                  <div key={element.id} style={style}>
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        color: element.color,
                      }}
                    >
                      {element.content}
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default DesignPreview; 