import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Download, RefreshCw, Settings } from 'lucide-react';
import { generateReferenceImage } from '../../server/lib/gemini';
import { EnhancedBriefData, Concept } from '../types';

interface ReferenceImageGeneratorProps {
  enhancedBrief: EnhancedBriefData | null;
  selectedConcept: Concept | null;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
  existingImages?: string[];
}

interface GenerationSettings {
  style: string;
  focus: string;
  mood: string;
  colorPalette: string;
  lighting: string;
}

const defaultSettings: GenerationSettings = {
  style: 'modern advertising',
  focus: 'product showcase',
  mood: 'professional and inspiring',
  colorPalette: 'brand colors with high contrast',
  lighting: 'natural studio lighting'
};

export function ReferenceImageGenerator({
  enhancedBrief,
  selectedConcept,
  onImageGenerated,
  existingImages = []
}: ReferenceImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  const handleGenerateImage = useCallback(async () => {
    if (!enhancedBrief || !selectedConcept) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateReferenceImage(
        enhancedBrief,
        selectedConcept
      );

      setGeneratedImage(result.url);
      setLastPrompt(result.prompt);
      onImageGenerated(result.url, result.prompt);
    } catch (error) {
      console.error('Error generating reference image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [enhancedBrief, selectedConcept, onImageGenerated]);

  const handleRegenerate = useCallback(() => {
    setGeneratedImage(null);
    handleGenerateImage();
  }, [handleGenerateImage]);

  const handleDownload = useCallback(() => {
    if (!generatedImage || !selectedConcept) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `reference-${selectedConcept?.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage, selectedConcept]);

  const updateSetting = (key: keyof GenerationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Generate Reference Image</h2>
        <p className="text-gray-600">Create a professional reference image based on your selected concept</p>
      </div>

      {/* Settings Panel */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Generation Settings</h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Settings className="mr-1 w-4 h-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Style</label>
                  <select
                    value={settings.style}
                    onChange={(e) => updateSetting('style', e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="modern advertising">Modern Advertising</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="luxury">Luxury</option>
                    <option value="vintage">Vintage</option>
                    <option value="corporate">Corporate</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Focus</label>
                  <select
                    value={settings.focus}
                    onChange={(e) => updateSetting('focus', e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="product showcase">Product Showcase</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="environmental">Environmental</option>
                    <option value="abstract">Abstract</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Mood</label>
                  <input
                    type="text"
                    value={settings.mood}
                    onChange={(e) => updateSetting('mood', e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., professional and inspiring"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Color Palette</label>
                  <input
                    type="text"
                    value={settings.colorPalette}
                    onChange={(e) => updateSetting('colorPalette', e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., brand colors with high contrast"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Lighting</label>
                  <input
                    type="text"
                    value={settings.lighting}
                    onChange={(e) => updateSetting('lighting', e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., natural studio lighting"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generation Preview */}
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !enhancedBrief || !selectedConcept}
              className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="mr-2 w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>

            {generatedImage && (
              <>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600"
                >
                  <RefreshCw className="mr-2 w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                >
                  <Download className="mr-2 w-4 h-4" />
                  Download
                </button>
              </>
            )}
          </div>
        </div>

        {generatedImage ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="overflow-hidden relative rounded-lg">
              <img
                src={generatedImage}
                alt="Generated reference image"
                className="object-contain w-full h-auto max-h-96"
              />
            </div>
            
            {lastPrompt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="mb-2 font-semibold text-gray-900">Generation Prompt</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lastPrompt}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="py-12 text-center">
            <div className="flex justify-center items-center mx-auto mb-4 w-24 h-24 bg-gray-100 rounded-lg">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="mb-2 text-lg font-medium text-gray-900">Ready to Generate</h4>
            <p className="mb-4 text-gray-600">
              {enhancedBrief && selectedConcept
                ? 'Click "Generate Image" to create your reference image'
                : 'Select a concept to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Existing Images Gallery */}
      {existingImages && existingImages.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Previous Generations</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Reference ${index + 1}`}
                  className="object-cover w-full h-32 rounded-lg"
                />
                <div className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-0 rounded-lg transition-opacity group-hover:bg-opacity-50">
                  <button
                    onClick={() => setGeneratedImage(imageUrl)}
                    className="text-sm text-white opacity-0 group-hover:opacity-100"
                  >
                    Use This
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}