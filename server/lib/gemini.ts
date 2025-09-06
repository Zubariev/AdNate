import { RawConcept } from "../../shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnhancedBriefData, Concept } from '../../src/types';
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import { storage } from '../storage.js';
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

export async function generateReferenceImage(enhancedBriefData: EnhancedBriefData, concept: Concept) {
  
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  
  try {
    // Create a detailed prompt for future use with actual image generation
    const prompt = `Dont answer in text. Create a professional advertising image for:
    Campaign: ${enhancedBriefData.project_name}
    Target: ${enhancedBriefData.target_audience}
    Message: ${enhancedBriefData.key_message}
    Visual Style: ${enhancedBriefData.visual_style}
    Concept: ${concept.title}
    Description: ${concept.description}
    Elements: ${concept.elements}
    Aditional Context: ${concept.midjourneyPrompts}
    Rationale: ${concept.rationale}`
    ;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const imageData = part.inlineData.data;
        const referenceImage = `data:${mimeType};base64,${imageData}`;
        const imageUrl = await storage.storeReferenceImage(concept.id, referenceImage);
        console.log("Image saved in Supabase bucket", imageUrl);
        return {
          url: imageUrl,
          prompt: prompt
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error generating reference image:', error);
    throw error;
  }
}