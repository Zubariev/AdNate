import { pgTable, text, uuid, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // Import sql
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const briefs = pgTable("briefs", {
  id: uuid("id").primaryKey().defaultRandom(), // Changed to uuid and added defaultRandom()
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
});

export const concepts = pgTable("concepts", {
  id: uuid("id").primaryKey().defaultRandom(),
  briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(''), // Make optional with default
  elements: jsonb("elements").default({}), // Make optional with default
  midjourneyPrompts: jsonb("midjourney_prompts").default({}), // Make optional with default
  rationale: jsonb("rationale").default({}), // Make optional with default
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
export type Brief = typeof briefs.$inferSelect & { concepts?: Concept[] }; // Add optional concepts array
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type Concept = typeof concepts.$inferSelect;

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

export type RawConcept = {
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