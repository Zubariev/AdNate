// Element Specifications Analysis API
// This module handles the "prompt2" workflow for analyzing reference images and generating element specifications
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { 
  getSelectedConcept, 
  getReferenceImageWithTempLink, 
  createElementSpecification,
  getAllReferenceImagesWithTempLinks 
} from './supabase';
import { Concept, ReferenceImage } from '../types';
import { ElementSpecificationType } from '../types';

declare global {
  interface Window {
    Config: {
      ai_config: {
        element_specifications_creator: {
          model: string;
          system_prompt: (context: { currentTime: string }) => string;
          temperature: number;
          maxTokens: number;
        }
      }
    }
  }
}

// Base64 image conversion utility
export async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:image/xxx;base64, prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Zod schema for element specification structure
const ElementSpecificationSchema = z.object({
  background: z.object({
    type: z.string(),
    specification: z.string(),
    regenerationPrompt: z.string()
  }),
  elements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    purpose: z.string(),
    editabilityRating: z.number().min(1).max(5),
    criticalConstraints: z.string(),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    layerDepth: z.number().min(1).max(10),
    transparencyRequirements: z.string(),
    styleContinuityMarkers: z.string(),
    regenerationPrompt: z.string(),
    lightingRequirements: z.string(),
    perspective: z.string(),
    styleAnchors: z.string()
  }))
});

