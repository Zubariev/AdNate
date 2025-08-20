import { GoogleGenerativeAI } from "@google/generative-ai";

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

type BriefInput = {
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

export async function generateConcepts(brief: BriefInput): Promise<any> {
  try {
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY);

    console.log('Generating concepts for brief:', brief);

    // First, let's auto-fill any missing fields
    const completionPrompt = `As an expert marketing strategist, please analyze the following brief and fill in any missing or incomplete information with appropriate, professional suggestions based on the provided context. Also expand and enhance any minimal information provided.

Brief details provided:
${Object.entries(brief)
  .map(([key, value]) => `${key}: ${value || 'MISSING'}`)
  .join('\n')}

Required sections to fill and enhance:
1. Project Name: Clear, specific project identifier
2. Target Audience: Detailed demographic and psychographic profile
3. Key Message: Main message with supporting points
4. Brand Guidelines: Comprehensive color, tone, and style requirements
5. Banner Sizes: Required dimensions and specifications
6. Brand Context: Brand's background, values, market position
7. Objective: Specific, measurable campaign goals
8. Consumer Journey: Where this fits in the customer journey
9. Emotional Connection: Desired emotional response and rationale
10. Visual Style: Detailed visual direction and references
11. Performance Metrics: Success measurement criteria

For each section, provide detailed, professional marketing content that aligns with industry best practices.

Please provide your response in JSON format with the following structure:
{
  "projectName": "string",
  "targetAudience": "string",
  "keyMessage": "string",
  "brandGuidelines": "string",
  "bannerSizes": "string",
  "brandContext": "string",
  "objective": "string",
  "consumerJourney": "string",
  "emotionalConnection": "string",
  "visualStyle": "string",
  "performanceMetrics": "string"
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
    console.log('Auto-filled brief:', filledBrief);

    // Now generate detailed concepts based on the complete brief
    const conceptPrompt = `Based on the provided brief details, generate 3 detailed banner design concepts. Return your response in JSON format using the structure provided below.

Project Details:
Project: ${filledBrief.projectName}
Target Audience: ${filledBrief.targetAudience}
Key Message: ${filledBrief.keyMessage}
Brand Guidelines: ${filledBrief.brandGuidelines}
Banner Sizes: ${filledBrief.bannerSizes}
Brand Context: ${filledBrief.brandContext}
Objective: ${filledBrief.objective}
Consumer Journey: ${filledBrief.consumerJourney}
Emotional Connection: ${filledBrief.emotionalConnection}
Visual Style: ${filledBrief.visualStyle}
Performance Metrics: ${filledBrief.performanceMetrics}

For each concept, include:
1. A distinctive title and comprehensive description
2. Detailed breakdown of visual elements:
   - Background: Setting, atmosphere, textures, and mood
   - Graphics: Key visual elements, imagery, icons, and their symbolism
   - Text: Copy, messaging hierarchy, and typography treatment
   - Layout: Element arrangement, composition principles, and visual flow
   - Typography: Font choices, sizes, weights, and styling
   - Animation: Motion design suggestions (if applicable)
3. Midjourney-compatible prompts for generating each visual element
4. Design rationale explaining:
   - Target audience appeal and psychological impact
   - Brand alignment and value communication
   - Messaging strategy and communication hierarchy
   - Visual hierarchy and attention flow

Return your response in the following JSON structure:
{
  "completedBrief": ${JSON.stringify(filledBrief)},
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

    console.log('Sending prompt to Gemini');
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
    return parsedContent;
  } catch (error) {
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}