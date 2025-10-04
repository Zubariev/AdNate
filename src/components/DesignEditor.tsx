const handleSaveDesign = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data?.user) {
      throw new Error('User not authenticated');
    }

    const designData = {
      user_id: user.data.user.id,
      name: designName || 'Untitled Design',
      content: JSON.stringify(editorState),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('designs')
      .upsert(designData, { 
        onConflict: 'id',
        returning: true 
      });

    if (error) throw error;
    
    console.log('Design saved successfully:', data);
    // Add success notification here if needed
  } catch (error) {
    console.error('Error saving design:', error);
    // Add error notification here if needed
  }
}; 

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import Canvas from './Canvas';
import ElementPanel from './ElementPanel';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel';
import Toolbar from './Toolbar';
import ImageGenerator from './ImageGenerator';
import CustomSizeDialog from './CustomSizeDialog';
import html2canvas from 'html2canvas';
import { saveDesign, updateDesign, autoSaveDesign, cancelAutoSave } from '../lib/designOperations';
import { useToast } from './ui/use-toast';
import { sanitizeDesignText } from "../lib/sanitization";
import { validateDesign, validateDesignElement } from "../lib/validations";
import { apiClient } from '../lib/apiClient';

// TypeScript interfaces
interface ElementImage {
  id: string;
  brief_id: string;
  concept_id: string;
  element_id: string;
  image_url: string;
  image_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  image_data?: any;
  prompt_used: string;
  image_type: 'original' | 'transparent';
  created_at: string;
  updated_at: string;
}

interface ElementSpecification {
  id: string;
  briefId: string;
  conceptId: string;
  userId: string;
  specificationData: {
    background: {
      type: string;
      specification: string;
      regenerationPrompt: string;
    };
    elements: Array<{
      id: string;
      name: string;
      type: string;
      purpose: string;
      editabilityRating: number;
      criticalConstraints: string;
      dimensions: { width: number; height: number };
      position: { x: number; y: number };
      layerDepth: number;
      transparencyRequirements: string;
      styleContinuityMarkers: string;
      regenerationPrompt: string;
      lightingRequirements: string;
      perspective: string;
      styleAnchors: string;
    }>;
  };
  promptUsed: string;
  referenceImageId?: string;
  aiModelUsed: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'icon' | 'line'; // Added 'line'
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
  properties?: Record<string, any>; // Added for generic properties
}

interface CanvasSize {
  width: number;
  height: number;
}

interface DesignEditorProps {
  initialElements?: DesignElement[];
  onSave?: (elements: DesignElement[]) => void;
  onExport?: (format: string) => void;
  designId?: string; // Assuming a designId is passed for updates
}

