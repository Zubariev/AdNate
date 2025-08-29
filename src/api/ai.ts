import { generateText, generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Enhanced Brief Generation
export async function enhanceBrief(brief: any) {
  const startTime = Date.now();
  console.log('🚀 Starting brief enhancement:', { briefTitle: brief.title });

  const config = globalThis.ywConfig?.ai_config?.enhanced_brief;
  if (!config) {
    console.error('❌ API Error - Enhanced brief config not found');
    throw new Error('API Error - Enhanced brief configuration not found');
  }

  const openai = createOpenAI({
    baseURL: 'https://api.youware.com/public/v1/ai',
    apiKey: 'sk-YOUWARE'
  });

  const prompt = `Enhance the following advertising brief with detailed specifications, target audience insights, visual direction, and creative concepts.

Original Brief:
Title: ${brief.title}
Description: ${brief.description}
Target Audience: ${brief.target_audience}
Goals: ${brief.goals?.join(', ')}
Constraints: ${brief.constraints?.join(', ')}

Provide an enhanced version that includes:
1. Detailed target audience personas
2. Key messaging framework
3. Visual direction and mood board suggestions
4. Creative concept directions
5. Technical specifications
6. Success metrics

Return the enhanced brief as a structured JSON object.`;

  try {
    const { text } = await generateText({
      model: openai(config.model),
      messages: [
        {
          role: 'system',
          content: config.system_prompt({
            currentTime: new Date().toISOString()
          })
        },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    console.log('✅ Brief enhancement completed:', {
      processingTime: `${Date.now() - startTime}ms`,
      outputLength: text.length
    });

    try {
      return JSON.parse(text);
    } catch {
      return { enhanced: text };
    }
  } catch (error) {
    console.error('❌ API Error - Brief enhancement failed:', error.message);
    throw new Error(`API Error - Brief enhancement failed: ${error.message}`);
  }
}

// Concept Generation
export async function generateConcepts(enhancedBrief: any) {
  const startTime = Date.now();
  console.log('🎨 Starting concept generation:', { briefTitle: enhancedBrief.title });

  const config = globalThis.ywConfig?.ai_config?.concept_generator;
  if (!config) {
    console.error('❌ API Error - Concept generator config not found');
    throw new Error('API Error - Concept generator configuration not found');
  }

  const openai = createOpenAI({
    baseURL: 'https://api.youware.com/public/v1/ai',
    apiKey: 'sk-YOUWARE'
  });

  const prompt = `Based on the enhanced brief, generate exactly 3 distinct creative concepts.

Enhanced Brief:
${JSON.stringify(enhancedBrief, null, 2)}

For each concept, provide:
1. Concept name (catchy and memorable)
2. Detailed description (2-3 sentences)
3. Visual direction and aesthetic
4. Key message and brand positioning
5. Creative execution approach
6. Unique selling proposition

Return as a JSON array with exactly 3 concept objects.`;

  try {
    const { text } = await generateText({
      model: openai(config.model),
      messages: [
        {
          role: 'system',
          content: config.system_prompt
        },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    console.log('✅ Concept generation completed:', {
      processingTime: `${Date.now() - startTime}ms`,
      outputLength: text.length
    });

    try {
      const concepts = JSON.parse(text);
      return Array.isArray(concepts) ? concepts : [concepts];
    } catch {
      return [
        {
          name: "Concept 1",
          description: text.substring(0, 200) + "...",
          visual_direction: "Modern and clean",
          key_message: "Professional approach",
          execution_idea: "Digital-first campaign"
        }
      ];
    }
  } catch (error) {
    console.error('❌ API Error - Concept generation failed:', error.message);
    throw new Error(`API Error - Concept generation failed: ${error.message}`);
  }
}

// Reference Image Generation
export async function generateReferenceImage(
  enhancedBrief: any,
  selectedConcept: any,
  style: string = 'modern advertising',
  focus: string = 'product showcase'
) {
  const startTime = Date.now();
  console.log('🖼️ Starting reference image generation:', { conceptName: selectedConcept.name });

  const config = globalThis.ywConfig?.ai_config?.reference_image_creator;
  if (!config) {
    console.error('❌ API Error - Reference image creator config not found');
    throw new Error('API Error - Reference image creator configuration not found');
  }

  const prompt = `Create a professional advertising reference image for:

Campaign: ${enhancedBrief.title}
Concept: ${selectedConcept.name}
Description: ${selectedConcept.description}
Visual Direction: ${selectedConcept.visual_direction}
Key Message: ${selectedConcept.key_message}

Style: ${style}
Focus: ${focus}

The image should be high-quality, advertising-ready, and suitable for client presentation.`;

  try {
    const response = await fetch('https://api.youware.com/public/v1/ai/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-YOUWARE'
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        n: config.n,
        size: config.size,
        quality: config.quality,
        response_format: config.response_format
      })
    });

    if (!response.ok) {
      throw new Error(`API Error - Image generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Reference image generation completed:', {
      processingTime: `${Date.now() - startTime}ms`,
      imagesGenerated: data.data ? data.data.length : 0
    });

    if (data && data.data && data.data.length > 0) {
      const imageData = data.data[0];
      return {
        url: imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData.url,
        prompt: prompt
      };
    }

    throw new Error('No image data returned');
  } catch (error) {
    console.error('❌ API Error - Reference image generation failed:', error.message);
    throw new Error(`API Error - Reference image generation failed: ${error.message}`);
  }
}

// Complete Enhanced Brief Workflow
export async function processEnhancedBriefWorkflow(
  originalBrief: any,
  selectedConceptId?: string
) {
  const startTime = Date.now();
  console.log('🔄 Starting complete enhanced brief workflow:', { briefTitle: originalBrief.title });

  try {
    // Step 1: Enhance the brief
    const enhancedBrief = await enhanceBrief(originalBrief);
    
    // Step 2: Generate concepts
    const concepts = await generateConcepts(enhancedBrief);
    
    let referenceImage = null;
    
    // Step 3: If concept is selected, generate reference image
    if (selectedConceptId) {
      const selectedConcept = concepts.find(c => c.id === selectedConceptId) || concepts[0];
      referenceImage = await generateReferenceImage(enhancedBrief, selectedConcept);
    }

    console.log('✅ Complete enhanced brief workflow finished:', {
      processingTime: `${Date.now() - startTime}ms`,
      conceptsGenerated: concepts.length,
      referenceImageGenerated: !!referenceImage
    });

    return {
      enhancedBrief,
      concepts,
      referenceImage,
      success: true
    };
  } catch (error) {
    console.error('❌ API Error - Enhanced brief workflow failed:', error.message);
    throw error;
  }
}

// Batch Concept Generation
export async function batchGenerateConcepts(briefs: any[]) {
  const results = [];
  
  for (const brief of briefs) {
    try {
      const result = await processEnhancedBriefWorkflow(brief);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to process brief ${brief.id}:`, error.message);
      results.push({
        briefId: brief.id,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}