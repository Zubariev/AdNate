
import { supabase } from './supabase';
import { validateDesign, validateDesignElement } from './validations';
import { sanitizeDesignText } from './sanitization';
import type { DesignElement } from '../types';

export interface Design {
  id?: string;
  title: string;
  description?: string;
  width: number;
  height: number;
  elements: DesignElement[];
  backgroundColor?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaveDesignResult {
  success: boolean;
  design?: Design;
  error?: string;
}

/**
 * Save a new design to the database
 */
export async function saveDesign(designData: Omit<Design, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SaveDesignResult> {
  try {
    // Validate design data
    const validation = validateDesign(designData);
    if (!validation.success) {
      return {
        success: false,
        error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
      };
    }

    // Sanitize text content in elements
    const sanitizedElements = designData.elements.map(element => ({
      ...element,
      content: element.content ? sanitizeDesignText(element.content) : element.content
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const designToSave = {
      ...designData,
      elements: sanitizedElements,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('designs')
      .insert([designToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving design:', error);
      return { success: false, error: error.message };
    }

    return { success: true, design: data };
  } catch (error) {
    console.error('Error in saveDesign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update an existing design
 */
export async function updateDesign(id: string, updates: Partial<Design>): Promise<SaveDesignResult> {
  try {
    // Validate updates if elements are being updated
    if (updates.elements) {
      const validation = validateDesign({ ...updates, elements: updates.elements });
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
        };
      }

      // Sanitize text content
      updates.elements = updates.elements.map(element => ({
        ...element,
        content: element.content ? sanitizeDesignText(element.content) : element.content
      }));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('designs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own designs
      .select()
      .single();

    if (error) {
      console.error('Error updating design:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Design not found or access denied' };
    }

    return { success: true, design: data };
  } catch (error) {
    console.error('Error in updateDesign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Load a specific design by ID
 */
export async function loadDesign(id: string): Promise<SaveDesignResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading design:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Design not found' };
    }

    return { success: true, design: data };
  } catch (error) {
    console.error('Error in loadDesign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Load all designs for the current user
 */
export async function loadUserDesigns(): Promise<{ success: boolean; designs?: Design[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading user designs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, designs: data || [] };
  } catch (error) {
    console.error('Error in loadUserDesigns:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a design
 */
export async function deleteDesign(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting design:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteDesign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Auto-save functionality with debouncing
 */
let autoSaveTimeout: NodeJS.Timeout | null = null;

export function autoSaveDesign(
  designData: Design,
  callback?: (result: SaveDesignResult) => void
): void {
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Set new timeout for auto-save
  autoSaveTimeout = setTimeout(async () => {
    const result = designData.id 
      ? await updateDesign(designData.id, designData)
      : await saveDesign(designData);
    
    if (callback) {
      callback(result);
    }
  }, 2000); // Auto-save after 2 seconds of inactivity
}

/**
 * Cancel pending auto-save
 */
export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}
