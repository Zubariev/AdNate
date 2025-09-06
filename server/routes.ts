import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateConcepts } from "./lib/gemini";
import { briefFormSchema } from "./simple-schema";
import { ZodError } from "zod";
import { initializeDbAndSupabase } from "./db";

export let db: any; // Using 'any' for now, refine type later if needed
export let supabase: any; // Using 'any' for now, refine type later if needed

export async function registerRoutes(app: Express): Promise<Server> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const databaseUrlOverride = process.env.DATABASE_URL;

  ({ db, supabase } = initializeDbAndSupabase(supabaseUrl, supabaseKey, supabaseServiceKey, databaseUrlOverride));

  const httpServer = createServer(app);
  return httpServer;
}