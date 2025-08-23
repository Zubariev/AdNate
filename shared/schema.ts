import { pgTable, text, uuid, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // Import sql
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const briefs = pgTable("briefs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Changed to uuid and added defaultRandom()
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
  shareId: text("share_id").default(sql`gen_random_uuid()`).notNull().unique(), // Changed to use UUID and make it unique
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Add updatedAt
});

export const concepts = pgTable("concepts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Changed to uuid and added defaultRandom()
  briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  elements: jsonb("elements"),
  midjourneyPrompts: jsonb("midjourney_prompts"),
  rationale: jsonb("rationale"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
});

export const insertConceptSchema = createInsertSchema(concepts).pick({
  briefId: true,
  title: true,
  description: true,
  elements: true,
  midjourneyPrompts: true,
  rationale: true,
});

export type InsertBrief = z.infer<typeof insertBriefSchema>;
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type NewBrief = InsertBrief;
export type Brief = typeof briefs.$inferSelect & { concepts?: Concept[] };
export type Concept = typeof concepts.$inferSelect;

export const briefFormSchema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters"),
  targetAudience: z.string().min(5, "Target audience description required"),
  keyMessage: z.string().min(10, "Key message must be at least 10 characters"),
  brandGuidelines: z.string().min(10, "Brand guidelines required"),
  bannerSizes: z.string().min(3, "At least one banner size required"),
  brandContext: z.string().optional(),
  objective: z.string().optional(),
  consumerJourney: z.string().optional(),
  emotionalConnection: z.string().optional(),
  visualStyle: z.string().optional(),
  performanceMetrics: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type BriefFormData = z.infer<typeof briefFormSchema>;

export type RawConcept = {
  title: string;
  description?: string; // Make description optional
  elements: {
    background?: string; // Make elements optional
    graphics?: string;
    text?: string;
    layout?: string;
    typography?: string;
    animation?: string;
  };
  midjourneyPrompts: {
    background?: string; // Make prompts optional
    graphics?: string;
    text?: string;
  };
  rationale: {
    targetAudienceAppeal?: string; // Make rationale optional
    brandAlignment?: string;
    messagingStrategy?: string;
    visualHierarchy?: string;
  };
  // Add shareId and isPublic to RawConcept if generateConcepts can return them
  shareId?: string;
  isPublic?: boolean;
};
