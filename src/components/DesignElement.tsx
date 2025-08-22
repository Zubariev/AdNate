import React, { useState, useRef, useEffect } from 'react';
import { Element } from '../types';
import * as Icons from 'lucide-react';

interface DesignElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (element: Element) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const DesignElement: React.FC<DesignElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isDragging,
  setIsDragging,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (element.locked) return;
    
    setIsDragging(true);
    
    const startX = e.clientX - element.x;
    const startY = e.clientY - element.y;

    const handleDrag = (e: MouseEvent) => {
      onUpdate({
        ...element,
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (element.locked) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startRotation = element.rotation || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) newWidth = startWidth + deltaX;
      if (direction.includes('s')) newHeight = startHeight + deltaY;

      onUpdate({
        ...element,
        width: Math.max(50, newWidth),
        height: Math.max(50, newHeight),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (element.locked) return;

    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const rotation = angle * (180 / Math.PI) + 90;
      
      onUpdate({
        ...element,
        rotation,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true);
    }
  };

  const renderShape = () => {
    switch (element.shapeType) {
      case 'circle':
        return (
          <div className="w-full h-full rounded-full" style={{ backgroundColor: element.backgroundColor }} />
        );
      case 'triangle':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50 0L100 100H0L50 0Z"
              fill={element.backgroundColor}
            />
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 51 48" className="w-full h-full">
            <path
              d="M25.5 0L31.7 18.5H51L35.2 29.9L41.4 48L25.5 36.6L9.6 48L15.8 29.9L0 18.5H19.3L25.5 0Z"
              fill={element.backgroundColor}
            />
          </svg>
        );
      case 'hexagon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
              fill={element.backgroundColor}
            />
          </svg>
        );
      case 'heart':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50 83.3L85.4 51.7C93.3 44.6 93.3 32.9 85.4 25.8C77.5 18.7 64.6 18.7 56.7 25.8L50 32L43.3 25.8C35.4 18.7 22.5 18.7 14.6 25.8C6.7 32.9 6.7 44.6 14.6 51.7L50 83.3Z"
              fill={element.backgroundColor}
            />
          </svg>
        );
      case 'message':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M85 5H15C9.5 5 5 9.5 5 15V70C5 75.5 9.5 80 15 80H35L50 95L65 80H85C90.5 80 95 75.5 95 70V15C95 9.5 90.5 5 85 5Z"
              fill={element.backgroundColor}
            />
          </svg>
        );
      default:
        return (
          <div className="w-full h-full" style={{ backgroundColor: element.backgroundColor }} />
        );
    }
  };

  const renderIcon = () => {
    if (!element.iconName || !(element.iconName in Icons)) return null;
    const IconComponent = Icons[element.iconName as keyof typeof Icons];
    return (
      <IconComponent 
        className="w-full h-full" 
        style={{ color: element.color }} 
      />
    );
  };

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation || 0}deg)`,
    opacity: element.opacity,
    cursor: isDragging ? 'grabbing' : 'grab',
    layerDepth: element.layerDepth,
  };

  const textStyle: React.CSSProperties = {
    color: element.color,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.isBold ? 'bold' : 'normal',
    fontStyle: element.isItalic ? 'italic' : 'normal',
  };

  return (
    <div
      ref={elementRef}
      style={elementStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      className={`design-element ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="w-full h-full">
        {element.type === 'text' && (
          isEditing ? (
            <textarea
              ref={textareaRef}
              value={element.content}
              onChange={(e) => onUpdate({ ...element, content: e.target.value })}
              onBlur={() => setIsEditing(false)}
              style={textStyle}
              className="w-full h-full p-0 bg-transparent border-none resize-none focus:outline-none"
            />
          ) : (
            <div style={textStyle}>{element.content}</div>
          )
        )}
        {element.type === 'shape' && renderShape()}
        {element.type === 'icon' && renderIcon()}
        {element.type === 'image' && (
          <img
            src={element.content}
            alt="Design element"
            className="object-cover w-full h-full"
          />
        )}
      </div>

      {isSelected && !element.locked && (
        <>
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-nw-resize -top-1 -left-1" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-n-resize top-0 left-1/2" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-ne-resize -top-1 -right-1" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-w-resize top-1/2 -left-1" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-e-resize top-1/2 -right-1" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-sw-resize -bottom-1 -left-1" />
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-s-resize bottom-0 left-1/2" />
          <div
            className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-500 rounded-full cursor-se-resize -bottom-1 -right-1"
            onMouseDown={(e) => handleResize(e, 'se')}
          />
          <div
            className="absolute w-5 h-5 -translate-x-1/2 bg-white border border-blue-500 rounded-full shadow-md cursor-pointer -top-8 left-1/2"
            onMouseDown={handleRotation}
          />
        </>
      )}
    </div>
  );
};

export default DesignElement;