// Main prompt2 function - analyze reference image and generate element specifications
export async function generateElementSpecifications(
  briefId: string,
  conceptId?: string,
  referenceImageId?: string
): Promise<{
  success: boolean;
  elementSpecification: ElementSpecificationType;
  specifications: ElementSpecificationType;
  metadata: {
    selectedConcept: Concept;
    referenceImage: ReferenceImage & { tempUrl?: string };
    processingTime: number;
    aiModel: string;
  };
}> {
  const startTime = Date.now();

  console.log('🎯 Starting element specifications generation:', { 
    briefId, 
    conceptId, 
    referenceImageId 
  });

  try {
    const config = window.Config?.ai_config?.element_specifications_creator;
    if (!config) {
      throw new Error('Element specifications creator config not found');
    }
    // Step 1: Fetch selected concept
    let selectedConcept: Concept | undefined;
    if (conceptId) {
      // Use provided concept ID to get the concept details
      const concepts = await import('./supabase').then(m => m.getConceptsByBrief(briefId));
      selectedConcept = concepts.find(c => c.id === conceptId);
    } else {
      // Get the selected concept for this brief
      const selectedConceptData = await getSelectedConcept(briefId);
      selectedConcept = selectedConceptData?.concepts as Concept;
      conceptId = selectedConcept?.id;
    }

    if (!selectedConcept) {
      throw new Error('No selected concept found for this brief');
    }

    console.log('📋 Selected concept retrieved:', {
      conceptId: selectedConcept.id,
      name: selectedConcept.title
    });

    // Step 2: Get reference image with temporary link
    let referenceImage: (ReferenceImage & { tempUrl?: string }) | undefined;
    let tempImageUrl;

    if (referenceImageId) {
      // Use specific reference image
      referenceImage = await getReferenceImageWithTempLink(referenceImageId, 3600);
      tempImageUrl = referenceImage.tempUrl;
    } else {
      // Get the most recent reference image for this concept
      const allImages = await getAllReferenceImagesWithTempLinks(briefId, 3600);
      const conceptImages = allImages.filter(img => img.concept_id === conceptId);
      
      if (conceptImages.length === 0) {
        throw new Error('No reference images found for this concept');
      }

      referenceImage = conceptImages[0]; // Get most recent
      tempImageUrl = referenceImage.tempUrl;
    }

    if (!tempImageUrl) {
      throw new Error('Could not generate temporary URL for reference image');
    }

    console.log('🖼️ Reference image retrieved:', {
      imageId: referenceImage.id,
      fileName: referenceImage.file_name,
      hasUrl: !!tempImageUrl
    });

    // Step 3: Convert image to base64 for AI analysis
    console.log('🔄 Converting image to base64...');
    const base64Image = await convertImageToBase64(tempImageUrl);
    
    console.log('✅ Image converted to base64:', {
      base64Length: base64Image.length,
      size: `${Math.round(base64Image.length * 0.75 / 1024)}KB` // Approximate size
    });

    // Step 4: Build the element specification prompt
    const elementSpecificationPrompt = `As a Senior Digital Production Artist with expertise in ad banner creation, analyze this reference banner design and generate SPECIFICATION SHEETS for each editable element. DO NOT describe what you see - instead, provide PRODUCTION-GRADE specifications for regenerating each element separately with perfect transparency.

Reference banner concept:
${JSON.stringify(selectedConcept)}

Reference visual (for context only):
[BASE64_ENCODED_REFERENCE_IMAGE]

CRITICAL INSTRUCTIONS:
1. For each element, provide specifications as if briefing a designer who will recreate it from scratch
2. NEVER describe the reference image - focus on production requirements
3. Text elements MUST specify: exact font family, size, weight, tracking, and color codes
4. For graphics, specify: lighting continuity requirements, perspective angle, and transparency zones
5. Identify which elements are "locked" (cannot be edited without breaking design)

For EACH element, provide:

1. **Element Blueprint**:
   - Type: [Primary Product/Text/CTA/etc.]
   - Purpose: [What this element communicates to viewers]
   - Editability Rating: [1-5, where 5 = fully editable]
   - Critical Constraints: [e.g., "Logo must maintain 2:1 aspect ratio"]

2. **Technical Specification**:
   - Dimensions: {width, height} in pixels (scaled to banner size)
   - Position: {x, y} coordinates (top-left origin)
   - Layer Depth: [1-10, 10 = foreground]
   - Transparency Requirements: [Specific areas that MUST be transparent]
   - Style Continuity Markers: [e.g., "Match Kodachrome grain from background"]

3. **Regeneration Protocol**:
   - Generation Prompt: [Precise description for creating THIS element on transparent background]
   - Lighting Requirements: [e.g., "30° side lighting matching reference"]
   - Perspective: [e.g., "Isometric 15° angle"]
   - Style Anchors: [e.g., "Match brush stroke texture from reference"]

Output STRICTLY as JSON with this structure:
{
  "background": {
    "type": "Background",
    "specification": "string",
    "regenerationPrompt": "string"
  },
  "elements": [{
    "id": "UUID",
    "name": "string (semantic name like 'primary-cta-button')",
    "type": "string",
    "purpose": "string",
    "editabilityRating": number,
    "criticalConstraints": "string",
    "dimensions": {"width": number, "height": number},
    "position": {"x": number, "y": number},
    "layerDepth": number,
    "transparencyRequirements": "string",
    "styleContinuityMarkers": "string",
    "regenerationPrompt": "string",
    "lightingRequirements": "string",
    "perspective": "string",
    "styleAnchors": "string"
  }]
}`;

    // Step 5: Generate element specifications using AI
    console.log('🤖 AI API Request (Element Specifications):', {
      model: config.model,
      scene: 'element_specification_analyzer',
      conceptName: selectedConcept.title,
      imageId: referenceImage.id,
      promptLength: elementSpecificationPrompt.length
    });

    const systemPrompt = config.system_prompt ? 
      config.system_prompt({ currentTime: new Date().toISOString() }) : 
      '';

    const result = await generateObject({
      model: google(config.model),
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        {
          role: 'user' as const,
          content: [
            {
              type: 'text',
              text: elementSpecificationPrompt
            },
            {
              type: 'image',
              image: `data:image/png;base64,${base64Image}`
            }
          ]
        }
      ],
      schema: ElementSpecificationSchema,
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 8000
    });

    console.log('✅ AI API Response (Element Specifications):', {
      model: config.model,
      scene: 'element_specification_analyzer',
      backgroundGenerated: !!result.object.background,
      elementsCount: result.object.elements?.length || 0,
      elementTypes: result.object.elements?.map(e => e.type) || [],
      processingTime: `${Date.now() - startTime}ms`
    });

    // Step 6: Store the specifications in the database
    console.log('💾 Storing element specifications in database...');
    
    const elementSpec = await createElementSpecification(
      briefId,
      conceptId!,
      result.object,
      elementSpecificationPrompt,
      referenceImage.id,
      config.model
    );

    console.log('✅ Element specifications stored:', {
      specId: elementSpec.id,
      briefId: elementSpec.brief_id,
      conceptId: elementSpec.concept_id,
      referenceImageId: elementSpec.reference_image_id
    });

    // Return the complete result
    return {
      success: true,
      elementSpecification: elementSpec,
      specifications: result.object,
      metadata: {
        selectedConcept,
        referenceImage,
        processingTime: Date.now() - startTime,
        aiModel: config.model
      }
    };

  } catch (error) {
    const err = error as Error;
    console.error('❌ API Error - Element specifications generation failed:', {
      briefId,
      conceptId,
      referenceImageId,
      error: err.message,
      processingTime: `${Date.now() - startTime}ms`
    });
    throw new Error(`API Error - Element specifications generation failed: ${err.message}`);
  }
}

// Utility function to get existing specifications
export async function getExistingElementSpecifications(
  briefId: string,
  conceptId?: string
) {
  try {
    const { getElementSpecifications } = await import('./supabase');
    const specifications = await getElementSpecifications(briefId, conceptId);
    
    return specifications.map(spec => ({
      ...spec,
      specifications: spec.specification_data
    }));
  } catch (error) {
    console.error('Error getting existing element specifications:', error);
    throw error;
  }
}

// Main export for the prompt2 workflow
export const prompt2 = generateElementSpecifications;

// Export types for use in other modules
export { ElementSpecificationType };