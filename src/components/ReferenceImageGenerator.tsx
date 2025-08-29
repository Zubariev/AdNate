import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Download, RefreshCw, Settings } from 'lucide-react';
import { generateReferenceImage } from '../api/ai';

interface ReferenceImageGeneratorProps {
  enhancedBrief: any;
  selectedConcept: any;
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
        selectedConcept,
        settings.style,
        settings.focus
      );

      setGeneratedImage(result.url);
      setLastPrompt(result.prompt);
      onImageGenerated(result.url, result.prompt);
    } catch (error) {
      console.error('Error generating reference image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [enhancedBrief, selectedConcept, settings, onImageGenerated]);

  const handleRegenerate = useCallback(() => {
    setGeneratedImage(null);
    handleGenerateImage();
  }, [handleGenerateImage]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `reference-${selectedConcept.name.toLowerCase().replace(/\s+/g, '-')}.png`;
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate Reference Image</h2>
        <p className="text-gray-600">Create a professional reference image based on your selected concept</p>
      </div>

      {/* Settings Panel */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Generation Settings</h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Settings className="w-4 h-4 mr-1" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={settings.style}
                    onChange={(e) => updateSetting('style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
                  <select
                    value={settings.focus}
                    onChange={(e) => updateSetting('focus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="product showcase">Product Showcase</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="environmental">Environmental</option>
                    <option value="abstract">Abstract</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                  <input
                    type="text"
                    value={settings.mood}
                    onChange={(e) => updateSetting('mood', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., professional and inspiring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Palette</label>
                  <input
                    type="text"
                    value={settings.colorPalette}
                    onChange={(e) => updateSetting('colorPalette', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., brand colors with high contrast"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lighting</label>
                  <input
                    type="text"
                    value={settings.lighting}
                    onChange={(e) => updateSetting('lighting', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., natural studio lighting"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generation Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !enhancedBrief || !selectedConcept}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </button>

            {generatedImage && (
              <>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Download className="w-4 h-4 mr-2" />
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
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={generatedImage}
                alt="Generated reference image"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            
            {lastPrompt && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Generation Prompt</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lastPrompt}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h4>
            <p className="text-gray-600 mb-4">
              {enhancedBrief && selectedConcept
                ? 'Click "Generate Image" to create your reference image'
                : 'Select a concept to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Existing Images Gallery */}
      {existingImages && existingImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Generations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => setGeneratedImage(imageUrl)}
                    className="opacity-0 group-hover:opacity-100 text-white text-sm"
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