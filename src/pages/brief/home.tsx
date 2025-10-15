import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clipboard, Loader2, Share } from "lucide-react";
import { useToast } from "../../hooks/use-toast.js";
import { useAuth } from "../../components/auth/AuthProvider.js";
import { AssetLibrary } from "../../components/ui/asset-library.js";
import { apiClient } from "../../lib/apiClient.js";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "../../components/ui/card.js";
import { Button } from "../../components/ui/button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../../components/ui/form.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion.js";
import * as z from 'zod'
import { KeywordSuggestions } from "../../components/ui/keyword-suggestions.js";
import { briefSuggestions } from "../../lib/brief-suggestions.js";
import { industryTemplates } from "../../lib/industry-templates.js";
import { briefFormSchema, Brief, Concept, RawConcept } from "../../shared/schema.js";

// Social Media Image Sizes
const imageSizes = {
  facebook: [
    { label: "Cover Photo", value: "851x315" },
    { label: "Feed Post", value: "1200x630" },
    { label: "Event Image", value: "1920x1005" },
    { label: "Fundraiser Image", value: "800x300" },
    { label: "Stories", value: "1080x1920" },
    { label: "Ad Image", value: "1080x1080" },
  ],
  twitter: [
    { label: "Card Image", value: "120x120" },
    { label: "Header Image", value: "1500x500" },
    { label: "In-stream Image", value: "1600x900" },
    { label: "Image Ad with App Buttons", value: "800x418" },
    { label: "Image Ad with App Buttons (Square)", value: "800x800" },
    { label: "Image Ad with Conversation Buttons", value: "800x418" },
    { label: "Image Ad with Polls", value: "800x418" },
    { label: "Image Ad with Polls (Square)", value: "800x800" },
    { label: "Image Ad with Website Buttons", value: "800x418" },
    { label: "Image Ad with Website Buttons (Square)", value: "800x800" },
    { label: "Standalone Image Ad", value: "1200x1200" },
    { label: "Standalone Image Ad (Landscape)", value: "1200x628" },
  ],
  linkedin: [
    { label: "Company Cover Photo", value: "1128x191" },
    { label: "Post and Link Image", value: "1200x627" },
    { label: "Life Tab Main Image", value: "1128x376" },
    { label: "Life Tab Custom Modules", value: "502x282" },
    { label: "Life Tab Company Photo", value: "900x600" },
    { label: "Horizontal/Landscape Image Ad", value: "1200x628" },
    { label: "Square Image Ad", value: "1200x1200" },
    { label: "Vertical Image Ad", value: "628x1200" },
    { label: "Vertical Image Ad (Alt 1)", value: "600x900" },
    { label: "Vertical Image Ad (Alt 2)", value: "720x900" },
  ],
  instagram: [
    { label: "Feed Post (Portrait)", value: "1080x1350" },
    { label: "Feed Post (Square)", value: "1080x1080" },
    { label: "Feed Post (Landscape)", value: "1080x566" },
    { label: "Story", value: "1080x1920" },
    { label: "Carousel (Landscape)", value: "1080x566" },
    { label: "Carousel (Square)", value: "1080x1080" },
    { label: "Carousel (Portrait)", value: "1080x1350" },
    { label: "Reels", value: "1080x1920" },
    { label: "Landscape Ad", value: "1080x566" },
    { label: "Square Ad", value: "1080x1080" },
  ],
  youtube: [
    { label: "Banner", value: "2048x1152" },
    { label: "Video (Recommended)", value: "1920x1080" },
    { label: "Shorts", value: "1080x1920" },
    { label: "Thumbnail", value: "1280x720" },
    { label: "Stories", value: "1080x1920" },
    { label: "In-stream Ad", value: "1920x1080" },
    { label: "In-feed Ad", value: "1280x720" },
    { label: "Bumper Ad", value: "1920x1080" },
    { label: "Display Ad (Small)", value: "300x60" },
    { label: "Overlay Ad (Landscape)", value: "1920x1080" },
    { label: "Overlay Ad (Portrait)", value: "1080x1920" },
    { label: "Overlay Ad (Square)", value: "1080x1080" },
  ],
  tiktok: [
    { label: "Video/Ad", value: "1080x1920" },
  ],
};

// Extended Brief type to include image generation status
interface ExtendedBrief extends Brief {
  imageGenerationStatus?: string;
  enhancedBrief?: Record<string, unknown>;
}


