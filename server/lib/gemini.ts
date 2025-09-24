import { RawConcept, Concept, ElementSpecification, ReferenceImage, ElementSpecificationData, ElementImage, elementSpecificationDataSchema } from "../../shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnhancedBriefData } from '../../src/types';
import { GoogleGenAI } from "@google/genai";

import axios, { AxiosError } from 'axios';
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

async function removeBackground(imageBase64: string): Promise<string | null> {
  // 1. Try with @imgly/background-removal-node
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
    console.warn("⚠️ @imgly/background-removal-node failed. Falling back to remove.bg API.", error);

    // 2. Fallback to remove.bg
    try {
      const removeBgApiKey = process.env.REMOVE_BG_API_KEY;
      if (!removeBgApiKey) {
        console.error("❌ REMOVE_BG_API_KEY not configured. Cannot fallback for background removal.");
        return null; // Can't proceed with fallback
      }

      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        {
          image_file_b64: imageBase64.split(',')[1],
          size: 'auto'
        },
        {
          headers: {
            'X-Api-Key': removeBgApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'json'
        }
      );
      
      const removedBgBase64 = response.data.data.result_b64;
      console.log("✅ Background removed successfully with remove.bg fallback.");
      return `data:image/png;base64,${removedBgBase64}`;

    } catch (fallbackError) {
      console.error("❌ Background removal fallback (remove.bg) also failed.", fallbackError);
      if (axios.isAxiosError(fallbackError)) {
        console.error("remove.bg API response body:", (fallbackError as AxiosError).response?.data);
      }
      return null; // Both primary and fallback failed.
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Build prompt
  const prompt = `Dont answer in text. Create one professional advertising image for:
Campaign: ${enhancedBriefData.project_name}
Target: ${enhancedBriefData.target_audience}
Message: ${enhancedBriefData.key_message}
Visual Style: ${enhancedBriefData.visual_style}
Concept: ${concept.title}
Description: ${concept.description}
Elements: ${formatObjectForPrompt(concept.elements)}
Aditional Context: ${formatObjectForPrompt(concept.midjourneyPrompts)}
Rationale: ${formatObjectForPrompt(concept.rationale)}`;

  // Try Gemini first
  try {
    console.log("Attempting image generation with Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "image/jpeg",
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
    console.warn("⚠️ Gemini failed, falling back to Qwen-Image via Segmind...", geminiErrorMessage);

    // Fallback to Segmind Qwen-Image (Fast Flux Schnell)
    try {
      const segmindApiKey = process.env.SEGMIND_API_KEY;
      if (!segmindApiKey) {
        console.error("❌ SEGMIND_API_KEY not configured. Cannot fallback.");
        throw new Error("Image generation failed: Gemini error + Segmind API key missing.");
      }

      // Construct a simpler, more direct prompt for the fallback API
      const mjPrompts = concept.midjourneyPrompts as Record<string, unknown>;
      const promptParts: string[] = [concept.title];

      if (mjPrompts && typeof mjPrompts === 'object' && Object.keys(mjPrompts).length > 0) {
        Object.values(mjPrompts).forEach(v => {
          if (typeof v === 'string') {
            promptParts.push(v);
          }
        });
      } else {
        if (concept.description) {
            promptParts.push(concept.description);
        }
        const elements = concept.elements as Record<string, unknown>;
        if (elements && typeof elements === 'object' && Object.keys(elements).length > 0) {
            Object.values(elements).forEach(v => {
              if (typeof v === 'string') {
                promptParts.push(v);
              }
            });
        }
      }
      const fallbackPrompt = promptParts.join(', ');
    
      const segmindResponse = await axios.post<{ image: string }>(
        "https://api.segmind.com/v1/qwen-image",
        {
          prompt: fallbackPrompt,
          aspect_ratio: "16:9",
          seed: Math.floor(Math.random() * 1000000),
          base64: true
        },
        {
          headers: {
            'x-api-key': segmindApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
    
      const base64Image = segmindResponse.data.image;
      if (!base64Image) {
        throw new Error(`Segmind Qwen-Image returned invalid response: ${JSON.stringify(segmindResponse.data)}`);
      }
    
      const referenceImage = `data:image/jpeg;base64,${base64Image}`;
      const newImageRecord = await storage.storeReferenceImage({
          conceptId: concept.id,
          briefId: concept.briefId,
          userId: userId,
          promptUsed: fallbackPrompt,
          imageBase64: referenceImage,
          imageData: { source: 'qwen-image-segmind' }
      });
    
      console.log("✅ Fallback Qwen-Image saved in Supabase bucket and database:", newImageRecord.id);
      return newImageRecord;
    
    } catch (segmindError: unknown) {
      const segmindErrorMessage = segmindError instanceof Error ? segmindError.message : String(segmindError);
      console.error("❌ Segmind Qwen-Image also failed:", segmindErrorMessage);
      if (axios.isAxiosError(segmindError)) {
        console.error("Segmind API response body:", (segmindError as AxiosError).response?.data);
      }
      throw new Error(`Image generation failed completely. Gemini: ${geminiErrorMessage} | Segmind: ${segmindErrorMessage}`);
    }
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      "gemini-1.5-flash"
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
        aiModel: "gemini-1.5-flash"
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
    await supabase
      .from('briefs')
      .update({ image_generation_status: 'processing' })
      .eq('id', briefId);

    const specRecords = await getElementSpecifications(briefId);

    if (!specRecords || specRecords.length === 0) {
      console.warn(`No specifications found for brief_id: ${briefId}. Aborting.`);
      // Set status to 'failed' as this is an unexpected state
      await supabase
        .from('briefs')
        .update({ image_generation_status: 'failed' })
        .eq('id', briefId);
      return;
    }

    for (const record of specRecords) {
      const parseResult = elementSpecificationDataSchema.safeParse(record.specification_data);

      if (!parseResult.success) {
        console.warn("Skipping record due to invalid 'specification_data' format.", parseResult.error);
        continue;
      }
      const specData = parseResult.data;

      if (!specData) {
        console.warn("Skipping record due to missing 'specification_data'.");
        continue;
      }

      // 1. Process each element
      for (const element of specData.elements) {
        const prompt = _buildDetailedPrompt(element);
        if (!prompt) {
          console.warn(`Skipping element due to missing 'regenerationPrompt': ${element.id}`);
          continue;
        }
        
        console.log(`--> Generating ORIGINAL for element ${element.id}`);
        const originalImage = await generateElementImage(prompt, element.id, userId, briefId, record.conceptId);
        console.log(`<-- Finished generating ORIGINAL for element ${element.id}`);

        // The returned `ElementImage` from storage does not have `imageBase64`. 
        // We need the base64 string for the background removal function.
        // `generateElementImage` should return it, or we need another way to get it.
        // For now, I'll assume `generateElementImage` returns the base64 string.
        // This will require a change in `generateElementImage`'s return type.
        // I'll modify `generateElementImage` to return both the DB record and the base64 string.
        if (!originalImage.imageBase64) {
            console.error(`Failed to get base64 for original image of element ${element.id}`);
            continue;
        }

        // Remove background and store the transparent version
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
          console.warn(`Background removal failed for element ${element.id}.`);
        }
      }

      // 2. Process the background
      const backgroundSpec = specData.background;
      if (backgroundSpec && backgroundSpec.regenerationPrompt) {
        const prompt = backgroundSpec.regenerationPrompt;
        console.log("--> Starting generation for BACKGROUND.");
        // We use a placeholder elementId for background.
        const backgroundElementId = 'background';
        const backgroundImage = await generateElementImage(prompt, backgroundElementId, userId, briefId, record.conceptId);
        if (backgroundImage) {
          console.log(`<-- Finished generation for BACKGROUND. Stored with id: ${backgroundImage.id}`);
        } else {
          console.error("Failed to generate BACKGROUND image.");
        }
      } else {
        console.warn("No background specification with a prompt found.");
      }
    }

    // 2. Set status to 'completed'
    await supabase
      .from('briefs')
      .update({ image_generation_status: 'completed' })
      .eq('id', briefId);

    console.log(`Finished processing all images for brief_id: ${briefId}`);
  } catch (error) {
    console.error(`Error processing images for brief ${briefId}:`, error);
    // 3. Set status to 'failed' on error
    await supabase
      .from('briefs')
      .update({ image_generation_status: 'failed' })
      .eq('id', briefId);
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    console.log("Attempting element image generation with Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-image-preview", 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "image/png", 
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
          promptUsed: prompt,
          imageBase64: elementImage,
          imageData: { source: 'gemini' },
          imageType: 'original'
        });
        console.log("✅ Gemini element image saved in Supabase bucket and database:", newImageRecord.id);
        return { ...newImageRecord, imageBase64: elementImage };
      }
    }
    throw new Error("Gemini returned no image data in parts.");
  } catch (geminiError: unknown) {
    const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.warn("⚠️ Gemini failed for element image, falling back to Qwen-Image via Segmind...", geminiErrorMessage);

    try {
      const segmindApiKey = process.env.SEGMIND_API_KEY;
      if (!segmindApiKey) {
        console.error("❌ SEGMIND_API_KEY not configured. Cannot fallback.");
        throw new Error("Image generation failed: Gemini error + Segmind API key missing.");
      }

      const segmindResponse = await axios.post<{ image: string }>(
        "https://api.segmind.com/v1/qwen-image",
        {
          prompt: prompt,
          aspect_ratio: "16:9",
          seed: Math.floor(Math.random() * 1000000),
          base64: true
        },
        {
          headers: {
            'x-api-key': segmindApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const base64Image = segmindResponse.data.image;
      if (!base64Image) {
        throw new Error(`Segmind Qwen-Image returned invalid response: ${JSON.stringify(segmindResponse.data)}`);
      }

      const elementImage = `data:image/jpeg;base64,${base64Image}`;
      const newImageRecord = await storage.storeElementImage({
          elementId: elementId,
          userId: userId,
          briefId: briefId,
          conceptId: conceptId,
          promptUsed: prompt,
          imageBase64: elementImage,
          imageData: { source: 'qwen-image-segmind' },
          imageType: 'original'
      });

      console.log("✅ Fallback Qwen-Image for element saved in Supabase bucket and database:", newImageRecord.id);
      return { ...newImageRecord, imageBase64: elementImage };

    } catch (segmindError: unknown) {
      const segmindErrorMessage = segmindError instanceof Error ? segmindError.message : String(segmindError);
      console.error("❌ Segmind Qwen-Image also failed for element:", segmindErrorMessage);
      if (axios.isAxiosError(segmindError)) {
        console.error("Segmind API response body:", (segmindError as AxiosError).response?.data);
      }
      throw new Error(`Element image generation failed completely. Gemini: ${geminiErrorMessage} | Segmind: ${segmindErrorMessage}`);
    }
  }
}

