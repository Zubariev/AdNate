import { pgTable, text, uuid, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // Import sql
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const briefs = pgTable("briefs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Changed to uuid and added defaultRandom()
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectName: text("projectname"),
  targetAudience: text("targetaudience"),
  keyMessage: text("keymessage"),
  brandGuidelines: text("brandguidelines"),
  bannerSizes: text("bannersizes"),
  brandContext: text("brandcontext"),
  objective: text("objective"),
  consumerJourney: text("consumerjourney"),
  emotionalConnection: text("emotionalconnection"),
  visualStyle: text("visualstyle"),
  performanceMetrics: text("performancemetrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  enhancedBrief: jsonb("enhanced_brief"),
  enhancedBriefUpdatedAt: timestamp("enhanced_brief_updated_at"),
  imageGenerationStatus: text("image_generation_status").default("pending"),
  errorMessage: text("error_message"),
});

export const users = pgTable("users", { // Define a minimal users table for reference
  id: uuid("id").primaryKey(),
});

export const concepts = pgTable("concepts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Changed to uuid and added defaultRandom()
  briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  elements: jsonb("elements").default(sql`'{}'::jsonb`), // Added default value
  midjourneyPrompts: jsonb("midjourney_prompts").default(sql`'{}'::jsonb`), // Changed column name and added default
  rationale: jsonb("rationale").default(sql`'{}'::jsonb`), // Added default value
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectedConcepts = pgTable("selected_concepts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Changed to uuid and added defaultRandom()
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
  briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }), // Link to the original brief
  selectedAt: timestamp("selected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const elementSpecifications = pgTable("element_specifications", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
    referenceImageId: uuid("reference_image_id"),
    specificationData: jsonb("specification_data").notNull(),
    aiModelUsed: text("ai_model_used").default("gemini-2.5-pro"),
    promptUsed: text("prompt_used").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const referenceImages = pgTable("reference_images", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    imagePath: text("image_path"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    imageData: jsonb("image_data"),
    promptUsed: text("prompt_used").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const elementImages = pgTable("element_images", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
    elementId: text("element_id").notNull(),
    imageUrl: text("image_url").notNull(),
    imagePath: text("image_path"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    imageData: jsonb("image_data"),
    promptUsed: text("prompt_used").notNull(),
    imageType: text("image_type").notNull(), // 'original' or 'transparent'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
  userId: true,
  enhancedBrief: true,
  enhancedBriefUpdatedAt: true,
});

export const insertConceptSchema = createInsertSchema(concepts).pick({
  briefId: true,
  title: true,
  description: true,
  elements: true,
  midjourneyPrompts: true,
  rationale: true,
});

export const insertSelectedConceptSchema = createInsertSchema(selectedConcepts).pick({
  conceptId: true,
  briefId: true,
  userId: true,
});

export const insertElementSpecificationSchema = createInsertSchema(elementSpecifications);

export const insertReferenceImageSchema = createInsertSchema(referenceImages);

export const insertElementImageSchema = createInsertSchema(elementImages);

export type InsertBrief = z.infer<typeof insertBriefSchema>;
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type InsertSelectedConcept = z.infer<typeof insertSelectedConceptSchema>;
export type InsertElementSpecification = z.infer<typeof insertElementSpecificationSchema>;
export type InsertReferenceImage = z.infer<typeof insertReferenceImageSchema>;
export type InsertElementImage = z.infer<typeof insertElementImageSchema>;

export type Brief = typeof briefs.$inferSelect & { concepts?: Concept[] };
export type Concept = typeof concepts.$inferSelect;
export type SelectedConcept = typeof selectedConcepts.$inferSelect;
export type ElementSpecification = typeof elementSpecifications.$inferSelect;
export type ReferenceImage = typeof referenceImages.$inferSelect;
export type ElementImage = typeof elementImages.$inferSelect;

export const elementDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  purpose: z.string(),
  editabilityRating: z.number(),
  criticalConstraints: z.string(),
  dimensions: z.object({ width: z.number(), height: z.number() }),
  position: z.object({ x: z.number(), y: z.number() }),
  layerDepth: z.number(),
  transparencyRequirements: z.string(),
  styleContinuityMarkers: z.string(),
  regenerationPrompt: z.string(),
  lightingRequirements: z.string(),
  perspective: z.string(),
  styleAnchors: z.string(),
});

export const backgroundDataSchema = z.object({
  type: z.string(),
  specification: z.string(),
  regenerationPrompt: z.string(),
});

export const elementSpecificationDataSchema = z.object({
  background: backgroundDataSchema,
  elements: z.array(elementDataSchema),
});

export type ElementSpecificationData = z.infer<typeof elementSpecificationDataSchema>;

export const briefFormSchema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters").optional(),
  targetAudience: z.string().min(5, "Target audience description required").optional(),
  keyMessage: z.string().min(10, "Key message must be at least 10 characters").optional(),
  brandGuidelines: z.string().min(10, "Brand guidelines required").optional(),
  bannerSizes: z.string().min(3, "At least one banner size required").optional(),
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
