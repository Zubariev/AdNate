import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DesignElement } from '../types';
import { validateDesignElement } from '../lib/validations';
import { sanitizeDesignText } from '../lib/sanitization';
import { validateCanvasOperation } from '../lib/validations';

interface CanvasProps {
  elements: DesignElement[];
  selectedElement: string | null;
  canvasSize: { width: number; height: number };
  onElementSelect: (id: string | null) => void;
  onElementUpdate: (id: string, updates: Partial<DesignElement>) => void;
  onElementDoubleClick: (id: string) => void;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPos: { x: number; y: number };
  elementStartPos: { x: number; y: number };
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElement,
  canvasSize,
  onElementSelect,
  onElementUpdate,
  onElementDoubleClick,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPos: { x: 0, y: 0 },
    elementStartPos: { x: 0, y: 0 },
  });

  // Security: Validate canvas bounds
  const validateBounds = useCallback((x: number, y: number, width: number, height: number) => {
    return {
      x: Math.max(0, Math.min(x, canvasSize.width - width)),
      y: Math.max(0, Math.min(y, canvasSize.height - height)),
    };
  }, [canvasSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    onElementSelect(elementId);

    setDragState({
      isDragging: true,
      elementId,
      startPos: { x: e.clientX, y: e.clientY },
      elementStartPos: { x: element.x, y: element.y },
    });
  }, [elements, onElementSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const element = elements.find(el => el.id === dragState.elementId);
    if (!element) return;

    const deltaX = e.clientX - dragState.startPos.x;
    const deltaY = e.clientY - dragState.startPos.y;

    const newX = dragState.elementStartPos.x + deltaX;
    const newY = dragState.elementStartPos.y + deltaY;

    // Validate and constrain bounds
    const validatedPos = validateBounds(newX, newY, element.width, element.height);

    onElementUpdate(dragState.elementId, {
      x: validatedPos.x,
      y: validatedPos.y,
    });
  }, [dragState, elements, onElementUpdate, validateBounds]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      elementId: null,
      startPos: { x: 0, y: 0 },
      elementStartPos: { x: 0, y: 0 },
    });
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onElementDoubleClick(elementId);
  }, [onElementDoubleClick]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onElementSelect(null);
    }
  }, [onElementSelect]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const renderElement = (element: DesignElement) => {
    // Validate element before rendering
    const validation = validateDesignElement(element);
    if (!validation.success) {
      console.warn('Invalid element detected:', validation.error);
      return null;
    }

    const isSelected = selectedElement === element.id;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation || 0}deg)`,
      zIndex: element.zIndex || 0,
      cursor: 'move',
      userSelect: 'none',
      border: isSelected ? '2px solid #007bff' : '1px solid transparent',
      borderRadius: '2px',
      backgroundColor: element.backgroundColor || 'transparent',
      color: element.color || '#000000',
      fontSize: `${element.fontSize || 16}px`,
      fontFamily: element.fontFamily || 'Arial',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      wordBreak: 'break-word',
    };

    const handleElementMouseDown = (e: React.MouseEvent) => {
      handleMouseDown(e, element.id);
    };

    const handleElementDoubleClick = (e: React.MouseEvent) => {
      handleDoubleClick(e, element.id);
    };

    return (
      <div
        key={element.id}
        style={style}
        onMouseDown={handleElementMouseDown}
        onDoubleClick={handleElementDoubleClick}
        data-element-id={element.id}
        data-element-type={element.type}
      >
        {element.type === 'text' && (
          <div style={{ padding: '4px', textAlign: 'center' }}>
            {sanitizeDesignText(element.content || '')}
          </div>
        )}
        {element.type === 'image' && element.content && (
          <img
            src={element.content}
            alt="Design element"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
            onError={(e) => {
              console.warn('Failed to load image:', element.content);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {element.type === 'shape' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: element.backgroundColor || '#cccccc',
              border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#000000'}` : 'none',
            }}
          />
        )}
      </div>
    );
  };

  // Security: Handle updates with validation and sanitization
  const handleElementUpdateWrapper = useCallback((id: string, updates: Partial<DesignElement>) => {
    // Validate canvas operation before applying
    const validation = validateCanvasOperation(updates, canvasSize);
    if (!validation.success) {
      console.warn('Invalid canvas operation:', validation.error);
      return;
    }

    // Sanitize and bound check updates
    const sanitizedUpdates: Partial<DesignElement> = {};

    if (updates.x !== undefined) {
      sanitizedUpdates.x = Math.max(0, Math.min(updates.x, canvasSize.width - (elements.find(el => el.id === id)?.width || 0)));
    }
    if (updates.y !== undefined) {
      sanitizedUpdates.y = Math.max(0, Math.min(updates.y, canvasSize.height - (elements.find(el => el.id === id)?.height || 0)));
    }
    if (updates.width !== undefined) {
      sanitizedUpdates.width = Math.max(1, Math.min(updates.width, canvasSize.width));
    }
    if (updates.height !== undefined) {
      sanitizedUpdates.height = Math.max(1, Math.min(updates.height, canvasSize.height));
    }
    if (updates.backgroundColor !== undefined) {
      sanitizedUpdates.backgroundColor = sanitizeDesignText(updates.backgroundColor);
    }
    if (updates.color !== undefined) {
      sanitizedUpdates.color = sanitizeDesignText(updates.color);
    }
    if (updates.content !== undefined && elements.find(el => el.id === id)?.type === 'text') {
      sanitizedUpdates.content = sanitizeDesignText(updates.content);
    }
    // Add other properties as needed for sanitization and validation

    onElementUpdate(id, sanitizedUpdates);
  }, [canvasSize, elements, onElementUpdate]);


  return (
    <div
      ref={canvasRef}
      className="relative bg-white border border-gray-300 overflow-hidden"
      style={{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        minWidth: '100px',
        minHeight: '100px',
        maxWidth: '5000px',
        maxHeight: '5000px',
      }}
      onClick={handleCanvasClick}
    >
      {elements.map(element => (
        <div
          key={element.id}
          style={{
            position: 'absolute',
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.width}px`,
            height: `${element.height}px`,
            transform: `rotate(${element.rotation || 0}deg)`,
            zIndex: element.zIndex || 0,
            cursor: 'move',
            userSelect: 'none',
            border: selectedElement === element.id ? '2px solid #007bff' : '1px solid transparent',
            borderRadius: '2px',
            backgroundColor: element.backgroundColor || 'transparent',
            color: element.color || '#000000',
            fontSize: `${element.fontSize || 16}px`,
            fontFamily: element.fontFamily || 'Arial',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onElementSelect(element.id);
            setDragState({
              isDragging: true,
              elementId: element.id,
              startPos: { x: e.clientX, y: e.clientY },
              elementStartPos: { x: element.x, y: element.y },
            });
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onElementDoubleClick(element.id);
          }}
          data-element-id={element.id}
          data-element-type={element.type}
        >
          {element.type === 'text' && (
            <div style={{ padding: '4px', textAlign: 'center' }}>
              {sanitizeDesignText(element.content || '')}
            </div>
          )}
          {element.type === 'image' && element.content && (
            <img
              src={element.content}
              alt="Design element"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
              onError={(e) => {
                console.warn('Failed to load image:', element.content);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {element.type === 'shape' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: element.backgroundColor || '#cccccc',
                border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#000000'}` : 'none',
              }}
            />
          )}
        </div>
      ))}

      {/* Canvas overlay for debugging in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-xs text-gray-500 pointer-events-none">
          {canvasSize.width} × {canvasSize.height}
        </div>
      )}
    </div>
  );
};