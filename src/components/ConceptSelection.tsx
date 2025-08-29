import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lightbulb, Eye, MessageSquare } from 'lucide-react';

export interface Concept {
  id: string;
  name: string;
  description: string;
  visual_direction: string;
  key_message: string;
  execution_idea: string;
}

interface ConceptSelectionProps {
  concepts: Concept[];
  onSelectConcept: (conceptId: string) => void;
  selectedConceptId?: string;
  loading?: boolean;
}

export function ConceptSelection({ 
  concepts, 
  onSelectConcept, 
  selectedConceptId,
  loading 
}: ConceptSelectionProps) {
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!concepts || concepts.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No concepts available</h3>
        <p className="text-gray-600">Generate concepts from your enhanced brief to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Concept</h2>
        <p className="text-gray-600">Select the concept that best aligns with your vision</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {concepts.map((concept) => (
          <motion.div
            key={concept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div
              className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                selectedConceptId === concept.id
                  ? 'ring-2 ring-blue-500 shadow-xl'
                  : hoveredConcept === concept.id
                  ? 'shadow-xl'
                  : 'shadow-md'
              }`}
              onMouseEnter={() => setHoveredConcept(concept.id)}
              onMouseLeave={() => setHoveredConcept(null)}
              onClick={() => onSelectConcept(concept.id)}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">{concept.name}</h3>
                  <AnimatePresence>
                    {selectedConceptId === concept.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="bg-white rounded-full p-1"
                      >
                        <Check className="w-5 h-5 text-blue-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Description */}
                <div>
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Concept Overview</h4>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{concept.description}</p>
                </div>

                {/* Visual Direction */}
                <div>
                  <div className="flex items-center mb-2">
                    <Eye className="w-4 h-4 text-purple-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Visual Direction</h4>
                  </div>
                  <p className="text-gray-600 text-sm">{concept.visual_direction}</p>
                </div>

                {/* Key Message */}
                <div>
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mr-2" />
                    <h4 className="font-semibold text-gray-900">Key Message</h4>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{concept.key_message}"</p>
                </div>

                {/* Execution Idea */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Execution</h4>
                  <p className="text-gray-600 text-sm">{concept.execution_idea}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-4">
                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedConceptId === concept.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectConcept(concept.id);
                  }}
                >
                  {selectedConceptId === concept.id ? 'Selected' : 'Select Concept'}
                </button>
              </div>
            </div>

            {/* Hover Effect Overlay */}
            <AnimatePresence>
              {hoveredConcept === concept.id && selectedConceptId !== concept.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {selectedConceptId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-blue-50 rounded-lg"
        >
          <div className="flex items-center">
            <Check className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-blue-700 font-medium">
              Concept selected! Ready to generate reference image.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Concept Card Component for smaller displays
export function ConceptCard({ concept, isSelected, onSelect }: {
  concept: Concept;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{concept.name}</h4>
        {isSelected && <Check className="w-4 h-4 text-blue-500" />}
      </div>
      <p className="text-sm text-gray-600 mb-2">{concept.description}</p>
      <div className="text-xs text-gray-500">
        <p><strong>Visual:</strong> {concept.visual_direction}</p>
        <p><strong>Message:</strong> {concept.key_message}</p>
      </div>
    </div>
  );
}