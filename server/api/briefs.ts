import { Router } from 'express';
import { storage } from '../storage.js';
import { enhanceBrief, generateConceptsFromEnhancedBrief, BriefInput, EnhancedBriefOutput } from '../lib/gemini.js';
import { briefFormSchema, InsertBrief, InsertConcept, RawConcept, InsertSelectedConcept } from "@shared/schema.ts";
import { ZodError } from 'zod';
import { protect } from '../middleware/auth.js';

const router = Router();

// Basic GET routes to support client queries
router.get('/', protect, async (_req, res) => {
  const list = await storage.getAllBriefs();
  res.json(list);
});

router.get('/:briefId', protect, async (req, res) => {
  const { briefId } = req.params;
  const brief = await storage.getBrief(briefId);
  if (!brief) {
    return res.status(404).json({ message: 'Brief not found.' });
  }
  res.json(brief);
});

router.post('/', protect, async (req, res) => {
  try {
    console.log('Request body for initial brief creation:', req.body);
    
    const validatedData = briefFormSchema.parse(req.body);
    console.log('Validation passed, data:', validatedData);

    if (!req.user || !req.user.id) {
      // This check is now redundant with the `protect` middleware, 
      // but keeping it for clarity that a user is expected.
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const briefToInsert: InsertBrief = {
      projectName: validatedData.projectName,
      targetAudience: validatedData.targetAudience,
      keyMessage: validatedData.keyMessage,
      brandGuidelines: validatedData.brandGuidelines,
      bannerSizes: validatedData.bannerSizes,
      brandContext: validatedData.brandContext || undefined,
      objective: validatedData.objective || undefined,
      consumerJourney: validatedData.consumerJourney || undefined,
      emotionalConnection: validatedData.emotionalConnection || undefined,
      visualStyle: validatedData.visualStyle || undefined,
      performanceMetrics: validatedData.performanceMetrics || undefined,
      userId: req.user.id,
    };
    
    const newBrief = await storage.createBrief(briefToInsert);

    console.log('Created initial brief:', newBrief);
    res.status(201).json(newBrief);
  } catch (error) {
    console.error('Error creating initial brief:', error);
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      res.status(500).json({ message: (error as Error).message || 'Internal server error' });
    }
  }
});

// New endpoint to enhance a brief
router.post('/:briefId/enhance', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    console.log(`Attempting to enhance brief with ID: ${briefId}`);

    const brief = await storage.getBrief(briefId);
    if (!brief) {
      return res.status(404).json({ message: 'Brief not found.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured. Cannot enhance brief.');
      return res.status(503).json({ message: 'AI service unavailable: Gemini API key not set.' });
    }

    const briefInput: BriefInput = {
        projectName: brief.projectName || '',
        targetAudience: brief.targetAudience || undefined,
        keyMessage: brief.keyMessage || undefined,
        brandGuidelines: brief.brandGuidelines || undefined,
        bannerSizes: brief.bannerSizes || undefined,
        brandContext: brief.brandContext || undefined,
        objective: brief.objective || undefined,
        consumerJourney: brief.consumerJourney || undefined,
        emotionalConnection: brief.emotionalConnection || undefined,
        visualStyle: brief.visualStyle || undefined,
        performanceMetrics: brief.performanceMetrics || undefined,
    };

    const enhancedContent: EnhancedBriefOutput = await enhanceBrief(briefInput);

    const updatedBrief = await storage.updateBrief(brief.id, {
      enhancedBrief: enhancedContent,
    });

    res.status(200).json(updatedBrief);
  } catch (error) {
    console.error('Error enhancing brief:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to enhance brief' });
  }
});

// New endpoint to generate concepts from an enhanced brief
router.post('/:briefId/generate-concepts', protect, async (req, res) => {
    try {
      const { briefId } = req.params;
      console.log(`Attempting to generate concepts for brief with ID: ${briefId}`);
  
      const brief = await storage.getBrief(briefId);
      if (!brief || !brief.enhancedBrief) {
        return res.status(404).json({ message: 'Enhanced brief not found.' });
      }
  
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key not configured. Cannot generate concepts.');
        return res.status(503).json({ message: 'AI service unavailable: Gemini API key not set.' });
      }
  
      const conceptsFromLLM: RawConcept[] = await generateConceptsFromEnhancedBrief(brief.enhancedBrief as EnhancedBriefOutput);
  
      const insertedConcepts: Omit<InsertConcept, 'briefId'>[] = conceptsFromLLM.map(concept => ({
        title: concept.title,
        description: concept.description || undefined,
        elements: concept.elements || {},
        midjourneyPrompts: concept.midjourneyPrompts || {},
        rationale: concept.rationale || {},
      }));
  
      const savedConcepts = await Promise.all(insertedConcepts.map(async (concept) => {
        return await storage.saveConcept(brief.id, concept);
      }));
  
      res.status(200).json(savedConcepts);
    } catch (error) {
      console.error('Error generating concepts:', error);
      res.status(500).json({ message: (error as Error).message || 'Failed to generate concepts' });
    }
});

// New endpoint to save a selected concept
router.post('/:briefId/select-concept', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const { conceptId } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!conceptId) {
      return res.status(400).json({ message: 'Concept ID is required.' });
    }

    const insertSelectedConcept: InsertSelectedConcept = {
      briefId: briefId,
      conceptId: conceptId,
      userId: req.user.id,
    };

    const selectedConcept = await storage.saveSelectedConcept(insertSelectedConcept);
    res.status(201).json(selectedConcept);
  } catch (error) {
    console.error('Error saving selected concept:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to save selected concept' });
  }
});

// Get concepts for a brief
router.get('/:briefId/concepts', protect, async (req, res) => {
    try {
      const { briefId } = req.params;
      
      const brief = await storage.getBrief(briefId);
      if (!brief) {
        return res.status(404).json({ message: 'Brief not found' });
      }
      
      const savedConcepts = await storage.getConceptsByBriefId(briefId);
      res.json({
        briefId: briefId,
        savedConcepts: savedConcepts,
        count: savedConcepts.length
      });
    } catch (error) {
      console.error('Error getting saved concepts:', error);
      res.status(500).json({ message: (error as Error).message || 'Failed to get saved concepts' });
    }
});

// Get selected concept for a brief
router.get('/:briefId/selected-concept', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const selectedConcept = await storage.getSelectedConceptByBriefId(briefId);
    if (!selectedConcept) {
      return res.status(404).json({ message: 'No concept selected for this brief.' });
    }
    res.status(200).json(selectedConcept);
  } catch (error) {
    console.error('Error retrieving selected concept:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to retrieve selected concept' });
  }
});

export default router; 