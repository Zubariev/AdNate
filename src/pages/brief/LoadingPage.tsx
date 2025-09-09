import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import animationData1 from "../../../public/animations/loading-animation-2.json";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../hooks/use-toast";

const animations = [animationData1];

const phrases: string[] = [
"Another call with the marketing director…",
"Junior designer forgot to save the file…",
"Re-exporting in the correct dimensions…",
"Fixing fonts nobody owns…",
"Adding the logo… bigger.", 
"Waiting for feedback from 12 stakeholders…",
"Starting from scratch (again)...",
"Polishing pixels you’ll never notice…",
"Manifesting moodboards…",
"Curating the perfect color palette…",
"Brewing inspiration from Pinterest…",
"Reticulating gradients…",
"Summoning bold typography…",
"Rendering your genius idea…",
"Rehearsing pitches in the mirror…",
"Teaching AI how to art-direct…",
"Outsourcing creativity to the cloud…",
"Bribing the algorithm with coffee…",
"Running last-minute brainstorm…",
"Making the banner pop!",
"Pretending deadlines don’t exist…"
];

export default function LoadingScreen() {
  const [index, setIndex] = useState<number>(0);
  const [animationIndex, setAnimationIndex] = useState<number>(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
      setAnimationIndex((prev) => (prev + 1) % animations.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get briefId from URL or localStorage
    const briefId = searchParams.get('briefId') || localStorage.getItem('selectedBriefId');
    
    if (!briefId) {
      toast({
        title: 'Error',
        description: 'No brief selected. Redirecting to home...',
        variant: 'destructive',
      });
      navigate('/brief');
      return;
    }

    if (!isGenerating) {
      generateReferenceImage(briefId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, toast]);

  const generateReferenceImage = async (briefId: string) => {
    setIsGenerating(true);
    try {
      // Check if concept is selected
      const selectedConceptResponse = await apiClient.get<{conceptId: string; briefId: string}>(`/briefs/${briefId}/selected-concept`);
      if (!selectedConceptResponse.data || typeof selectedConceptResponse.data === 'string') {
        throw new Error('No concept selected for this brief');
      }
      
      // Generate reference image
      const imageResponse = await apiClient.post<{url: string; prompt: string}>(`/briefs/${briefId}/generate-reference-image`, {});
      
      if (!imageResponse.data || typeof imageResponse.data === 'string' || !imageResponse.data.url) {
        throw new Error('Failed to generate reference image');
      }
      
      // Store reference image in Supabase bucket
      const storeResponse = await apiClient.post<{path: string}>(`/briefs/${briefId}/store-reference-image`, {
        conceptId: selectedConceptResponse.data.conceptId,
        referenceImage: imageResponse.data.url
      });
      
      if (!storeResponse.data || typeof storeResponse.data === 'string' || !storeResponse.data.path) {
        throw new Error('Failed to store reference image');
      }

      // Generate element specifications
      const specResponse = await apiClient.post(`/briefs/${briefId}/generate-element-specifications`, {
        conceptId: selectedConceptResponse.data.conceptId,
      });

      if (!specResponse.data) {
        throw new Error('Failed to generate element specifications');
      }
      
      // Success - redirect back to brief page
      toast({
        title: 'Success!',
        description: 'Reference image has been generated and stored',
      });
      
      setTimeout(() => {
        navigate('/brief');
      }, 1500);
      
    } catch (error) {
      console.error('Error generating reference image:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate reference image',
        variant: 'destructive',
      });
      
      // Redirect back after delay
      setTimeout(() => {
        navigate('/brief');
      }, 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white bg-gray-900">
      <h1 className="mb-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        AdNate
      </h1>
      <div className="w-64 h-64">
        <Lottie 
          animationData={animations[animationIndex]} 
          loop={true} 
        />
      </div>

      {/* Phrase */}
      <p className="px-4 mt-4 max-w-md text-lg text-center text-gray-300 transition-opacity duration-500">
        {phrases[index]}
      </p>
    </div>
  );
}
