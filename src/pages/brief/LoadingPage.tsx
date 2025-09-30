import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../hooks/use-toast";

// Define a simple animation data type and use a placeholder
// The actual animation will be loaded at runtime
const animationData1 = { 
  v: "5.7.4", 
  fr: 30, 
  ip: 0, 
  op: 60, 
  w: 512, 
  h: 512, 
  nm: "Loading Animation",
  layers: [] 
};
// Define interface for reference image
interface ReferenceImage {
  id: string;
  imageUrl: string;
  imagePath?: string;
  fileName?: string;
  briefId: string;
  conceptId: string;
  userId: string;
  promptUsed: string;
  createdAt?: Date;
}

// Define interface for concepts
interface Concept {
  id: string;
  briefId: string;
  title: string;
  description: string;
  // other fields as needed
}

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
  const [loadingType, setLoadingType] = useState<"concepts" | "images">("concepts"); // Default to concepts loading

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
    
    // Check what type of loading we're doing (concepts or images)
    const type = searchParams.get('type');
    if (type === 'concepts' || type === 'images') {
      setLoadingType(type);
    }
    
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
      if (loadingType === "concepts") {
        generateConceptsAndPoll(briefId);
      } else {
        generateImagesAndPoll(briefId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, toast, loadingType]);

  const pollImageStatus = (briefId: string) => {
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const statusResponse = await apiClient.get<{ status: string }>(`/briefs/${briefId}/image-generation-status`);
        // Check if data exists and handle both string and object response formats
        const data = statusResponse.data;
        if (!data) {
          throw new Error('No status data received');
        }

        const status = typeof data === 'string' ? data : data.status;
        
        if (status === 'completed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          toast({
            title: 'Success!',
            description: 'All ad elements have been generated.',
          });
          setTimeout(() => navigate('/editor'), 3000);
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

  const pollConceptsStatus = (briefId: string) => {
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        // Get the list of concepts for this brief
        const conceptsResponse = await apiClient.get<{briefId: string; savedConcepts: Concept[]; count: number}>(`/briefs/${briefId}/concepts`);
        
        // Check if data exists and handle both string and object response formats
        const data = conceptsResponse.data;
        if (!data) {
          throw new Error('No concepts data received');
        }
        
        const concepts = typeof data === 'string' ? [] : (data.savedConcepts || []);
        
        // Check if we have the expected number of concepts (3)
        if (concepts.length >= 3) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          toast({
            title: 'Success!',
            description: 'All concepts have been generated successfully.',
          });
          
          // Redirect to brief page with the anchor to scroll to concepts section
          setTimeout(() => navigate(`/brief?briefId=${briefId}#concepts`), 1000);
        }
        // If we don't have 3 concepts yet, continue polling
      } catch (error) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        console.error('Error polling for concepts:', error);
        toast({
          title: 'Error',
          description: 'Could not check the status of concept generation.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/brief'), 3000);
      }
    }, 5000); // Poll every 5 seconds
  };

  const generateConceptsAndPoll = async (briefId: string) => {
    setIsGenerating(true);
    try {
      // Start the concept generation process
      const enhanceResponse = await apiClient.post(`/briefs/${briefId}/enhance`, {});
      if (!enhanceResponse.data) {
        throw new Error('Failed to enhance brief for concept generation');
      }
      
      // Display a toast notification
      toast({
        title: 'Processing...',
        description: 'Your brief is being analyzed. Generating creative concepts...',
      });
      
      // Start polling for concepts
      pollConceptsStatus(briefId);
      
    } catch (error) {
      console.error('Error during concept generation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start the concept generation process',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/brief'), 3000);
      setIsGenerating(false);
    }
    // No setIsGenerating(false) here because we are now in the polling phase
  };

  const generateImagesAndPoll = async (briefId: string) => {
    setIsGenerating(true);
    try {
      // Step 1: Check if concept is selected
      const selectedConceptResponse = await apiClient.get<{conceptId: string; briefId: string}>(`/briefs/${briefId}/selected-concept`);
      if (!selectedConceptResponse.data || typeof selectedConceptResponse.data === 'string') {
        throw new Error('No concept selected for this brief');
      }
      
      // Step 2: Generate reference image
      const imageResponse = await apiClient.post<ReferenceImage>(`/briefs/${briefId}/generate-reference-image`, {});
      if (!imageResponse.data) {
        throw new Error('Failed to generate and save reference image record');
      }
      
      // Parse response data properly
      const newReferenceImage = typeof imageResponse.data === 'string' 
        ? JSON.parse(imageResponse.data) as ReferenceImage 
        : imageResponse.data;
      
      if (!newReferenceImage.id) {
        throw new Error('Reference image record has no ID');
      }

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
      pollImageStatus(briefId);
      
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

      {/* Loading type title */}
      <h2 className="text-xl font-semibold text-purple-300 mb-2">
        {loadingType === "concepts" ? "Generating Creative Concepts" : "Creating Ad Elements"}
      </h2>

      {/* Phrase */}
      <p className="px-4 mt-2 max-w-md text-lg text-center text-gray-300 transition-opacity duration-500">
        {phrases[index]}
      </p>

      {/* Subtitle with expected time */}
      <p className="text-sm text-gray-400 mt-6">
        {loadingType === "concepts" 
          ? "This may take 30-60 seconds. Analyzing your brief and generating 3 unique concepts..." 
          : "This may take 2-3 minutes. Creating each element with perfect transparency..."}
      </p>
    </div>
  );
}
