import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is not configured');
    }

    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: completionPrompt }],
      response_format: { type: "json_object" }
    });

    const filledBrief = JSON.parse(completion.choices[0].message.content || "{}");
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

    console.log('Sending prompt to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: conceptPrompt }],
      response_format: { type: "json_object" }
    });

    console.log('Received response from OpenAI');
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate concepts - no content received from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    console.log('Parsed OpenAI response:', parsedContent);
    return parsedContent;
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}