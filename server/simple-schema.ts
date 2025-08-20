import { z } from "zod";

export const briefFormSchema = z.object({
  projectName: z.string().min(1),
  targetAudience: z.string().min(1),
  keyMessage: z.string().min(1),
  brandGuidelines: z.string().min(1),
  bannerSizes: z.string().min(1),
  brandContext: z.string().optional(),
  objective: z.string().optional(),
  consumerJourney: z.string().optional(),
  emotionalConnection: z.string().optional(),
  visualStyle: z.string().optional(),
  performanceMetrics: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type BriefFormData = z.infer<typeof briefFormSchema>;

export type Concept = {
  title: string;
  description: string;
  elements: {
    background: string;
    graphics: string;
    text: string;
    layout: string;
    typography: string;
    animation?: string;
  };
  midjourneyPrompts: {
    background: string;
    graphics: string;
    text: string;
  };
  rationale: {
    targetAudienceAppeal: string;
    brandAlignment: string;
    messagingStrategy: string;
    visualHierarchy: string;
  };
};
