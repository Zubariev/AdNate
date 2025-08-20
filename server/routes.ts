import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateConcepts } from "./lib/gemini";
import { briefFormSchema } from "./simple-schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  return httpServer;
}