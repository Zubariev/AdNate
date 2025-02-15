import React, { useState } from 'react';
import { HfInference } from '@huggingface/inference';
import { Sparkles, Loader2 } from 'lucide-react';

interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
      
      const response = await hf.textToImage({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        inputs: prompt,
        parameters: {
          negative_prompt: 'blurry, bad quality, distorted',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      });

      // Convert blob to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onImageGenerated(base64data);
      };
      reader.readAsDataURL(response);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-lg font-semibold">AI Image Generator</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Describe your image
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A colorful smoke against black background flows..."
          className="h-24 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={generateImage}
        disabled={isGenerating}
        className="flex w-full items-center justify-center space-x-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate Image</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ImageGenerator;