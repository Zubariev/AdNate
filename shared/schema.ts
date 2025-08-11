import { pgTable, text, serial, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const briefs = pgTable("briefs", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  targetAudience: text("target_audience").notNull(),
  keyMessage: text("key_message").notNull(),
  brandGuidelines: text("brand_guidelines").notNull(),
  bannerSizes: text("banner_sizes").notNull(),
  brandContext: text("brand_context"),
  objective: text("objective"),
  consumerJourney: text("consumer_journey"),
  emotionalConnection: text("emotional_connection"),
  visualStyle: text("visual_style"),
  performanceMetrics: text("performance_metrics"),
  shareId: text("share_id"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  concepts: jsonb("concepts").notNull()
});

export const insertBriefSchema = createInsertSchema(briefs).pick({
  projectName: true,
  targetAudience: true,
  keyMessage: true,
  brandGuidelines: true,
  bannerSizes: true,
  brandContext: true,
  objective: true,
  consumerJourney: true,
  emotionalConnection: true,
  visualStyle: true,
  performanceMetrics: true,
  shareId: true,
  isPublic: true,
  concepts: true
});

export type InsertBrief = z.infer<typeof insertBriefSchema>;
export type Brief = typeof briefs.$inferSelect;

export const briefFormSchema = z.object({
  projectName: z.string().min(1),
  targetAudience: z.string().min(1),
  keyMessage: z.string().min(1),
  brandGuidelines: z.string().min(1),
  bannerSizes: z.string().min(1),
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