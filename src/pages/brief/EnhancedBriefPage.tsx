import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getEnhancedBrief, 
  createEnhancedBrief, 
  getConceptsByBrief, 
  createConcepts, 
  selectConcept,
  completeEnhancedBriefWorkflow
} from '../../api/supabase';
import { enhanceBrief, generateConcepts } from '../../api/ai';
import { ConceptSelection } from '../../components/ConceptSelection';
import { ReferenceImageGenerator } from '../../components/ReferenceImageGenerator';
import { 
  Brain, 
  Lightbulb, 
  Image, 
  CheckCircle, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface Brief {
  id: string;
  title: string;
  description: string;
  target_audience: string;
  goals: string[];
  constraints: string[];
  enhanced_brief?: any;
  enhanced_brief_updated_at?: string;
}

interface Concept {
  id: string;
  name: string;
  description: string;
  visual_direction: string;
  key_message: string;
  execution_idea: string;
  created_at: string;
}

export function EnhancedBriefPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const navigate = useNavigate();
  
  const [brief, setBrief] = useState<Brief | null>(null);
  const [enhancedBrief, setEnhancedBrief] = useState<any>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  const [loading, setLoading] = useState({
    brief: false,
    enhancement: false,
    concepts: false,
    reference: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'brief' | 'concepts' | 'reference'>('loading');

  useEffect(() => {
    if (briefId) {
      loadInitialData();
    }
  }, [briefId]);

  const loadInitialData = async () => {
    setLoading(prev => ({ ...prev, brief: true }));
    try {
      // Load brief and check for existing enhanced brief
      const briefData = await getEnhancedBrief(briefId!);
      if (briefData?.enhanced_brief) {
        setEnhancedBrief(briefData.enhanced_brief);
        setStep('concepts');
        await loadConcepts();
      } else {
        setStep('brief');
      }
    } catch (error) {
      setError('Failed to load brief data');
      console.error('Error loading brief:', error);
    } finally {
      setLoading(prev => ({ ...prev, brief: false }));
    }
  };

  const loadConcepts = async () => {
    setLoading(prev => ({ ...prev, concepts: true }));
    try {
      const conceptsData = await getConceptsByBrief(briefId!);
      setConcepts(conceptsData);
      
      // Check for selected concept
      const selectedData = await selectConcept(briefId!, ''); // This will get the selected concept
      if (selectedData?.concept_id) {
        setSelectedConceptId(selectedData.concept_id);
      }
    } catch (error) {
      console.error('Error loading concepts:', error);
    } finally {
      setLoading(prev => ({ ...prev, concepts: false }));
    }
  };

  const handleEnhanceBrief = async () => {
    if (!brief) return;
    
    setLoading(prev => ({ ...prev, enhancement: true }));
    try {
      const enhanced = await enhanceBrief(brief);
      await createEnhancedBrief(briefId!, enhanced);
      setEnhancedBrief(enhanced);
      setStep('concepts');
      
      // Generate concepts automatically
      await handleGenerateConcepts();
    } catch (error) {
      setError('Failed to enhance brief');
      console.error('Error enhancing brief:', error);
    } finally {
      setLoading(prev => ({ ...prev, enhancement: false }));
    }
  };

  const handleGenerateConcepts = async () => {
    if (!enhancedBrief) return;
    
    setLoading(prev => ({ ...prev, concepts: true }));
    try {
      const generatedConcepts = await generateConcepts(enhancedBrief);
      
      // Save concepts to database
      const conceptsToSave = generatedConcepts.map((concept: any, index: number) => ({
        name: concept.name || `Concept ${index + 1}`,
        description: concept.description || '',
        visual_direction: concept.visual_direction || '',
        key_message: concept.key_message || '',
        execution_idea: concept.execution_idea || ''
      }));
      
      const savedConcepts = await createConcepts(briefId!, conceptsToSave);
      setConcepts(savedConcepts);
    } catch (error) {
      setError('Failed to generate concepts');
      console.error('Error generating concepts:', error);
    } finally {
      setLoading(prev => ({ ...prev, concepts: false }));
    }
  };

  const handleSelectConcept = async (conceptId: string) => {
    setSelectedConceptId(conceptId);
    await selectConcept(briefId!, conceptId);
    setStep('reference');
  };

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    setReferenceImages(prev => [...prev, imageUrl]);
  };

  const handleCompleteWorkflow = async () => {
    try {
      await completeEnhancedBriefWorkflow(briefId!, enhancedBrief, concepts);
      // Navigate to success page or show completion message
    } catch (error) {
      console.error('Error completing workflow:', error);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'brief', label: 'Enhance Brief', icon: Brain },
      { id: 'concepts', label: 'Generate Concepts', icon: Lightbulb },
      { id: 'reference', label: 'Create Reference', icon: Image }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={stepItem.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive
                      ? isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isActive && index < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {stepItem.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading.brief) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading brief data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/brief')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Briefs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderStepIndicator()}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Step 1: Enhance Brief */}
          {step === 'brief' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Enhance Your Brief</h1>
                <p className="text-gray-600">
                  Our AI will analyze your brief and enhance it with detailed insights and creative direction.
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={handleEnhanceBrief}
                  disabled={loading.enhancement}
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading.enhancement ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enhancing Brief...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Start Enhancement
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generate and Select Concepts */}
          {step === 'concepts' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Creative Concepts</h2>
                    <p className="text-gray-600">Choose the concept that best fits your vision</p>
                  </div>
                  {concepts.length === 0 && (
                    <button
                      onClick={handleGenerateConcepts}
                      disabled={loading.concepts}
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {loading.concepts ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Generate Concepts
                        </>
                      )}
                    </button>
                  )}
                </div>

                <ConceptSelection
                  concepts={concepts}
                  selectedConceptId={selectedConceptId}
                  onSelectConcept={handleSelectConcept}
                  loading={loading.concepts}
                />
              </div>
            </div>
          )}

          {/* Step 3: Generate Reference Image */}
          {step === 'reference' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reference Image</h2>
                    <p className="text-gray-600">Create a professional reference image for your campaign</p>
                  </div>
                </div>

                <ReferenceImageGenerator
                  enhancedBrief={enhancedBrief}
                  selectedConcept={concepts.find(c => c.id === selectedConceptId) || concepts[0]}
                  onImageGenerated={handleImageGenerated}
                  existingImages={referenceImages}
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleCompleteWorkflow}
                  className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Workflow
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}