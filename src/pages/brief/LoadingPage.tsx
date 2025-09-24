import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import animationData1 from "../../../public/animations/loading-animation-2.json";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../hooks/use-toast";
import { ReferenceImage } from "../../types/reference-image";

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
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
      setAnimationIndex((prev) => (prev + 1) % animations.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup polling on component unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
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
      generateAndPoll(briefId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, toast]);

  const pollStatus = (briefId: string) => {
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const statusResponse = await apiClient.get<{ status: string }>(`/briefs/${briefId}/image-generation-status`);
        const status = statusResponse.data.status;

        if (status === 'completed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          toast({
            title: 'Success!',
            description: 'All ad elements have been generated.',
          });
          setTimeout(() => navigate('/brief'), 1500);
        } else if (status === 'failed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          toast({
            title: 'Generation Failed',
            description: 'Something went wrong while generating the ad elements. Please try again.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/brief'), 3000);
        }
        // If 'processing' or 'pending', do nothing and let the polling continue.
      } catch (error) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        console.error('Error polling for status:', error);
        toast({
          title: 'Error',
          description: 'Could not check the status of the image generation.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/brief'), 3000);
      }
    }, 5000); // Poll every 5 seconds
  };

  const generateAndPoll = async (briefId: string) => {
    setIsGenerating(true);
    try {
      // Step 1: Check if concept is selected
      const selectedConceptResponse = await apiClient.get<{conceptId: string; briefId: string}>(`/briefs/${briefId}/selected-concept`);
      if (!selectedConceptResponse.data || typeof selectedConceptResponse.data === 'string') {
        throw new Error('No concept selected for this brief');
      }
      
      // Step 2: Generate reference image
      const imageResponse = await apiClient.post<ReferenceImage>(`/briefs/${briefId}/generate-reference-image`, {});
      if (!imageResponse.data || !imageResponse.data.id) {
        throw new Error('Failed to generate and save reference image record');
      }
      const newReferenceImage = imageResponse.data;

      // Step 3: Generate element specifications (which also triggers the background processing)
      const specResponse = await apiClient.post(`/briefs/${briefId}/generate-element-specifications`, {
        conceptId: selectedConceptResponse.data.conceptId,
        referenceImageId: newReferenceImage.id
      });

      if (!specResponse.data) {
        throw new Error('Failed to generate element specifications');
      }
      
      // Step 4: Start polling for completion status
      toast({
        title: 'Processing...',
        description: 'Reference image generated. Now creating individual ad elements in the background. This may take a few minutes.',
      });
      pollStatus(briefId);
      
    } catch (error) {
      console.error('Error during initial generation steps:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start the generation process',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/brief'), 3000);
      setIsGenerating(false);
    }
    // No setIsGenerating(false) here because we are now in the polling phase
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
