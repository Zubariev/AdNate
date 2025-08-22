import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, Loader2, Share } from "lucide-react";
import { useToast } from "../../hooks/use-toast.js";
import { AssetLibrary } from "../../components/ui/asset-library.js";
import { insertConcept } from "../../lib/supabase.js";
import { insertBrief } from "../../lib/supabase.js";
import { apiRequest } from "../../lib/queryClient.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { briefFormSchema, type Brief, type Concept } from "../../shared/schema.js";

export default function Home() {
  const { toast } = useToast();
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
  const [generatedConcepts, setGeneratedConcepts] = useState<Concept[]>([]);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState<number | null>(null);
  // const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Query to fetch briefs
  const { data: briefs = [], isLoading: isLoadingBriefs } = useQuery<Brief[]>({
    queryKey: ['/api/briefs'],
  });

  // Update concepts when briefs change or on initial load
  useEffect(() => {
    if (briefs.length > 0) {
      const lastBrief = briefs[briefs.length - 1];
      if (lastBrief?.concepts) {
        setGeneratedConcepts(lastBrief.concepts as Concept[]);
        setSelectedBriefId(lastBrief.id);
      }
    }
  }, [briefs]);

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
      concepts: []
    }
  });

  // Add this to debug form state
  useEffect(() => {
    console.log('Form state:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      values: form.getValues()
    });
  }, [form.formState, form]);

  const mutation = useMutation({
    mutationFn: async (formData: z.infer<typeof briefFormSchema>) => {
      console.log('Starting mutation with data:', formData);
      try {
        const response = await apiRequest("POST", "/api/briefs", formData);
        console.log('Raw response:', response);
        const data = await response.json();
        console.log('Parsed response data:', data);
        return data;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data: Brief) => {
      console.log('Mutation success:', data);
      if (data.concepts && Array.isArray(data.concepts)) {
        setGeneratedConcepts(data.concepts);
        setSelectedBriefId(data.id);
        toast({
          title: "Success",
          description: "Creative brief generated successfully!"
        });
      }
    },
    onError: (error: Error) => {
      console.error('Mutation error in onError:', error);
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
    mutationFn: async (briefId: number) => {
      const response = await apiRequest("POST", `/api/briefs/${briefId}/share`);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
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

  if (isLoadingBriefs) {
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
                      <FormLabel>Banner Sizes</FormLabel>
                      <FormControl className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-purple-400">
                        <Input placeholder="e.g. 728x90, 300x250, 160x600" {...field} />
                      </FormControl>
                      <KeywordSuggestions
                        keywords={briefSuggestions.bannerSizes}
                        onSelect={(keyword) => {
                          const size = keyword.split(" ")[0]; // Extract just the dimensions
                          field.onChange(field.value ? `${field.value}, ${size}` : size);
                        }}
                      />
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

        <div className="space-y-8">
          <AssetLibrary />
          
          <div className="flex justify-center">
            <Button 
              type="button" 
              disabled={mutation.isPending}
              className="px-8 py-3 text-lg bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
              onClick={(e) => {
                e.preventDefault();
                console.log('Generate Concepts button clicked');
                form.handleSubmit((data) => {
                  console.log('Form data:', data);
                  mutation.mutate(data);
                })();
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Concepts'
              )}
            </Button>
          </div>
          
          {generatedConcepts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Generated Concepts
              </h2>
              <p className="text-gray-300">
                Detailed banner concepts with design rationale. Select the one you like and click continue.
              </p>
            </div>
          )}
          
          {generatedConcepts.map((concept, index) => (
            <Card 
              key={index} 
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
                            <p className="text-sm text-muted-foreground">{concept.elements.background}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-400">Graphics</h4>
                            <p className="text-sm text-muted-foreground">{concept.elements.graphics}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-400">Text Content</h4>
                            <p className="text-sm text-muted-foreground">{concept.elements.text}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-pink-400">Layout</h4>
                            <p className="text-sm text-muted-foreground">{concept.elements.layout}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-pink-400">Typography</h4>
                            <p className="text-sm text-muted-foreground">{concept.elements.typography}</p>
                          </div>
                          {concept.elements.animation && (
                            <div>
                              <h4 className="font-medium text-pink-400">Animation</h4>
                              <p className="text-sm text-muted-foreground">{concept.elements.animation}</p>
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
                            <p className="text-sm text-muted-foreground">{concept.rationale.targetAudienceAppeal}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-400">Brand Alignment</h4>
                            <p className="text-sm text-muted-foreground">{concept.rationale.brandAlignment}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-green-400">Messaging Strategy</h4>
                            <p className="text-sm text-muted-foreground">{concept.rationale.messagingStrategy}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-400">Visual Hierarchy</h4>
                            <p className="text-sm text-muted-foreground">{concept.rationale.visualHierarchy}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="prompts">
                    <AccordionTrigger>Description of the concept</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {Object.entries(concept.midjourneyPrompts).map(([key, prompt]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-orange-400 capitalize">{key}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(prompt)}
                                className="hover:bg-purple-400/20"
                              >
                                <Clipboard className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="p-3 font-mono text-sm rounded text-muted-foreground bg-slate-800/50">{prompt}</p>
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
              <Button onClick={() => insertConcept(selectedBriefId, concept), insertBrief(selectedBriefId, brief)}>
                Save and Continue
              </Button>
            </Card>
          ))}
        </div>
    </div>
  );
}