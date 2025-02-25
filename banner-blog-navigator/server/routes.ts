import { Router } from "express";
import { storage } from "./storage";
import { generateConcepts } from "./lib/openai";
import { briefFormSchema } from "../shared/schema";
import { ZodError } from "zod";

const router = Router();

// Blog routes
router.get('/api/blog/posts', async (req, res) => {
  try {
    const posts = await storage.getBlogPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.post('/api/blog/posts', async (req, res) => {
  try {
    const validatedData = briefFormSchema.parse(req.body);
    const concepts = await generateConcepts(validatedData);
    const savedPost = await storage.createBlogPost(concepts);
    res.json(savedPost);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  }
});

export default router; 