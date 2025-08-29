import { createClient } from '@supabase/supabase-js';

export interface Brief {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_audience: string;
  goals: string[];
  constraints: string[];
  created_at: string;
  updated_at: string;
  enhanced_brief?: any;
  enhanced_brief_updated_at?: string;
}

export interface Concept {
  id: string;
  brief_id: string;
  user_id: string;
  name: string;
  description: string;
  visual_direction: string;
  key_message: string;
  execution_idea: string;
  created_at: string;
  updated_at: string;
}

export interface SelectedConcept {
  id: string;
  user_id: string;
  brief_id: string;
  concept_id: string;
  selected_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImage {
  id: string;
  user_id: string;
  brief_id: string;
  concept_id: string;
  image_url: string;
  image_path?: string; // Storage path for Supabase Storage
  file_name?: string; // Original file name
  file_size?: number; // File size in bytes
  mime_type?: string; // MIME type of the image
  image_data: any;
  prompt_used: string;
  created_at: string;
  updated_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qtuzwjjkbfwrrlszicoe.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dXp3amprYmZ3cnJsc3ppY29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1Njc5NjgsImV4cCI6MjA1NjE0Mzk2OH0.3X4TOAM3HgBqK9QshmKhlBEq_PanqX1z_yZ1ID7vuCk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced Brief Workflow APIs

export async function createEnhancedBrief(briefId: string, enhancedData: any) {
  try {
    const { data, error } = await supabase
      .from('briefs')
      .update({
        enhanced_brief: enhancedData,
        enhanced_brief_updated_at: new Date().toISOString()
      })
      .eq('id', briefId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating enhanced brief:', error);
    throw error;
  }
}

export async function getEnhancedBrief(briefId: string) {
  try {
    const { data, error } = await supabase
      .from('briefs')
      .select('id, enhanced_brief, enhanced_brief_updated_at')
      .eq('id', briefId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting enhanced brief:', error);
    throw error;
  }
}

// Concept Management APIs

export async function createConcepts(briefId: string, concepts: Omit<Concept, 'id' | 'created_at' | 'updated_at'>[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const conceptsToCreate = concepts.map(concept => ({
      ...concept,
      brief_id: briefId,
      user_id: user.id
    }));

    const { data, error } = await supabase
      .from('concepts')
      .insert(conceptsToCreate)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating concepts:', error);
    throw error;
  }
}

export async function getConceptsByBrief(briefId: string) {
  try {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting concepts:', error);
    throw error;
  }
}

// Selected Concept APIs

export async function selectConcept(briefId: string, conceptId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('selected_concepts')
      .upsert({
        user_id: user.id,
        brief_id: briefId,
        concept_id: conceptId,
        selected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,brief_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error selecting concept:', error);
    throw error;
  }
}

export async function getSelectedConcept(briefId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('selected_concepts')
      .select(`
        *,
        concepts (*)
      `)
      .eq('user_id', user.id)
      .eq('brief_id', briefId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting selected concept:', error);
    throw error;
  }
}

// Reference Image APIs

export async function uploadImageToStorage(file: File, conceptId: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${conceptId}/${Date.now()}.${fileExt}`;
    const filePath = `reference-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reference-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}

export async function createTemporaryImageLink(imagePath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('reference-images')
      .createSignedUrl(imagePath, expiresIn);

    if (error) throw error;
    if (!data.signedUrl) throw new Error('Failed to create signed URL');

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating temporary image link:', error);
    throw error;
  }
}

export async function createReferenceImage(referenceImage: Omit<ReferenceImage, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reference_images')
      .insert({
        ...referenceImage,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating reference image:', error);
    throw error;
  }
}

export async function createReferenceImageWithStorage(
  conceptId: string,
  briefId: string,
  imageFile: File,
  promptUsed: string,
  imageData: any = {}
): Promise<ReferenceImage> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Upload image to Supabase Storage
    const imagePath = await uploadImageToStorage(imageFile, conceptId);

    // Create reference image record
    const referenceImage = await createReferenceImage({
      brief_id: briefId,
      concept_id: conceptId,
      image_url: '', // Will be generated via signed URL when needed
      image_path: imagePath,
      file_name: imageFile.name,
      file_size: imageFile.size,
      mime_type: imageFile.type,
      image_data: imageData,
      prompt_used: promptUsed
    });

    return referenceImage;
  } catch (error) {
    console.error('Error creating reference image with storage:', error);
    throw error;
  }
}

export async function getReferenceImages(briefId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reference_images')
      .select('*')
      .eq('user_id', user.id)
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting reference images:', error);
    throw error;
  }
}

export async function getReferenceImageWithTempLink(imageId: string, expiresIn: number = 3600): Promise<ReferenceImage & { tempUrl?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get reference image record
    const { data: image, error } = await supabase
      .from('reference_images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    // Generate temporary signed URL if image_path exists
    let tempUrl: string | undefined;
    if (image.image_path) {
      tempUrl = await createTemporaryImageLink(image.image_path, expiresIn);
    }

    return {
      ...image,
      tempUrl
    };
  } catch (error) {
    console.error('Error getting reference image with temp link:', error);
    throw error;
  }
}

export async function getAllReferenceImagesWithTempLinks(briefId: string, expiresIn: number = 3600): Promise<(ReferenceImage & { tempUrl?: string })[]> {
  try {
    const images = await getReferenceImages(briefId);
    
    const imagesWithTempUrls = await Promise.all(
      images.map(async (image) => {
        let tempUrl: string | undefined;
        if (image.image_path) {
          try {
            tempUrl = await createTemporaryImageLink(image.image_path, expiresIn);
          } catch (error) {
            console.warn(`Failed to create temp URL for image ${image.id}:`, error);
          }
        }
        return {
          ...image,
          tempUrl
        };
      })
    );

    return imagesWithTempUrls;
  } catch (error) {
    console.error('Error getting reference images with temp links:', error);
    throw error;
  }
}

// Enhanced Brief Workflow - Complete Process

export async function completeEnhancedBriefWorkflow(
  briefId: string,
  enhancedData: any,
  concepts: Omit<Concept, 'id' | 'created_at' | 'updated_at'>[]
) {
  try {
    // 1. Update brief with enhanced data
    await createEnhancedBrief(briefId, enhancedData);

    // 2. Create concepts
    const createdConcepts = await createConcepts(briefId, concepts);

    return {
      success: true,
      briefId,
      enhanced: enhancedData,
      concepts: createdConcepts
    };
  } catch (error) {
    console.error('Error in enhanced brief workflow:', error);
    throw error;
  }
}

export async function completeReferenceImageWorkflow(
  briefId: string,
  conceptId: string,
  imageUrl: string,
  promptUsed: string,
  imageData: any = {}
) {
  try {
    const referenceImage = await createReferenceImage({
      brief_id: briefId,
      concept_id: conceptId,
      image_url: imageUrl,
      image_data: imageData,
      prompt_used: promptUsed
    });

    return {
      success: true,
      referenceImage
    };
  } catch (error) {
    console.error('Error in reference image workflow:', error);
    throw error;
  }
}

export async function completeReferenceImageWorkflowWithStorage(
  briefId: string,
  conceptId: string,
  imageFile: File,
  promptUsed: string,
  imageData: any = {}
) {
  try {
    const referenceImage = await createReferenceImageWithStorage(
      conceptId,
      briefId,
      imageFile,
      promptUsed,
      imageData
    );

    // Generate initial temporary URL for immediate use
    const tempUrl = referenceImage.image_path 
      ? await createTemporaryImageLink(referenceImage.image_path, 3600)
      : undefined;

    return {
      success: true,
      referenceImage: {
        ...referenceImage,
        tempUrl
      }
    };
  } catch (error) {
    console.error('Error in reference image workflow with storage:', error);
    throw error;
  }
}

// Utility function to download image from URL and convert to File
export async function downloadImageAsFile(imageUrl: string, fileName: string): Promise<File> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
    
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error('Error downloading image as file:', error);
    throw error;
  }
}

