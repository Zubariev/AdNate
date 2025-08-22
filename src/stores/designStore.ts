
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: Record<string, any>;
  layerDepth: number;
}

interface DesignState {
  elements: DesignElement[];
  selectedElementId: string | null;
  canvasSize: { width: number; height: number };
  zoom: number;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface DesignActions {
  addElement: (element: Omit<DesignElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  clearCanvas: () => void;
  loadDesign: (elements: DesignElement[]) => void;
  markSaved: () => void;
  reorderElements: (elementIds: string[]) => void;
}

export const useDesignStore = create<DesignState & DesignActions>()(
  persist(
    (set, get) => ({
      // Initial state
      elements: [],
      selectedElementId: null,
      canvasSize: { width: 800, height: 600 },
      zoom: 1,
      isDirty: false,
      lastSaved: null,

      // Actions
      addElement: (element) => {
        const id = crypto.randomUUID();
        const newElement = { ...element, id };
        set((state) => ({
          elements: [...state.elements, newElement],
          isDirty: true,
        }));
      },

      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ),
          isDirty: true,
        }));
      },

      deleteElement: (id) => {
        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          isDirty: true,
        }));
      },

      selectElement: (id) => {
        set({ selectedElementId: id });
      },

      setCanvasSize: (size) => {
        set({ canvasSize: size, isDirty: true });
      },

      setZoom: (zoom) => {
        set({ zoom });
      },

      clearCanvas: () => {
        set({
          elements: [],
          selectedElementId: null,
          isDirty: true,
        });
      },

      loadDesign: (elements) => {
        set({
          elements,
          selectedElementId: null,
          isDirty: false,
          lastSaved: new Date(),
        });
      },

      markSaved: () => {
        set({
          isDirty: false,
          lastSaved: new Date(),
        });
      },

      reorderElements: (elementIds) => {
        const { elements } = get();
        const reorderedElements = elementIds
          .map((id) => elements.find((el) => el.id === id))
          .filter(Boolean) as DesignElement[];
        
        set({
          elements: reorderedElements.map((el, index) => ({
            ...el,
            layerDepth: index,
          })),
          isDirty: true,
        });
      },
    }),
    {
      name: 'design-store',
      partialize: (state) => ({
        elements: state.elements,
        canvasSize: state.canvasSize,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