export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [generatedConcepts, setGeneratedConcepts] = useState<Concept[]>([]);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [conceptsCleared, setConceptsCleared] = useState(false);

  const { data: briefs = [], isLoading: isLoadingBriefs } = useQuery<Brief[]>({
    queryKey: ['briefs'],
    queryFn: async () => apiClient.get<Brief[]>("/briefs").then(res => res.data as Brief[] || []),
  });

  const { data: selectedBrief, isLoading: isLoadingSelectedBrief } = useQuery<ExtendedBrief>({
    queryKey: ['briefs', selectedBriefId],
    queryFn: async () => apiClient.get<Brief>(`/briefs/${selectedBriefId}`).then(res => res.data as Brief),
    enabled: !!selectedBriefId,
  });

  const { data: concepts, isLoading: isLoadingConcepts } = useQuery<Concept[]>({
      queryKey: ['concepts', selectedBriefId],
      queryFn: async () => apiClient.get<{ savedConcepts: Concept[] }>(`/briefs/${selectedBriefId}/concepts`).then(res => (res.data as { savedConcepts: Concept[] })?.savedConcepts || []),
      enabled: !!selectedBriefId && !!selectedBrief?.enhancedBrief,
  });

  useEffect(() => {
    if (!selectedBriefId && briefs.length > 0) {
      setSelectedBriefId(briefs[0].id);
    }
  }, [briefs, selectedBriefId]);

  // Reset concepts cleared flag when brief changes
  useEffect(() => {
    setConceptsCleared(false);
  }, [selectedBriefId]);
  
  useEffect(() => {
    if (concepts && !conceptsCleared) {
      setGeneratedConcepts(concepts);
    }
  }, [concepts, conceptsCleared]);

  // Clear concepts from UI when image generation is completed
  // Note: We no longer delete concepts from the database to preserve data integrity
  useEffect(() => {
    if (selectedBrief?.imageGenerationStatus === 'completed' && !conceptsCleared) {
      console.log('Image generation completed, clearing concepts from UI...');
      
      // Set flag to prevent repopulation
      setConceptsCleared(true);
      
      // Clear the concepts from UI to show a clean page for new briefs
      // Concepts remain in the database to maintain data integrity with element_images
      setGeneratedConcepts([]);
      setSelectedConceptIndex(null);
    }
  }, [selectedBrief?.imageGenerationStatus, selectedBriefId, conceptsCleared]);

  const form = useForm<z.infer<typeof briefFormSchema>>({
    resolver: zodResolver(briefFormSchema),
    defaultValues: {
      projectName: "",
      targetAudience: "",
      keyMessage: "",
      brandGuidelines: "",
      bannerSizes: "",
      brandContext: "",
      objective: "",
      consumerJourney: "",
      emotionalConnection: "",
      visualStyle: "",
      performanceMetrics: "",
    }
  });
  
  const createBriefMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof briefFormSchema>) => {
      const response = await apiClient.post<Brief>("/briefs", formData);
      if (response.error) throw new Error(response.error);
      return response.data as Brief;
    },
    onSuccess: (data: Brief) => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      setSelectedBriefId(data.id);
      // Navigate to loading page for enhancement and concept generation
      navigate(`/brief/loading?briefId=${data.id}&type=concepts`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard"
    });
  };

  const shareMutation = useMutation({
    mutationFn: async (briefId: string): Promise<{ shareUrl: string }> => {
      const response = await apiClient.post(`/api/briefs/${briefId}/share`, {});
      if (response.error) {
        throw new Error(response.error || 'Failed to share brief');
      }
      return response.data as { shareUrl: string };
    },
    onSuccess: (data: { shareUrl: string }) => {
      const shareUrl = `${window.location.origin}${data.shareUrl}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share Link Copied!",
        description: "The share link has been copied to your clipboard"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveConcept = async (concept: Concept) => {
    if (!selectedBriefId) {
      toast({
        title: "Error",
        description: "No brief selected",
        variant: "destructive"
      });
      return;
    }

    if (selectedConceptIndex === null) {
      toast({
        title: "Error",
        description: "Please select a concept first",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post(`/briefs/${selectedBriefId}/select-concept`, { conceptId: concept.id });
      
      // Check for errors in the response
      if (response.error || response.status >= 400) {
        throw new Error(response.error || 'Failed to save selected concept');
      }
      
      // Store briefId and conceptId for the loading page
      localStorage.setItem('selectedBriefId', selectedBriefId);
      localStorage.setItem('selectedConceptId', concept.id);
      
      toast({
        title: "Concept Selected!",
        description: `"${concept.title}" has been selected successfully`
      });
      
      // Navigate with query params for better reliability
      // Add type=images to indicate we're generating images, not concepts
      navigate(`/brief/loading?briefId=${selectedBriefId}&conceptId=${concept.id}&type=images`);
    } catch (error) {
      console.error('Error saving selected concept:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save selected concept",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBriefs || isLoadingSelectedBrief || isLoadingConcepts) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
        <div className="flex-grow justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Creative Brief
            </h1>
            <p className="text-gray-300">
              Generate concepts from your marketing requirements
            </p>
            {user && (
              <p className="text-sm text-purple-300">
                Welcome, {user.email}!
              </p>
            )}
          </div>
          <Card className="text-blue-500 bg-clip-text to-pink-400 border-0 om-purple-400 bobg-gradient-to-r">
              <CardHeader>
                <CardTitle>Brief Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-12">
                  <Select onValueChange={(industry) => {
                    const template = industryTemplates[industry as keyof typeof industryTemplates];
                    form.reset(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(industryTemplates).map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="product">Product Launch</SelectItem>
                      <SelectItem value="brand">Brand Awareness</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
        </div>

        <Card className="text-white border-0 backdrop-blur-lg bg-white/10">
          <CardHeader>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Prevent any auto-submission - only allow manual button clicks
                }}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Describe your target audience's demographics, psychographics, and behaviors"
                          {...field}
                        />
                      </FormControl>
                      <KeywordSuggestions
                        keywords={briefSuggestions.targetAudience}
                        onSelect={(keyword) => {
                          field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keyMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Message</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="What's the main message and supporting points?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandGuidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Guidelines</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Brand colors, tone, style guidelines, and visual requirements"
                          {...field}
                        />
                      </FormControl>
                      <div className="space-y-2">
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Colors:</p>
                          <KeywordSuggestions
                            keywords={briefSuggestions.brandGuidelines.colors}
                            onSelect={(keyword) => {
                              field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                            }}
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Typography:</p>
                          <KeywordSuggestions
                            keywords={briefSuggestions.brandGuidelines.typography}
                            onSelect={(keyword) => {
                              field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                            }}
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Style:</p>
                          <KeywordSuggestions
                            keywords={briefSuggestions.brandGuidelines.style}
                            onSelect={(keyword) => {
                              field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                            }}
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannerSizes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-white border-0 bg-white/10 focus-visible:ring-purple-400">
                            <SelectValue placeholder="Select a social media image size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[400px]">
                          <div className="px-2 py-1.5 text-sm font-semibold text-purple-400">Facebook</div>
                          {imageSizes.facebook.map((size) => (
                            <SelectItem key={`facebook-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                          
                          <div className="px-2 py-1.5 mt-2 text-sm font-semibold text-purple-400">Twitter</div>
                          {imageSizes.twitter.map((size) => (
                            <SelectItem key={`twitter-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                          
                          <div className="px-2 py-1.5 mt-2 text-sm font-semibold text-purple-400">LinkedIn</div>
                          {imageSizes.linkedin.map((size) => (
                            <SelectItem key={`linkedin-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                          
                          <div className="px-2 py-1.5 mt-2 text-sm font-semibold text-purple-400">Instagram</div>
                          {imageSizes.instagram.map((size) => (
                            <SelectItem key={`instagram-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                          
                          <div className="px-2 py-1.5 mt-2 text-sm font-semibold text-purple-400">YouTube</div>
                          {imageSizes.youtube.map((size) => (
                            <SelectItem key={`youtube-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                          
                          <div className="px-2 py-1.5 mt-2 text-sm font-semibold text-purple-400">TikTok</div>
                          {imageSizes.tiktok.map((size) => (
                            <SelectItem key={`tiktok-${size.value}`} value={size.value}>
                              {size.label} - {size.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Context</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Brand's background, values, and market position"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Objective</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Specific goals and desired outcomes of the campaign"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consumerJourney"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer Journey Stage</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Where does this fit in the customer journey?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emotionalConnection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotional Connection</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Desired emotional response and psychological impact"
                          {...field}
                        />
                      </FormControl>
                      <KeywordSuggestions
                        keywords={briefSuggestions.emotionalConnection}
                        onSelect={(keyword) => {
                          field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visualStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Visual Style</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="Specific visual direction, references, and style preferences"
                          {...field}
                        />
                      </FormControl>
                      <KeywordSuggestions
                        keywords={briefSuggestions.visualStyle}
                        onSelect={(keyword) => {
                          field.onChange(field.value ? `${field.value}, ${keyword}` : keyword);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="performanceMetrics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance Metrics</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Textarea
                          placeholder="How will success be measured?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Moved AssetLibrary here and wrapped the remaining content in a div */}
        <div className="space-y-8">
          <AssetLibrary />
          <div className="flex justify-center">
            <Button 
              type="button" 
              disabled={createBriefMutation.isPending}
              className="px-8 py-3 text-lg bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit((data) => {
                  createBriefMutation.mutate(data);
                })();
              }}
            >
              {createBriefMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Creating Brief...
                </>
              ) : (
                'Create Concepts'
              )}
            </Button>
          </div>
          
          {generatedConcepts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Generated Concepts
              </h2>
              <p className="text-gray-300">
                Detailed banner concepts with design rationale. Click on a concept to select it, then use the "Save and Continue" button to proceed.
              </p>
            </div>
          )}
          
          {generatedConcepts.map((concept, index) => (
            <Card 
              key={concept.id || index} 
              className={`backdrop-blur-sm bg-white/5 cursor-pointer transition-all duration-200 ${
                selectedConceptIndex === index 
                  ? 'border-2 border-purple-400 shadow-lg shadow-purple-400/20' 
                  : 'border-purple-400/20 hover:border-purple-400/40'
              }`}
              onClick={() => setSelectedConceptIndex(selectedConceptIndex === index ? null : index)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className={`text-xl text-transparent bg-clip-text bg-gradient-to-r ${
                      selectedConceptIndex === index 
                        ? 'from-purple-200 to-pink-200' 
                        : 'from-purple-300 to-pink-300'
                    } text-gradient`}>
                      {concept.title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-300">
                      {concept.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      selectedConceptIndex === index
                        ? 'text-purple-100 bg-purple-500/40 border border-purple-400'
                        : 'text-purple-300 bg-purple-400/20'
                    }`}>
                      Concept {index + 1}
                      {selectedConceptIndex === index && (
                        <span className="ml-1 text-purple-200">✓</span>
                      )}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="elements">
                    <AccordionTrigger>Visual Elements</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-purple-400">Background</h4>
                            <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.background}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-400">Graphics</h4>
                            <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.graphics}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-400">Text Content</h4>
                            <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.text}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-pink-400">Layout</h4>
                            <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.layout}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-pink-400">Typography</h4>
                            <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.typography}</p>
                          </div>
                          {typeof (concept.elements as RawConcept['elements'])?.animation === 'string' && (
                            <div>
                              <h4 className="font-medium text-pink-400">Animation</h4>
                              <p className="text-sm text-muted-foreground">{(concept.elements as RawConcept['elements'])?.animation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="rationale">
                    <AccordionTrigger>Design Rationale</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-blue-400">Target Audience Appeal</h4>
                            <p className="text-sm text-muted-foreground">{(concept.rationale as RawConcept['rationale'])?.targetAudienceAppeal}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-400">Brand Alignment</h4>
                            <p className="text-sm text-muted-foreground">{(concept.rationale as RawConcept['rationale'])?.brandAlignment}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-green-400">Messaging Strategy</h4>
                            <p className="text-sm text-muted-foreground">{(concept.rationale as RawConcept['rationale'])?.messagingStrategy}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-400">Visual Hierarchy</h4>
                            <p className="text-sm text-muted-foreground">{(concept.rationale as RawConcept['rationale'])?.visualHierarchy}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="prompts">
                    <AccordionTrigger>Description of the concept</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {Object.entries(concept.midjourneyPrompts as RawConcept['midjourneyPrompts']).map(([key, prompt]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-orange-400 capitalize">{key}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(prompt as string)}
                                className="hover:bg-purple-400/20"
                              >
                                <Clipboard className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="p-3 font-mono text-sm rounded text-muted-foreground bg-slate-800/50">{prompt as string}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="flex justify-between items-center pt-4 mt-6 border-t border-purple-400/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-300 border-purple-400/50 hover:bg-purple-400/20"
                    onClick={() => selectedBriefId && shareMutation.mutate(selectedBriefId)}
                    disabled={shareMutation.isPending || !selectedBriefId}
                  >
                    {shareMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share className="mr-2 w-4 h-4" />
                    )}
                    Share Brief
                  </Button>
                </div>
              </CardContent>
              {selectedConceptIndex === index && (
                <CardFooter>
                  <Button 
                    onClick={() => handleSaveConcept(concept)}
                    disabled={isSaving}
                    className="mt-4 w-full bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Select and Continue'
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
    </div>
  );
}