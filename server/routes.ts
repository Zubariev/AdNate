import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateConcepts } from "./lib/openai";
import { briefFormSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/briefs", async (req, res) => {
    try {
      console.log('Received brief request:', req.body);
      const validatedData = briefFormSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      const response = await generateConcepts(validatedData);
      console.log('Generated response:', response);

      const brief = await storage.createBrief({
        ...response.completedBrief,
        concepts: response.concepts
      });

      console.log('Created brief:', brief);
      res.json(brief);
    } catch (error) {
      console.error('Error processing brief:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.get("/api/briefs/:id", async (req, res) => {
    const brief = await storage.getBrief(Number(req.params.id));
    if (!brief) {
      res.status(404).json({ message: "Brief not found" });
      return;
    }
    res.json(brief);
  });

  app.get("/api/briefs/share/:shareId", async (req, res) => {
    const brief = await storage.getBriefByShareId(req.params.shareId);
    if (!brief || !brief.isPublic) {
      res.status(404).json({ message: "Brief not found" });
      return;
    }
    res.json(brief);
  });

  app.post("/api/briefs/:id/share", async (req, res) => {
    try {
      const brief = await storage.updateBriefShare(Number(req.params.id), true);
      res.json({ shareUrl: `/share/${brief.shareId}` });
    } catch (error) {
      res.status(500).json({ message: "Failed to update sharing settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}