const DesignEditor: React.FC<DesignEditorProps> = ({ initialElements = [], onSave, onExport, designId }) => {
  const [elements, setElements] = useState<DesignElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 1000, height: 1000 }); // Default to square canvas
  const [showImageGenerator, setShowImageGenerator] = useState<boolean>(false);
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState<boolean>(false);
  const [designName, setDesignName] = useState<string>('Untitled Design');
  const [zoom, setZoom] = useState<number>(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentDesignId = useRef(designId); // Use ref to keep track of the latest designId
  const [searchParams] = useSearchParams();
  const [isLoadingElements, setIsLoadingElements] = useState<boolean>(false);

  // Function to load elements from brief
  const loadElementsFromBrief = async (briefId: string) => {
    setIsLoadingElements(true);
    try {
      // Fetch element images and specifications
      const [elementImagesResponse, specificationsResponse] = await Promise.all([
        apiClient.get<ElementImage[]>(`/briefs/${briefId}/element-images`),
        apiClient.get<ElementSpecification[]>(`/briefs/${briefId}/element-specifications`)
      ]);

      const elementImages = elementImagesResponse.data;
      const specifications = specificationsResponse.data;

      console.log('Element Images Response:', elementImages);
      console.log('Specifications Response:', specifications);

      // Debug: Log the element IDs to understand the mismatch
      console.log('Element Image IDs:', elementImages.map(img => img.element_id));
      console.log('Specification Element IDs:', specifications[0]?.specificationData?.elements?.map(el => el.id));

      // Debug: Also try the debug endpoint
      try {
        const debugResponse = await apiClient.get(`/briefs/${briefId}/debug-element-images`);
        console.log('Debug endpoint response:', debugResponse.data);
      } catch (debugError) {
        console.error('Debug endpoint error:', debugError);
      }

      // Debug: Try temp check endpoint (bypasses RLS)
      try {
        const tempResponse = await apiClient.get(`/briefs/${briefId}/temp-check-data`);
        console.log('Temp check response:', tempResponse.data);
      } catch (tempError) {
        console.error('Temp check error:', tempError);
      }

      if (!elementImages.length || !specifications.length) {
        toast({
          title: 'No Elements Found',
          description: 'No generated elements found for this brief.',
          variant: 'destructive',
        });
        return;
      }

      // Get the latest specification
      const latestSpec = specifications[0];
      const specElements = latestSpec.specificationData.elements;

      console.log('Processing spec elements:', specElements);

      // Create design elements from specifications and images
      const designElements: DesignElement[] = [];

      for (const specElement of specElements) {
        console.log(`Processing spec element: ${specElement.id} (${specElement.type})`);
        
        // Find the corresponding image (prefer transparent version)
        // Try exact match first
        let elementImage = elementImages.find(img => 
          img.element_id === specElement.id && img.image_type === 'transparent'
        ) || elementImages.find(img => img.element_id === specElement.id);

        // If no exact match, try to match by concept_id and element type
        if (!elementImage) {
          // Extract the concept ID from the spec element ID (first 5 parts for UUID)
          const specIdParts = specElement.id.split('-');
          if (specIdParts.length >= 5) {
            // Take the first 5 parts to get the full concept ID UUID
            const conceptId = specIdParts.slice(0, 5).join('-');
            
            // Find images with matching concept_id
            const conceptImages = elementImages.filter(img => img.concept_id === conceptId);
            
            console.log(`Trying concept-based matching for ${specElement.id}:`, {
              conceptId,
              conceptImagesCount: conceptImages.length,
              conceptImages: conceptImages.map(img => ({ element_id: img.element_id, image_type: img.image_type }))
            });
            
            // Since the element_id values don't match, we'll need to match by order
            // Get the index of this spec element
            const specIndex = specElements.indexOf(specElement);
            
            // Filter out background images for non-background elements
            const nonBackgroundImages = conceptImages.filter(img => img.element_id !== 'background');
            
            // Try to match by order (assuming images are generated in the same order as specifications)
            if (specIndex < nonBackgroundImages.length) {
              // Prefer transparent version
              elementImage = nonBackgroundImages.find(img => 
                img.element_id === nonBackgroundImages[specIndex].element_id && 
                img.image_type === 'transparent'
              ) || nonBackgroundImages[specIndex];
              
              console.log(`Matched by order (index ${specIndex}):`, {
                matchedElementId: elementImage?.element_id,
                imageType: elementImage?.image_type,
                found: elementImage ? 'YES' : 'NO'
              });
            }
          }
        }

        console.log(`Found image for ${specElement.id}:`, elementImage ? 'YES' : 'NO');

        if (elementImage) {
          // Map specification types to design element types
          let elementType: 'text' | 'image' | 'shape' | 'icon' | 'line';
          switch (specElement.type.toLowerCase()) {
            case 'text':
              elementType = 'text';
              break;
            case 'cta':
            case 'shape':
              elementType = 'shape';
              break;
            case 'graphics':
            case 'image':
              elementType = 'image';
              break;
            default:
              elementType = 'image'; // Default to image for unknown types
          }

          const designElement: DesignElement = {
            id: specElement.id,
            type: elementType,
            x: specElement.position.x,
            y: specElement.position.y,
            width: specElement.dimensions.width,
            height: specElement.dimensions.height,
            rotation: 0,
            content: elementImage.image_url,
            opacity: 1,
            layerDepth: specElement.layerDepth,
            locked: false,
            // Add text-specific properties if it's a text element
            ...(elementType === 'text' && {
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#000000',
              backgroundColor: 'transparent',
              isBold: false,
              isItalic: false,
            }),
            // Add shape-specific properties if it's a shape element
            ...(elementType === 'shape' && {
              backgroundColor: '#cccccc',
              shapeType: 'rectangle',
            }),
          };
          designElements.push(designElement);
          console.log(`Added design element: ${designElement.id}`);
        } else {
          console.log(`No image found for spec element: ${specElement.id}`);
        }
      }

      console.log(`Total design elements created: ${designElements.length}`);

      // Sort by layer depth (lower depth = background, higher depth = foreground)
      designElements.sort((a, b) => a.layerDepth - b.layerDepth);

      setElements(designElements);
      
      toast({
        title: 'Elements Loaded',
        description: `Successfully loaded ${designElements.length} elements from the brief.`,
      });

    } catch (error) {
      console.error('Error loading elements from brief:', error);
      toast({
        title: 'Error',
        description: 'Failed to load elements from brief.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingElements(false);
    }
  };

  useEffect(() => {
    // Check if we have a briefId in URL params
    const briefId = searchParams.get('briefId');
    
    if (briefId) {
      // Load elements from brief
      loadElementsFromBrief(briefId);
    } else if (initialElements.length > 0) {
      // Set the initial design name if elements are provided
      if (initialElements[0].content) {
        // Assuming the first element might hold the design name if not explicitly set
        // Or a more robust way to get the name if it's stored elsewhere
        // For now, we stick to the state variable
      }
    }

    // Start auto-save if a designId is present
    if (currentDesignId.current) {
      startAutoSave();
    }

    return () => {
      // Clean up auto-save interval on component unmount
      if (autoSaveIntervalRef.current) {
        cancelAutoSave(autoSaveIntervalRef.current);
      }
    };
  }, [searchParams]); // Add searchParams to dependency array

  useEffect(() => {
    // Update the designId ref if it changes
    currentDesignId.current = designId;
    if (designId) {
      startAutoSave();
    } else {
      if (autoSaveIntervalRef.current) {
        cancelAutoSave(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }
  }, [designId]);

  const startAutoSave = useCallback(() => {
    if (currentDesignId.current && !autoSaveIntervalRef.current) {
      autoSaveIntervalRef.current = autoSaveDesign(currentDesignId.current, elements, (status) => {
        setSaveStatus(status);
        if (status === 'saved') {
          setLastSaved(new Date());
        } else if (status === 'error') {
          toast({ title: "Auto-save failed", description: "There was an error saving your design." });
        }
      });
    }
  }, [elements, toast]);

  const addElement = useCallback((type: DesignElement['type']) => {
    // Validate element limits for security
    if (elements.length >= 1000) {
      console.warn('Maximum number of elements reached');
      return;
    }

    const newElement: DesignElement = {
      id: crypto.randomUUID(),
      type,
      x: Math.max(0, Math.min(100, canvasSize.width - 100)),
      y: Math.max(0, Math.min(100, canvasSize.height - 100)),
      width: type === 'text' ? Math.min(200, canvasSize.width) : Math.min(100, canvasSize.width),
      height: type === 'text' ? Math.min(50, canvasSize.height) : Math.min(100, canvasSize.height),
      rotation: 0,
      layerDepth: elements.length,
    };

    if (type === 'text') {
      newElement.content = sanitizeDesignText('Double click to edit');
      newElement.fontSize = 16;
      newElement.fontFamily = 'Arial';
      newElement.color = '#000000';
    }

    // Validate the element before adding
    const validation = validateDesignElement(newElement);
    if (!validation.success) {
      console.error('Invalid element:', validation.error);
      return;
    }

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement); // Set the newly added element as selected
  }, [elements, canvasSize]);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    // Sanitize text content if it's being updated
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.content) {
      sanitizedUpdates.content = sanitizeDesignText(sanitizedUpdates.content);
    }

    // Validate bounds for position and size updates
    if (sanitizedUpdates.x !== undefined) {
      sanitizedUpdates.x = Math.max(0, Math.min(sanitizedUpdates.x, canvasSize.width - 50));
    }
    if (sanitizedUpdates.y !== undefined) {
      sanitizedUpdates.y = Math.max(0, Math.min(sanitizedUpdates.y, canvasSize.height - 50));
    }
    if (sanitizedUpdates.width !== undefined) {
      sanitizedUpdates.width = Math.max(10, Math.min(sanitizedUpdates.width, canvasSize.width));
    }
    if (sanitizedUpdates.height !== undefined) {
      sanitizedUpdates.height = Math.max(10, Math.min(sanitizedUpdates.height, canvasSize.height));
    }
    if (sanitizedUpdates.fontSize !== undefined) {
      sanitizedUpdates.fontSize = Math.max(8, Math.min(sanitizedUpdates.fontSize, 200));
    }
    if (sanitizedUpdates.rotation !== undefined) {
      sanitizedUpdates.rotation = Math.max(-360, Math.min(sanitizedUpdates.rotation, 360));
    }

    // Find the element and validate the update
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const updatedElement = { ...element, ...sanitizedUpdates };
    const validation = validateDesignElement(updatedElement);
    if (!validation.success) {
      console.error('Invalid element update:', validation.error);
      return;
    }

    setElements(prev => prev.map(el => 
      el.id === id ? updatedElement : el
    ));
    if (selectedElement?.id === id) {
      setSelectedElement(updatedElement);
    }
  }, [selectedElement, canvasSize, elements]);


  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const duplicateElement = useCallback((id: string) => {
    const elementToDuplicate = elements.find(el => el.id === id);
    if (elementToDuplicate) {
      const newElement: DesignElement = {
        ...elementToDuplicate,
        id: crypto.randomUUID(), // Use crypto.randomUUID for unique IDs
        x: elementToDuplicate.x + 20,
        y: elementToDuplicate.y + 20,
        layerDepth: elements.length,
      };
      // Validate the duplicated element before adding
      const validation = validateDesignElement(newElement);
      if (!validation.success) {
        console.error('Invalid duplicated element:', validation.error);
        return;
      }
      setElements(prev => [...prev, newElement]);
    }
  }, [elements]);

  const exportDesign = useCallback(async (format: string = 'png') => {
    if (onExport) {
      onExport(format); // Call parent handler if provided
    } else {
      if (canvasRef.current) {
        try {
          // Ensure elements are rendered correctly before capturing
          // Potentially add a slight delay or wait for rendering if needed
          const canvas = await html2canvas(canvasRef.current, { scale: zoom }); // Use zoom level for export
          let link: HTMLAnchorElement;

          if (format === 'png') {
            link = document.createElement('a');
            link.download = `${designName}.png`;
            link.href = canvas.toDataURL('image/png');
          } else if (format === 'json') {
            // Exporting the design data structure
            const jsonContent = JSON.stringify(elements, null, 2);
            // Sanitize and validate the entire design before exporting
            const validation = validateDesign({ elements: elements, canvasSize: canvasSize, designName: designName });
            if (!validation.success) {
              console.error('Invalid design for export:', validation.error);
              toast({ title: "Export failed", description: "Design validation failed." });
              return;
            }
            const blob = new Blob([jsonContent], { type: 'application/json' });
            link = document.createElement('a');
            link.download = `${designName}.json`;
            link.href = URL.createObjectURL(blob);
          } else {
            console.error("Unsupported export format:", format);
            return;
          }

          link.click();
          URL.revokeObjectURL(link.href); // Clean up the object URL
        } catch (error) {
          console.error('Export failed:', error);
          toast({ title: "Export failed", description: "Could not export the design." });
        }
      }
    }
  }, [designName, onExport, elements, zoom, toast, canvasSize]); // Include zoom and elements

  const manualSave = useCallback(async () => {
    // Validate the entire design before saving
    const validation = validateDesign({ elements: elements, canvasSize: canvasSize, designName: designName });
    if (!validation.success) {
      console.error('Invalid design for save:', validation.error);
      toast({ title: "Save failed", description: "Design validation failed." });
      return;
    }

    if (!currentDesignId.current) {
      // If no designId, perform a save operation that might return an ID
      // For now, we'll just log and indicate no ID is available
      console.log("Saving new design...");
      const newDesignId = await saveDesign(designName, elements); // Assume saveDesign returns an ID
      if (newDesignId) {
        currentDesignId.current = newDesignId;
        setSaveStatus('saved');
        setLastSaved(new Date());
        toast({ title: "Design saved successfully", description: `Your design "${designName}" has been saved.` });
        startAutoSave(); // Start auto-save for the newly created design
      } else {
        setSaveStatus('error');
        toast({ title: "Save failed", description: "Could not save the design." });
      }
      return;
    }

    // If designId exists, update the existing design
    setSaveStatus('saving');
    try {
      await updateDesign(currentDesignId.current, designName, elements);
      setSaveStatus('saved');
      setLastSaved(new Date());
      toast({ title: "Design updated successfully", description: `Your design "${designName}" has been updated.` });
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      toast({ title: "Save failed", description: "There was an error updating your design." });
    }
  }, [designName, elements, toast, canvasSize]);

  const handleCanvasSizeChange = useCallback((preset: string) => {
    const sizes: Record<string, CanvasSize> = {
      'social-post': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'banner': { width: 1200, height: 628 },
      'poster': { width: 600, height: 800 },
      'custom': canvasSize,
    };

    if (preset === 'custom') {
      setShowCustomSizeDialog(true);
    } else if (sizes[preset]) {
      setCanvasSize(sizes[preset]);
      // Potentially trigger an update or save if canvas size change is considered a significant modification
    }
  }, [canvasSize]);

  const handleSave = useCallback(() => {
    manualSave(); // Use the new manualSave function
  }, [manualSave]);

  // Function to add text element (example for Toolbar)
  const addText = useCallback(() => {
    addElement('text');
  }, [addElement]);

  // Function to add shape element (example for Toolbar)
  const addShape = useCallback((shapeType: string) => {
    const baseShape = { type: 'shape' as const, shapeType: shapeType, x: 50, y: 50, width: 100, height: 100, backgroundColor: '#3b82f6', color: '#ffffff' };
    addElement(baseShape as any); // Cast to any to satisfy the type, as addElement expects DesignElement['type']
  }, [addElement]);

  if (isLoadingElements) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-700">Loading Design Elements</h2>
          <p className="text-gray-500">Please wait while we load your generated design elements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Input
            value={designName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDesignName(e.target.value);
              // Optionally trigger an update/save here if design name change should be persisted immediately
            }}
            className="max-w-sm text-lg font-semibold border-none shadow-none" // Added max-width for better layout
            placeholder="Untitled Design"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowImageGenerator(true)}
          >
            AI Image
          </Button>
          <Button onClick={() => exportDesign('png')} variant="outline">
            Export PNG
          </Button>
          <Button onClick={() => exportDesign('json')} variant="outline">
            Export JSON
          </Button>
          <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </Button>
          {lastSaved && saveStatus === 'saved' && (
             <span className="text-sm text-gray-500">Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div className="flex overflow-hidden flex-1">
        <div className="overflow-y-auto p-4 w-64 bg-white border-r border-gray-200">
          <h3 className="mb-4 text-lg font-semibold">Elements</h3>
          <ElementPanel onAddElement={addElement} />
        </div>

        <div className="flex overflow-hidden flex-col flex-1">
          <Toolbar 
            onAddText={addText}
            onAddShape={addShape}
            onAddImage={() => setShowImageGenerator(true)}
            canvasSize={canvasSize}
            onCanvasSizeChange={handleCanvasSizeChange}
            onCustomSizeClick={() => setShowCustomSizeDialog(true)}
            onExport={exportDesign}
            onSave={manualSave}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
          />
          <div className="overflow-auto relative flex-1 p-8 bg-gray-100" ref={canvasRef}>
            <div style={{ width: canvasSize.width, height: canvasSize.height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <Canvas
                elements={elements}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                onDuplicateElement={duplicateElement}
                canvasSize={canvasSize}
                zoom={zoom}
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 w-80 bg-white border-l border-gray-200">
          <h3 className="mb-4 text-lg font-semibold">Layers</h3>
          <LayerPanel
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
          />
          {selectedElement && (
            <div className="pt-4 mt-6 border-t border-gray-200">
              <h3 className="mb-4 text-lg font-semibold">Properties</h3>
              <PropertiesPanel
                element={selectedElement}
                onUpdateElement={(updates) => updateElement(selectedElement.id, updates)}
                onDeleteElement={() => deleteElement(selectedElement.id)}
                onDuplicateElement={() => duplicateElement(selectedElement.id)}
              />
            </div>
          )}
        </div>
      </div>

      {showImageGenerator && (
        <ImageGenerator
          onClose={() => setShowImageGenerator(false)}
          onImageGenerated={(imageUrl: string) => {
            addElement({
              type: 'image',
              content: imageUrl,
              width: 200,
              height: 200,
              x: canvasSize.width / 2 - 100,
              y: canvasSize.height / 2 - 100,
            });
            setShowImageGenerator(false);
          }}
        />
      )}

      {showCustomSizeDialog && (
        <CustomSizeDialog
          currentSize={canvasSize}
          onSizeChange={(size: CanvasSize) => {
            setCanvasSize(size);
            setShowCustomSizeDialog(false);
          }}
          onClose={() => setShowCustomSizeDialog(false)}
        />
      )}
    </div>
  );
};

export { DesignEditor };
