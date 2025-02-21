import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import Toolbar from './Toolbar';
import ElementPanel from './ElementPanel';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel';

function DesignEditor() {
  const navigate = useNavigate();
  const { id = 'new' } = useParams();
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const loadDesign = async () => {
      if (id === 'new' || loadedRef.current) return;

      try {
        setIsLoading(true);
        const { data: design, error } = await supabase
          .from('designs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        console.log('Loaded design from Supabase:', design);

        if (design?.data) {
          const designElements = design.data.elements;
          console.log('Design elements:', designElements);

          if (Array.isArray(designElements)) {
            loadedRef.current = true;
            
            // Set the entire design first
            setCurrentDesign(design);
            
            // Then set elements and canvas size
            setElements(designElements);
            setCanvasSize({
              width: design.data.metadata.width || 800,
              height: design.data.metadata.height || 600
            });
          }
        }
      } catch (error) {
        console.error('Error loading design:', error);
        navigate('/designs');
      } finally {
        setIsLoading(false);
      }
    };

    loadDesign();
  }, [id, navigate]);

  const generatePreview = async (canvas) => {
    // Create a temporary canvas for the preview
    const tempCanvas = document.createElement('canvas');
    const MAX_WIDTH = 300;
    const scale = MAX_WIDTH / canvas.width;
    const scaledHeight = Math.round(canvas.height * scale);
    
    tempCanvas.width = MAX_WIDTH;
    tempCanvas.height = scaledHeight;
    
    // Get the 2D context
    const ctx = tempCanvas.getContext('2d');
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the scaled image
    ctx.drawImage(canvas, 0, 0, MAX_WIDTH, scaledHeight);
    
    // Convert to blob with compression
    return new Promise(resolve => 
      tempCanvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
  };

  const handleSaveDesign = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in to save your design');
        navigate('/', { state: { showLogin: true } });
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate preview and full resolution images
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const previewBlob = await generatePreview(canvas);
      const fullBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

      const designName = currentDesign?.data?.metadata?.name || 'Untitled Design';
      const designData = {
        user_id: user.id,
        name: designName,
        data: {
          metadata: {
            name: designName,
            width: canvasSize.width,
            height: canvasSize.height,
            aspectRatio: canvasSize.height / canvasSize.width,
            updatedAt: new Date().toISOString()
          },
          elements
        }
      };

      if (id === 'new') {
        // Insert new design
        const { data, error: insertError } = await supabase
          .from('designs')
          .insert([designData])
          .select('id')
          .single();

        if (insertError) throw insertError;
        
        // Upload preview and full images with the new ID
        const previewPath = `${user.id}/previews/${data.id}_preview.jpg`;
        const fullPath = `${user.id}/designs/${data.id}_full.png`;
        
        await Promise.all([
          supabase.storage.from('designs').upload(previewPath, previewBlob, {
            contentType: 'image/jpeg',
            upsert: true
          }),
          supabase.storage.from('designs').upload(fullPath, fullBlob, {
            contentType: 'image/png',
            upsert: true
          })
        ]);

        navigate(`/editor/${data.id}`, { replace: true });
      } else {
        // Update existing design
        const previewPath = `${user.id}/previews/${id}_preview.jpg`;
        const fullPath = `${user.id}/designs/${id}_full.png`;
        
        await Promise.all([
          supabase.storage.from('designs').upload(previewPath, previewBlob, {
            contentType: 'image/jpeg',
            upsert: true
          }),
          supabase.storage.from('designs').upload(fullPath, fullBlob, {
            contentType: 'image/png',
            upsert: true
          }),
          supabase
            .from('designs')
            .update(designData)
            .eq('id', id)
        ]);
      }

      alert('Design saved successfully!');
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImportJSON = (importedElements) => {
    setElements(importedElements.map(element => ({
      ...element,
      id: element.id || crypto.randomUUID()
    })));
  };

  const handleTemplateSelect = (width, height) => {
    setCanvasSize({ width, height });
  };

  const handleUpdateElement = (updatedElement) => {
    setElements(elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    ));
  };

  const handleDeleteElement = (elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleDuplicateElement = (element) => {
    const duplicatedElement = {
      ...element,
      id: crypto.randomUUID(),
      x: element.x + 20,
      y: element.y + 20
    };
    setElements([...elements, duplicatedElement]);
  };

  const handleReorderLayers = (startIndex, endIndex) => {
    const newElements = [...elements];
    const [removed] = newElements.splice(startIndex, 1);
    newElements.splice(endIndex, 0, removed);
    setElements(newElements);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border-b shadow-sm">
        <Toolbar 
          elements={elements}
          canvasRef={canvasRef}
          currentDesign={currentDesign}
          onSaveDesign={handleSaveDesign}
          onShowGallery={() => navigate('/designs')}
          onImportJSON={handleImportJSON}
          onTemplateSelect={handleTemplateSelect}
          saving={saving}
        />
      </div>
      
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-64 overflow-y-auto bg-white border-r">
          <ElementPanel onAddElement={(element) => setElements([...elements, element])} />
        </div>
        <Canvas 
          ref={canvasRef}
          elements={elements} 
          setElements={setElements}
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          width={canvasSize.width}
          height={canvasSize.height}
          onSizeChange={(w, h) => setCanvasSize({ width: w, height: h })}
        />
        <div className="w-64 space-y-4 overflow-y-auto bg-white border-l">
          <PropertiesPanel 
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onMoveLayer={(id, direction) => {
              const index = elements.findIndex(el => el.id === id);
              if (direction === 'up' && index > 0) {
                handleReorderLayers(index, index - 1);
              } else if (direction === 'down' && index < elements.length - 1) {
                handleReorderLayers(index, index + 1);
              }
            }}
          />
          <LayerPanel
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={handleUpdateElement}
            onReorderLayers={handleReorderLayers}
          />
        </div>
      </div>
    </div>
  );
}

export default DesignEditor;