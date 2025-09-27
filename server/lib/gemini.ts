import { RawConcept, Concept, ElementSpecification, ReferenceImage, ElementSpecificationData, ElementImage, elementSpecificationDataSchema } from "../../shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnhancedBriefData } from '../../src/types';
import { GoogleGenAI } from "@google/genai";

// axios no longer needed since we're not using the remove.bg API
declare module "@google/genai" {
  interface GenerateContentParameters {
    generationConfig?: {
      responseMimeType?: string;
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
    };
  }
}

import { storage } from '../storage';
import { supabase } from "../db";
import { removeBackground as removeBgApi } from "@imgly/background-removal-node";

// Helper function to generate UUID for element IDs
function generateUUID(): string {
  // Use native crypto if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


// Simple check for potential transparency based on image type
async function hasTransparentBackground(imageBase64: string): Promise<boolean> {
  try {
    // Simplified check - look for PNG signature which supports transparency
    if (imageBase64.includes('data:image/png')) {
      // This is just a heuristic - PNG format supports transparency,
      // but we don't know if this specific image has transparency
      // without examining the actual pixel data
      return true;
    }
    
    // For other formats, we'll just assume no transparency
    return false;
  } catch (error) {
    console.error('Error checking image transparency:', error);
    return false; // Assume no transparency on error
  }
}

async function removeBackground(imageBase64: string): Promise<string | null> {
  // First check if image already has transparency
  try {
    const hasTransparency = await hasTransparentBackground(imageBase64);
    
    if (hasTransparency) {
      console.log("✅ Image already has transparent background, skipping removal.");
      return imageBase64;
    }
  } catch (err) {
    console.warn("Error checking transparency, proceeding with background removal:", err);
  }

  // 1. Try with @imgly/background-removal-node for faster processing
  try {
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    const blob = new Blob([imageBuffer]);
    const result = await removeBgApi(blob);
    const buffer = await result.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = result.type;
    console.log("✅ Background removed successfully with @imgly/background-removal-node.");
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn("⚠️ @imgly/background-removal-node failed. Falling back to Gemini for background removal.", error);

    // 2. Fallback to Gemini API (keeping everything in Google's ecosystem)
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not configured. Cannot use Gemini for background removal.");
        return null; // Can't proceed with fallback
      }

      // Create a new instance of the Gemini API
      const ai = new GoogleGenAI({ apiKey });
      
      // Format image for API consumption
      const imageData = imageBase64.split(',')[1]; // Remove data URL prefix
      
      // Create a prompt specifically for background removal
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [{ 
          role: "user", 
          parts: [
            { 
              inlineData: { 
                mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 
                data: imageData 
              } 
            },
            { 
              text: "Remove the background from this image and make it transparent. Return only the subject with transparent background." 
            }
          ] 
        }],
        generationConfig: {
          responseMimeType: "image/png", // Ensure PNG output for transparency support
        },
      });

      if (!response.candidates || 
          response.candidates.length === 0 || 
          !response.candidates[0].content || 
          !response.candidates[0].content.parts) {
        throw new Error("No response from Gemini for background removal");
      }

      // Extract the image data from the response
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          console.log("✅ Background removed successfully with Gemini.");
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data in Gemini response");
    } catch (fallbackError) {
      console.error("❌ Gemini background removal fallback also failed.", fallbackError);
      // No image means we couldn't remove the background
      return null;
    }
  }
}

function formatObjectForPrompt(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return 'N/A';
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}


export type BriefInput = {
  projectName?: string;
  targetAudience?: string;
  keyMessage?: string;
  brandGuidelines?: string;
  bannerSizes?: string;
  brandContext?: string;
  objective?: string;
  consumerJourney?: string;
  emotionalConnection?: string;
  visualStyle?: string;
  performanceMetrics?: string;
};

export type EnhancedBriefOutput = {
  projectName: string;
  targetAudience: string;
  keyMessage: string;
  brandGuidelines: string;
  bannerSizes: string;
  brandContext?: string;
  objective?: string;
  consumerJourney?: string;
  emotionalConnection?: string;
  visualStyle?: string;
  performanceMetrics?: string;
};

// export interface GeminiResponse {
//   completedBrief: RawConcept;
//   concepts: RawConcept[];
// }

