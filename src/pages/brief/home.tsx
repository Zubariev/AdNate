import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, Loader2, Share } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { AssetLibrary } from "../../components/ui/asset-library";
import { PreviewMode } from "../../components/ui/preview-mode";
import { apiRequest } from "../../lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import * as z from 'zod'
import { KeywordSuggestions } from "../../components/ui/keyword-suggestions";
import { briefSuggestions } from "../../lib/brief-suggestions";
import { industryTemplates } from "../../lib/industry-templates";
import { briefFormSchema, type Brief, type Concept } from "../../shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
  const [generatedConcepts, setGeneratedConcepts] = useState<Concept[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
      concepts: [] as any
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData: z.infer<typeof briefFormSchema>) => {
      console.log('Submitting form data:', formData);
      const response = await apiRequest("POST", "/api/briefs", formData);
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    },
    onSuccess: (data: Brief) => {
      console.log('Success data:', data);
      if (data.concepts && Array.isArray(data.concepts)) {
        setGeneratedConcepts(data.concepts);
        setSelectedBriefId(data.id);
        toast({
          title: "Success",
          description: "Creative brief generated successfully!"
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid response format from server",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Creative Brief
            </h1>
            <p className="text-gray-300">
              Generate concepts from your marketing requirements
            </p>
          </div>
          <Card>
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
                      <SelectValue placeholder="Select industry" />
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
                      <SelectValue placeholder="Select category" />
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

        <Card className="text-white border-0 bg-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Create New Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
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
                      <FormLabel>Visual Style</FormLabel>
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

                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
                >
                  {mutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Generate Concepts
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AssetLibrary />
          {generatedConcepts.map((concept, index) => (
            <React.Fragment key={index}>
              <PreviewMode 
                concept={concept}
                bannerSizes={form.getValues("bannerSizes").split(",").map(s => s.trim())}
              />
              <Card>
              <CardHeader>
                <CardTitle>{concept.title}</CardTitle>
                <CardDescription>{concept.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="elements">
                    <AccordionTrigger>Visual Elements</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Background</h4>
                          <p className="text-sm text-muted-foreground">{concept.elements.background}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Graphics</h4>
                          <p className="text-sm text-muted-foreground">{concept.elements.graphics}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Text</h4>
                          <p className="text-sm text-muted-foreground">{concept.elements.text}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="prompts">
                    <AccordionTrigger>Midjourney Prompts</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {Object.entries(concept.midjourneyPrompts).map(([key, prompt]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium capitalize">{key}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(prompt)}
                              >
                                <Clipboard className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => selectedBriefId && shareMutation.mutate(selectedBriefId)}
                  disabled={shareMutation.isPending || !selectedBriefId}
                >
                  {shareMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share className="w-4 h-4 mr-2" />
                  )}
                  Share Brief
                </Button>
              </CardContent>
            </Card>
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Save as Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const templates = JSON.parse(localStorage.getItem('briefTemplates') || '[]');
                    templates.push(form.getValues());
                    localStorage.setItem('briefTemplates', JSON.stringify(templates));
                    toast({
                      title: "Template Saved",
                      description: "Your brief has been saved as a template"
                    });
                  }}
                >
                  Save Current Brief
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}