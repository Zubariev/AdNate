import { generateText, generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
