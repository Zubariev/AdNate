
// // Server-side proxy for Hugging Face API calls
// // This keeps API keys secure on the server side

// interface HuggingFaceRequest {
//   prompt: string;
//   model?: string;
//   options?: {
//     guidance_scale?: number;
//     num_inference_steps?: number;
//     width?: number;
//     height?: number;
//   };
// }

// interface HuggingFaceResponse {
//   success: boolean;
//   imageUrl?: string;
//   error?: string;
// }

// // Rate limiting configuration
// const RATE_LIMIT = {
//   maxRequests: 10,
//   windowMs: 60000, // 1 minute
// };

// // In a real implementation, this would be a server endpoint
export async function generateImageProxy(request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
  try {
    // Check rate limiting
    const rateLimitResult = await checkRateLimit();
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`
      };
    }

//     // Validate request
//     if (!request.prompt || request.prompt.trim().length === 0) {
//       return {
//         success: false,
//         error: 'Prompt is required'
//       };
//     }

//     if (request.prompt.length > 500) {
//       return {
//         success: false,
//         error: 'Prompt is too long (max 500 characters)'
//       };
//     }

//     // Sanitize prompt
//     const sanitizedPrompt = sanitizePrompt(request.prompt);

//     // For now, return a placeholder since we need server-side implementation
//     // In production, this would make the actual API call server-side
//     return {
//       success: true,
//       imageUrl: 'https://via.placeholder.com/512x512/6366f1/ffffff?text=AI+Generated+Image'
//     };

//   } catch (error) {
//     console.error('Hugging Face API error:', error);
//     return {
//       success: false,
//       error: 'Failed to generate image. Please try again.'
//     };
//   }
// }

// async function checkRateLimit(): Promise<{ allowed: boolean; retryAfter?: number }> {
//   // Simple client-side rate limiting
//   const key = 'huggingface_requests';
//   const now = Date.now();
//   const requests = JSON.parse(localStorage.getItem(key) || '[]');
  
//   // Clean old requests
//   const recentRequests = requests.filter((timestamp: number) => 
//     now - timestamp < RATE_LIMIT.windowMs
//   );
  
//   if (recentRequests.length >= RATE_LIMIT.maxRequests) {
//     const oldestRequest = Math.min(...recentRequests);
//     const retryAfter = Math.ceil((RATE_LIMIT.windowMs - (now - oldestRequest)) / 1000);
//     return { allowed: false, retryAfter };
//   }
  
//   // Add current request
//   recentRequests.push(now);
//   localStorage.setItem(key, JSON.stringify(recentRequests));
  
//   return { allowed: true };
// }

// function sanitizePrompt(prompt: string): string {
//   // Remove potentially harmful content
//   const sanitized = prompt
//     .replace(/[<>]/g, '') // Remove HTML tags
//     .replace(/javascript:/gi, '') // Remove javascript: protocols
//     .replace(/on\w+=/gi, '') // Remove event handlers
//     .trim();
    
//   return sanitized.substring(0, 500); // Limit length
// }

// export { type HuggingFaceRequest, type HuggingFaceResponse };