// Element Specifications APIs

export interface ElementSpecification {
  id: string;
  user_id: string;
  brief_id: string;
  concept_id: string;
  reference_image_id?: string;
  specification_data: any;
  ai_model_used: string;
  prompt_used: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export async function createElementSpecification(
  briefId: string,
  conceptId: string,
  specificationData: any,
  promptUsed: string,
  referenceImageId?: string,
  aiModel: string = 'gemini-2.5-pro'
): Promise<ElementSpecification> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('element_specifications')
      .insert({
        user_id: user.id,
        brief_id: briefId,
        concept_id: conceptId,
        reference_image_id: referenceImageId,
        specification_data: specificationData,
        prompt_used: promptUsed,
        ai_model_used: aiModel,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating element specification:', error);
    throw error;
  }
}

export async function getElementSpecifications(
  briefId: string,
  conceptId?: string
): Promise<ElementSpecification[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('element_specifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('brief_id', briefId);

    if (conceptId) {
      query = query.eq('concept_id', conceptId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting element specifications:', error);
    throw error;
  }
}

export async function getLatestElementSpecification(
  briefId: string,
  conceptId: string
): Promise<ElementSpecification | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('element_specifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('brief_id', briefId)
      .eq('concept_id', conceptId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  } catch (error) {
    console.error('Error getting latest element specification:', error);
    throw error;
  }
}