export async function enhanceBrief(brief: BriefInput): Promise<EnhancedBriefOutput> {
  try {
    console.log('Gemini API Key exists for brief enhancement:', !!process.env.GEMINI_API_KEY);

    console.log('Enhancing brief:', brief);

    const completionPrompt = `As a veteran Marketing Director with 15+ years at Ogilvy and WPP (having managed $200M+ in campaigns), analyze this brief through the lens of a client who *doesn't know what they don't know*. Your mission: Transform vague inputs into a contractor-ready brief using **real-world agency protocols**. 

    **Critical Rules for Enhancement:**
    1. **Diagnose amateur traps** (e.g., "I want more sales" → convert to SMART KPIs with industry benchmarks)
    2. **Inject business context** missing in inputs (e.g., "eco-friendly product" → "For DTC skincare, 'eco-friendly' claims require 3rd-party certifications to avoid greenwashing penalties per FTC 2023 guidelines")
    3. **Apply psychological frameworks** (e.g., "emotional connection" → "Leverage loss aversion: 'Join 12,347 customers protecting their skin before summer damage' (proven 22% higher conversion vs generic 'radiant skin')")
    4. **Anticipate contractor pain points** (e.g., if banner sizes lack specs: "Added 1.5x safety margins for mobile thumb zones per Google UX guidelines")
    5. **Cite real campaign data** (e.g., "For Gen Z, 'authenticity' requires UGC elements—campaigns with real customer photos see 3.2x ROAS (Meta 2024)")
    
    **User Context Analysis:**
    - If inputs are vague: "This reads like a first-time founder. They likely confuse 'brand guidelines' with 'I like blue'."
    - If objectives lack metrics: "Amateur trap: 'more sales' without timeframe/baseline. Must fix."
    - If visual style is "modern": "Danger zone—contractors will waste 3 revisions guessing. Need concrete references."
    
    **Brief Enhancement Protocol:**
    For **EACH** section below, provide:
    - **Professional Translation**: Rewrite amateur input into agency-ready language
    - **Business Rationale**: "Why this matters to your P&L" (with data)
    - **Contractor Directive**: "What to tell your agency to prevent $50k revisions"
    - **Red Flag Alert**: "If you skip this, creatives will fail because..."
    
    **Brief details provided:**
    ${Object.entries(brief)
      .map(([key, value]) => `${key}: ${value || 'MISSING'}`)
      .join('\n')}
    
    **Required Output Structure (JSON):**
    {
      "projectName": "string // [Professional Translation] + [Red Flag Alert]",
      "targetAudience": "string // [Demographic/psychographic deep dive] + [Business Rationale: 'Why this audience?'] + [Contractor Directive: 'Specify: Age 28-35, NOT 'young people'']",
      "keyMessage": "string // [Message architecture: Core + Proof Point + CTA] + [Red Flag Alert: 'Avoid adjectives like "best"—FTC requires substantiation']",
      "brandGuidelines": "string // [Hex codes + typography + 'DOs/DON'Ts for contractors'] + [Business Rationale: 'Inconsistent colors cost brands 23% recognition (Forrester)']",
      "bannerSizes": "string // [Sizes + technical specs: e.g., '300x250: 1.5x safety margins, max 3 text lines for mobile'] + [Contractor Directive: 'Require .psd layers for revision efficiency']",
      "brandContext": "string // [Positioning statement: "For [X], [Brand] is the [Y] that [Z]"] + [Red Flag Alert: 'Missing context = generic creatives. Example: "We're not 'another skincare brand'—we're the only lab-validated Ayurvedic brand for acne-prone skin"']",
      "objective": "string // [SMART goal: "Increase CTR from 1.2% → 2.5% in 90 days (industry avg: 1.8% per Google)"] + [Business Rationale: 'CTR <1.8% wastes $3.20/click (WordStream 2024)']",
      "consumerJourney": "string // [Stage + behavioral trigger: "Consideration phase: Users comparing ingredients on Amazon"] + [Contractor Directive: 'Show product IN USE—not just packaging']",
      "emotionalConnection": "string // [Psychological lever: "Anxiety reduction via 'dermatologist-approved' badges (triggers safety need)"] + [Business Rationale: 'Emotion-driven ads get 2x shareability (Harvard Business Review)']",
      "visualStyle": "string // [Concrete references: "Cottagecore meets Biopunk (see Aesthetics Wiki) + Kodachrome film grain"] + [Red Flag Alert: 'Vague terms like "modern" cause 68% revision rate (AdWeek)']",
      "performanceMetrics": "string // [Primary + guardrail metrics: "Primary: ROAS >3.0 | Guardrail: Bounce rate <45%"] + [Contractor Directive: 'Track UTM parameters: utm_campaign=summer2024_serum']"
    }`;

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const completion = await model.generateContent([
      { text: completionPrompt + "\n\nIMPORTANT: Return ONLY valid JSON, no other text or markdown formatting." }
    ]);

    const responseText = completion.response.text();
    console.log('Raw Gemini response for brief completion:', responseText);
    
    // Clean the response to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
    
    const filledBrief = JSON.parse(cleanedResponse);
    console.log('Enhanced brief:', filledBrief);
    return filledBrief;
  } catch (error) {
    console.error('Error details (enhanceBrief):', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

export async function generateConceptsFromEnhancedBrief(enhancedBrief: EnhancedBriefOutput): Promise<RawConcept[]> {
  try {
    console.log('Gemini API Key exists for concept generation:', !!process.env.GEMINI_API_KEY);

    console.log('Generating concepts for enhanced brief:', enhancedBrief);

    const conceptPrompt = `Based on the provided brief details, generate 3 groundbreaking banner design concepts that demonstrate mastery of visual communication. Concepts MUST integrate at least two aesthetics from Aesthetics Wiki (e.g., Dark Academia, Cottagecore, Adventurecore) and THREE photography techniques from this list: [chiaroscuro, warm golden hour lighting, soft bounced lighting, specular lighting, bioluminescent details]. Return your response in JSON format using the structure provided below.

    Project Details:
    Project: ${enhancedBrief.projectName}
    Target Audience: ${enhancedBrief.targetAudience}
    Key Message: ${enhancedBrief.keyMessage}
    Brand Guidelines: ${enhancedBrief.brandGuidelines}
    Banner Sizes: ${enhancedBrief.bannerSizes}
    Brand Context: ${enhancedBrief.brandContext}
    Objective: ${enhancedBrief.objective}
    Consumer Journey: ${enhancedBrief.consumerJourney}
    Emotional Connection: ${enhancedBrief.emotionalConnection}
    Visual Style: ${enhancedBrief.visualStyle}
    Performance Metrics: ${enhancedBrief.performanceMetrics}
    
    For EACH concept, STRICTLY INCLUDE:
    1. A title reflecting aesthetic fusion (e.g., "Dark Academia Meets Bioluminescent Adventurecore")
    2. Visual elements breakdown with SPECIFIC technical execution:
       - Background: Must specify lighting technique (e.g., "chiaroscuro with warm golden hour backlighting"), atmospheric perspective, and texture (e.g., "Kodachrome film grain overlay") 
       - Graphics: Product photography technique (e.g., "specular lighting on liquid droplets with translucency effects"), compositional rule (e.g., "rule of thirds with leading lines"), and aesthetic integration (e.g., "Cottagecore's nature harmony through organic textures")
       - Text: Typography psychology (e.g., "serif font for Dark Academia's scholarly authority at 24pt hierarchy") 
       - Layout: Must reference at least one compositional principle (e.g., "golden ratio spiral guiding eye to CTA")
       - Animation: Motion design physics (e.g., "ease-in-out animation mimicking natural light diffusion")
    
    3. Midjourney prompts with TECHNICAL SPECIFICS:
       - Format: "[subject], [aesthetic style], [lighting technique], [lens/film type], [compositional rule] --ar [ratio] --style raw"
       - Example: "luxury watch, Dark Academia, chiaroscuro lighting with soft bounced fill, shot on Kodachrome 64 film, rule of thirds composition --ar 16:9"
    
    4. Design rationale with EVIDENCED IMPACT:
       - Target Audience Appeal: "Bioluminescent details trigger 37% higher engagement in Gen Z (Forrester 2023) by leveraging neuroaesthetic principles"
       - Brand Alignment: "Cottagecore's nature motifs increase brand trust by 22% (Nielsen) while maintaining luxury positioning through chiaroscuro depth"
       - Visual Hierarchy: "Strong side key lights create 40% faster focal point recognition (eye-tracking study) by exploiting Gestalt proximity principle"
    
    CRITICAL REQUIREMENTS:
    - NO stock photo clichés (e.g., generic handshakes or smiling crowds)
    - MUST subvert at least one industry expectation (e.g., "using 'nonexistence' aesthetic to create negative space that boosts CTR")
    - All photography terms MUST be correctly applied per professional standards
    - Aesthetic choices MUST reference specific wiki entries (e.g., "Fluent Design's glassmorphism layers enhance digital product perception")
    
    Return your response in the following JSON structure:
    {
      "concepts": [{
        "title": "string",
        "description": "string",
        "elements": {
          "background": "string",
          "graphics": "string",
          "text": "string",
          "layout": "string",
          "typography": "string",
          "animation": "string"
        },
        "midjourneyPrompts": {
          "background": "string",
          "graphics": "string",
          "text": "string"
        },
        "rationale": {
          "targetAudienceAppeal": "string",
          "brandAlignment": "string",
          "messagingStrategy": "string",
          "visualHierarchy": "string"
        }
      }]
    }`;

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const conceptResponse = await model.generateContent([
      { text: conceptPrompt + "\n\nIMPORTANT: Return ONLY valid JSON, no other text or markdown formatting." }
    ]);

    console.log('Received response from Gemini');
    const content = conceptResponse.response.text();
    if (!content) {
      throw new Error("Failed to generate concepts - no content received from Gemini");
    }

    console.log('Raw Gemini response for concepts:', content);
    
    // Clean the response to extract JSON
    const conceptJsonMatch = content.match(/\{[\s\S]*\}/);
    const cleanedConceptResponse = conceptJsonMatch ? conceptJsonMatch[0] : content;
    
    const parsedContent = JSON.parse(cleanedConceptResponse);
    console.log('Parsed Gemini response:', parsedContent);
    return parsedContent.concepts;
  } catch (error) {
    console.error('Error details (generateConceptsFromEnhancedBrief):', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

export async function generateReferenceImage(enhancedBriefData: EnhancedBriefData, concept: Concept, userId: string): Promise<ReferenceImage> {
  // Build prompt - reference image should be a complete design WITH background
  const prompt = `Create one professional advertising image for:
Campaign: ${enhancedBriefData.project_name}
Target: ${enhancedBriefData.target_audience}
Message: ${enhancedBriefData.key_message}
Visual Style: ${enhancedBriefData.visual_style}
Concept: ${concept.title}
Description: ${concept.description}
Elements: ${formatObjectForPrompt(concept.elements)}
Additional Context: ${formatObjectForPrompt(concept.midjourneyPrompts)}
Rationale: ${formatObjectForPrompt(concept.rationale)}
IMPORTANT: Create a complete design with proper background as a mockup reference.`;

  // Try with Gemini
  try {
    console.log("Attempting image generation with Gemini...");
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "image/png", // Prefer PNG for transparency support
        temperature: 0.7,
        topP: 0.95,
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini for image generation.");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts returned from Gemini for image generation.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const imageData = part.inlineData.data;
        const referenceImage = `data:${mimeType};base64,${imageData}`;
        const newImageRecord = await storage.storeReferenceImage({
          conceptId: concept.id,
          briefId: concept.briefId,
          userId: userId,
          promptUsed: prompt,
          imageBase64: referenceImage,
          imageData: { source: 'gemini' }
        });
        console.log("✅ Gemini image saved in Supabase bucket and database:", newImageRecord.id);
        return newImageRecord;
      }
    }

    throw new Error("Gemini returned no image data in parts.");

  } catch (geminiError: unknown) {
    const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.error("❌ Gemini image generation failed:", geminiErrorMessage);
    throw new Error(`Reference image generation failed: ${geminiErrorMessage}`);
  }
}

// Main prompt2 function - analyze reference image and generate element specifications
export async function generateElementSpecifications(
  briefId: string,
  conceptId: string,
  referenceImageId?: string
): Promise<{
  success: boolean;
  elementSpecification: ElementSpecification;
  specifications: ElementSpecificationData; // This will be the JSONB data
  metadata: {
    selectedConcept: Concept;
    referenceImage: ReferenceImage;
    processingTime: number;
    aiModel: string;
  };
}> {
  const startTime = Date.now();

  try {
    // Step 1: Fetch concept
    const concept = await storage.getConceptById(conceptId);
    if (!concept) {
      throw new Error(`Concept with ID ${conceptId} not found.`);
    }

    // Step 2: Get reference image
    let referenceImage: ReferenceImage | null = null;
    if (referenceImageId) {
      referenceImage = await storage.getReferenceImage(referenceImageId);
    } else {
      referenceImage = await storage.getLatestReferenceImageByConceptId(conceptId);
    }

    if (!referenceImage || !referenceImage.imageUrl) {
      throw new Error('Reference image not found for the concept.');
    }

    const tempImageUrl = await storage.getPublicUrl('reference-images', referenceImage.imagePath || referenceImage.fileName || '');
    if (!tempImageUrl) {
        throw new Error('Could not generate temporary URL for reference image');
    }

    // Step 3: Convert image to base64 for AI analysis
    const base64Image = await storage.convertImageToBase64(tempImageUrl);
    
    // Step 4: Build the element specification prompt
    const elementSpecificationPrompt = `As a Senior Digital Production Artist with expertise in ad banner creation, analyze this reference banner design and generate SPECIFICATION SHEETS for each editable element. DO NOT describe what you see - instead, provide PRODUCTION-GRADE specifications for regenerating each element separately with perfect transparency.

Reference banner concept:
${JSON.stringify(concept)}

Reference visual (for context only):
  ${base64Image}

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
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const elementSpecificationResponse = await model.generateContent([
      { text: elementSpecificationPrompt + "\n\nIMPORTANT: Return ONLY valid JSON, no other text or markdown formatting." }
    ]);

    const elementSpecificationResponseText = elementSpecificationResponse.response?.text();
    if (!elementSpecificationResponseText) {
      throw new Error("Failed to generate element specifications - no content received from Gemini");
    }
    const elementSpecificationJsonMatch = elementSpecificationResponseText.match(/\{[\s\S]*\}/);
    const cleanedElementSpecificationResponse = elementSpecificationJsonMatch ? elementSpecificationJsonMatch[0] : elementSpecificationResponseText;
    const elementSpecificationJson = JSON.parse(cleanedElementSpecificationResponse) as ElementSpecificationData;

    // Step 5: Store the specifications in the database    
    const elementSpec = await storage.createElementSpecification(
      briefId,
      conceptId,
      elementSpecificationJson,
      elementSpecificationPrompt,
      referenceImage.id,
      "gemini-2.5-flash"
    );

    // Return the complete result
    return {
      success: true,
      elementSpecification: elementSpec,
      specifications: elementSpecificationJson,
      metadata: {
        selectedConcept: concept,
        referenceImage: referenceImage,
        processingTime: Date.now() - startTime,
        aiModel: "gemini-2.5-flash"
      }
    };
  } catch (error) {
    console.error('Error generating element specifications:', error);
    throw error;
  }
}

function _buildDetailedPrompt(element: ElementSpecificationData['elements'][0]): string | null {
  const base_prompt = element.regenerationPrompt;
  if (!base_prompt) {
      return null;
  }
  const additional_details = [
      element.criticalConstraints,
      element.lightingRequirements,
      element.styleContinuityMarkers,
      element.transparencyRequirements,
      element.styleAnchors,
      element.perspective,
      element.type,
      element.purpose
  ];
  const full_prompt_parts = [base_prompt, ...additional_details.filter(detail => detail)];
  return full_prompt_parts.join(', ');
}

export async function processBriefImages(briefId: string, userId: string): Promise<void> {
  console.log(`Starting to process images for brief_id: ${briefId}`);

  try {
    // 1. Set status to 'processing'
    if (supabase) {
      await supabase
        .from('briefs')
        .update({ image_generation_status: 'processing' })
        .eq('id', briefId);
    }

    const specRecords = await getElementSpecifications(briefId);

    if (!specRecords || specRecords.length === 0) {
      console.warn(`No specifications found for brief_id: ${briefId}. Aborting.`);
      // Set status to 'failed' as this is an unexpected state
      if (supabase) {
        await supabase
          .from('briefs')
          .update({ image_generation_status: 'failed' })
          .eq('id', briefId);
      }
      return;
    }

    for (const record of specRecords) {
      // Try to recover missing conceptId from the database if necessary
      if (!record.conceptId) {
        console.warn(`Record ${record.id} is missing conceptId. Attempting to retrieve from database...`);
        
        if (supabase) {
          // First, check if this specific record has a conceptId stored in the database
          const { data: specRecord, error: specError } = await supabase
            .from('element_specifications')
            .select('concept_id')
            .eq('id', record.id)
            .single();
            
          if (specError || !specRecord?.concept_id) {
            console.warn(`Could not find conceptId for record ${record.id} directly.`);
            
            // As a fallback, try to find any concept associated with this brief
            const { data: conceptData, error: conceptError } = await supabase
              .from('concepts')
              .select('id')
              .eq('brief_id', briefId)
              .limit(1)
              .single();
              
            if (conceptError || !conceptData) {
              console.error(`No concepts found for brief ${briefId}. Cannot proceed with this record.`);
              
              // Create a concept as a last resort if none exists
              const { data: newConcept, error: newConceptError } = await supabase
                .from('concepts')
                .insert({
                  brief_id: briefId,
                  title: "Auto-generated concept",
                  description: "Automatically created concept for recovery",
                  elements: {},
                  midjourney_prompts: {},
                  rationale: {}
                })
                .select()
                .single();
                
              if (newConceptError || !newConcept) {
                console.error(`Failed to create recovery concept: ${newConceptError?.message}`);
                continue;
              }
              
              record.conceptId = newConcept.id;
              console.log(`Created recovery concept with ID: ${record.conceptId}`);
              
              // Update the record in the database with the new conceptId
              await supabase
                .from('element_specifications')
                .update({ concept_id: record.conceptId })
                .eq('id', record.id);
            } else {
              record.conceptId = conceptData.id;
              console.log(`Found existing concept ID: ${record.conceptId}`);
              
              // Update the record in the database with the found conceptId
              await supabase
                .from('element_specifications')
                .update({ concept_id: record.conceptId })
                .eq('id', record.id);
            }
          } else {
            record.conceptId = specRecord.concept_id;
            console.log(`Retrieved conceptId from database: ${record.conceptId}`);
          }
        } else {
          console.error("Supabase client not available, cannot retrieve conceptId");
          continue;
        }
      }
      
      // Handle undefined specificationData with default structure
      if (record.specificationData === undefined) {
        console.warn(`Record ${record.id} has undefined 'specificationData'. Creating default structure.`);
        
        if (!record.conceptId) {
          console.error(`Still missing conceptId for record ${record.id} after recovery attempts. Cannot proceed.`);
          continue;
        }
        
        // Create a default structure that meets the schema requirements
        // This allows processing to continue rather than skipping the record
        const defaultSpecData = {
          background: {
            type: "Background",
            specification: "Default background specification",
            regenerationPrompt: "Generate a simple, neutral background suitable for a banner ad"
          },
          elements: [
            {
              id: generateUUID(),
              name: "default-element",
              type: "Default",
              purpose: "Default element for recovery",
              editabilityRating: 5,
              criticalConstraints: "None",
              dimensions: { width: 300, height: 250 },
              position: { x: 0, y: 0 },
              layerDepth: 1,
              transparencyRequirements: "Full transparency",
              styleContinuityMarkers: "None",
              regenerationPrompt: "Create a simple professional banner element with clear text",
              lightingRequirements: "Standard lighting",
              perspective: "Flat",
              styleAnchors: "Clean, minimal design"
            }
          ]
        };
        
        // Update the record in the database with the default structure
        if (supabase) {
          await supabase
            .from('element_specifications')
            .update({ specification_data: defaultSpecData })
            .eq('id', record.id);
          
          // Update the record in memory for continued processing
          record.specificationData = defaultSpecData;
          console.log(`Updated record ${record.id} with default specification data`);
        }
      }
      
      const parseResult = elementSpecificationDataSchema.safeParse(record.specificationData);

      if (!parseResult.success) {
        console.warn(`Validation failed for record ${record.id}: `, parseResult.error);
        continue;
      }
      const specData = parseResult.data;

      if (!specData) {
        console.warn(`Parsed data is null for record ${record.id}.`);
        continue;
      }

      // 1. Process regular elements
      for (const element of specData.elements) {
        const prompt = _buildDetailedPrompt(element);
        if (!prompt) {
          console.warn(`Skipping element due to missing 'regenerationPrompt': ${element.id}`);
          continue;
        }
        
        console.log(`--> Generating element ${element.id}`);
        const originalImage = await generateElementImage(prompt, element.id, userId, briefId, record.conceptId);
        console.log(`<-- Finished generating element ${element.id}`);

        if (!originalImage.imageBase64) {
          console.error(`Failed to get base64 for image of element ${element.id}`);
          continue;
        }

        // Regular elements need transparency
        let hasTransparency = false;
        try {
          hasTransparency = await hasTransparentBackground(originalImage.imageBase64);
        } catch (err) {
          console.warn(`Error checking transparency for element ${element.id}:`, err);
        }
        
        if (hasTransparency) {
          // The image already has transparency, use it as both original and transparent version
          console.log(`✅ Element ${element.id} already has transparency. Using as transparent version.`);
          await storage.storeElementImage({
            elementId: element.id,
            userId: userId,
            briefId: briefId,
            conceptId: record.conceptId,
            promptUsed: originalImage.promptUsed,
            imageBase64: originalImage.imageBase64,
            imageData: { source: 'transparent-original' },
            imageType: 'transparent'
          });
        } else {
          // Image needs background removal
          console.log(`--> Removing background for element ${element.id}`);
          const transparentImageBase64 = await removeBackground(originalImage.imageBase64);
          console.log(`<-- Finished removing background for element ${element.id}`);
          
          if (transparentImageBase64) {
            await storage.storeElementImage({
              elementId: element.id,
              userId: userId,
              briefId: briefId,
              conceptId: record.conceptId,
              promptUsed: 'background-removed',
              imageBase64: transparentImageBase64,
              imageData: { source: 'imgly-background-removal' },
              imageType: 'transparent'
            });
            console.log(`✅ Stored TRANSPARENT image for element ${element.id}`);
          } else {
            console.warn(`⚠️ Background removal failed for element ${element.id}. Using original as is.`);
            // If background removal fails, still store the original image as the transparent version
            // so the process can continue
            await storage.storeElementImage({
              elementId: element.id,
              userId: userId,
              briefId: briefId,
              conceptId: record.conceptId,
              promptUsed: 'failed-background-removal',
              imageBase64: originalImage.imageBase64,
              imageData: { source: 'original-as-transparent' },
              imageType: 'transparent'
            });
            console.log(`✅ Stored ORIGINAL image as TRANSPARENT for element ${element.id} (fallback)`);
          }
        }
      }

      // 2. Process the background separately
      const backgroundSpec = specData.background;
      if (backgroundSpec && backgroundSpec.regenerationPrompt) {
        const prompt = backgroundSpec.regenerationPrompt;
        console.log("--> Starting generation for BACKGROUND.");
        // Background elementId is special
        const backgroundElementId = 'background';
        const backgroundImage = await generateElementImage(prompt, backgroundElementId, userId, briefId, record.conceptId);
        if (backgroundImage) {
          console.log(`<-- Finished generation for BACKGROUND. Stored with id: ${backgroundImage.id}`);
          
          // Store the background image without transparency processing
          await storage.storeElementImage({
            elementId: backgroundElementId,
            userId: userId,
            briefId: briefId,
            conceptId: record.conceptId,
            promptUsed: backgroundImage.promptUsed,
            imageBase64: backgroundImage.imageBase64,
            imageData: { source: 'background-element' },
            imageType: 'transparent' // Using 'transparent' type for consistency in DB
          });
          console.log("✅ Background element saved directly (no transparency processing needed)");
        } else {
          console.error("Failed to generate BACKGROUND image.");
        }
      } else {
        console.warn("No background specification with a prompt found.");
      }
    }

    // Check if any images were actually generated and saved
    let generatedImageCount = 0;
    if (supabase) {
      // Count element images for this brief
      const { data: imageCountData, error: imageCountError } = await supabase
        .from('element_images')
        .select('id', { count: 'exact' })
        .eq('brief_id', briefId);
        
      if (imageCountError) {
        console.error(`Error checking element image count: ${imageCountError.message}`);
      } else {
        generatedImageCount = imageCountData.length;
        console.log(`Found ${generatedImageCount} element images for brief_id: ${briefId}`);
      }
    }
    
    // If no images were generated, mark as failed with an explanatory message
    if (generatedImageCount === 0) {
      console.warn(`No element images were generated for brief_id: ${briefId}. Setting status to 'failed'.`);
      
      if (supabase) {
        await supabase
          .from('briefs')
          .update({
            image_generation_status: 'failed',
            error_message: 'Image generation completed but no element images were created.'
          })
          .eq('id', briefId);
      }
    } else {
      // Set status to 'completed' only if images were generated
      if (supabase) {
        await supabase
          .from('briefs')
          .update({
            image_generation_status: 'completed',
            error_message: null // Clear any previous error message
          })
          .eq('id', briefId);
      }
      
      console.log(`Successfully generated ${generatedImageCount} images for brief_id: ${briefId}`);
    }

    console.log(`Finished processing all images for brief_id: ${briefId}`);
  } catch (error) {
    console.error(`Error processing images for brief ${briefId}:`, error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error({
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        briefId
      });
      
      // If it's a ZodError, log the specific issues for better debugging
      if (error.name === 'ZodError' && 'issues' in error) {
        console.error('Zod validation issues:', JSON.stringify(error.issues, null, 2));
      }
    }
    
    // Set status to 'failed' on error
    if (supabase) {
      await supabase
        .from('briefs')
        .update({ 
          image_generation_status: 'failed',
          error_message: error instanceof Error ? error.message : String(error)
        })
        .eq('id', briefId);
    }
    
    // Re-throw the error if you want the background task runner to know about the failure
    throw error;
  }
}

export async function getElementSpecifications(brief_id: string): Promise<ElementSpecification[]> {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
  const { data, error } = await supabase
    .from('element_specifications')
    .select('*')
    .eq('brief_id', brief_id)
  
  if (error) {
    console.error("Error fetching element specs:", error);
    throw error;
  }
  
  return data || [];
}

export async function generateElementImage(
  prompt: string,
  elementId: string,
  userId: string,
  briefId: string,
  conceptId: string,
): Promise<ElementImage & { imageBase64: string }> {
  // Determine if this is a background element - these shouldn't have transparent backgrounds
  const isBackground = elementId === 'background';
  
  // Create appropriate prompt based on element type
  const finalPrompt = isBackground
    ? `${prompt} Create a complete background design with rich details and proper context.`
    : `${prompt} Create this element with a completely transparent background, showing ONLY the element described with no background.`;
  
  try {
    // First try with Gemini API
    console.log(`Attempting ${isBackground ? 'background' : 'element'} image generation with Gemini...`);
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview", 
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        responseMimeType: "image/png", // PNG for potential transparency support
        temperature: 0.7,
        topP: 0.95,
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini for image generation.");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts returned from Gemini for image generation.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const imageData = part.inlineData.data;
        const elementImage = `data:${mimeType};base64,${imageData}`;
        const newImageRecord = await storage.storeElementImage({
          elementId: elementId,
          userId: userId,
          briefId: briefId,
          conceptId: conceptId,
          promptUsed: finalPrompt,
          imageBase64: elementImage,
          imageData: { source: 'gemini', isBackground }, 
          imageType: 'original'
        });
        console.log(`✅ Gemini ${isBackground ? 'background' : 'element'} image saved in database:`, newImageRecord.id);
        return { ...newImageRecord, imageBase64: elementImage };
      }
    }
    throw new Error("Gemini returned no image data in parts.");
  } catch (geminiError: unknown) {
    const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.error(`❌ Gemini failed for ${isBackground ? 'background' : 'element'} image generation:`, geminiErrorMessage);
    throw new Error(`${isBackground ? 'Background' : 'Element'} image generation failed: ${geminiErrorMessage}`);
  }
}
