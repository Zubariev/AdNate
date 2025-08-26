import { Router } from 'express';
import { storage } from '../storage.js';
import { enhanceBrief, generateConceptsFromEnhancedBrief, BriefInput, EnhancedBriefOutput } from '../lib/gemini.js';
import { briefFormSchema, InsertBrief, InsertConcept, RawConcept, InsertEnhancedBrief, InsertSelectedConcept } from "@shared/schema.ts";
import { ZodError } from 'zod';

const router = Router();

// Basic GET routes to support client queries
router.get('/', async (_req, res) => {
  const list = await storage.getAllBriefs();
  res.json(list);
});

router.get('/share/:shareId', async (req, res) => {
  const brief = await storage.getBriefByShareId(req.params.shareId);
  if (!brief || !brief.isPublic) return res.status(404).json({ message: 'Not found' });
  res.json(brief);
});

// New endpoint to get an enhanced brief by briefId
router.get('/:briefId/enhanced-brief', async (req, res) => {
  try {
    const { briefId } = req.params;
    const enhancedBrief = await storage.getEnhancedBriefByBriefId(briefId);
    if (!enhancedBrief) {
      return res.status(404).json({ message: 'Enhanced brief not found.' });
    }
    res.status(200).json(enhancedBrief);
  } catch (error) {
    console.error('Error retrieving enhanced brief:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to retrieve enhanced brief' });
  }
});

router.post('/:id/share', async (req, res) => {
  const id = req.params.id;
  const brief = await storage.updateBriefShare(id, true);
  res.json({ shareUrl: `/share/${brief.shareId}` });
});

router.post('/', async (req, res) => {
  try {
    console.log('Request body for initial brief creation:', req.body);
    
    const validatedData = briefFormSchema.parse(req.body);
    console.log('Validation passed, data:', validatedData);

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
      // shareId and isPublic are defaulted in the schema
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
router.post('/:briefId/enhance', async (req, res) => {
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
      projectName: brief.projectName,
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

    const insertEnhancedBrief: InsertEnhancedBrief = {
      briefId: brief.id,
      enhancedContent: enhancedContent,
    };

    const newEnhancedBrief = await storage.createEnhancedBrief(insertEnhancedBrief);

    res.status(200).json(newEnhancedBrief);
  } catch (error) {
    console.error('Error enhancing brief:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to enhance brief' });
  }
});

// New endpoint to generate concepts from an enhanced brief
router.post('/:enhancedBriefId/generate-concepts', async (req, res) => {
  try {
    const { enhancedBriefId } = req.params;
    console.log(`Attempting to generate concepts for enhanced brief with ID: ${enhancedBriefId}`);

    const enhancedBrief = await storage.getEnhancedBriefByBriefId(enhancedBriefId);
    if (!enhancedBrief) {
      return res.status(404).json({ message: 'Enhanced brief not found.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured. Cannot generate concepts.');
      return res.status(503).json({ message: 'AI service unavailable: Gemini API key not set.' });
    }

    const conceptsFromLLM: RawConcept[] = await generateConceptsFromEnhancedBrief(enhancedBrief.enhancedContent as EnhancedBriefOutput);

    const insertedConcepts: InsertConcept[] = conceptsFromLLM.map(concept => ({
      enhancedBriefId: enhancedBrief.id,
      title: concept.title,
      description: concept.description || undefined,
      elements: concept.elements || {},
      midjourneyPrompts: concept.midjourneyPrompts || {},
      rationale: concept.rationale || {},
    }));

    const savedConcepts = await Promise.all(insertedConcepts.map(async (concept) => {
      return await storage.saveConcept(enhancedBrief.id, concept);
    }));

    res.status(200).json(savedConcepts);
  } catch (error) {
    console.error('Error generating concepts:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to generate concepts' });
  }
});

// New endpoint to save a selected concept
router.post('/:briefId/select-concept', async (req, res) => {
  try {
    const { briefId } = req.params;
    const { conceptId } = req.body;

    if (!conceptId) {
      return res.status(400).json({ message: 'Concept ID is required.' });
    }

    const insertSelectedConcept: InsertSelectedConcept = {
      briefId: briefId,
      conceptId: conceptId,
    };

    const selectedConcept = await storage.saveSelectedConcept(insertSelectedConcept);
    res.status(201).json(selectedConcept);
  } catch (error) {
    console.error('Error saving selected concept:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to save selected concept' });
  }
});

// Get concepts for an enhanced brief
router.get('/:enhancedBriefId/concepts', async (req, res) => {
  try {
    const { enhancedBriefId } = req.params;
    
    const enhancedBrief = await storage.getEnhancedBriefByBriefId(enhancedBriefId);
    if (!enhancedBrief) {
      return res.status(404).json({ message: 'Enhanced brief not found' });
    }
    
    const savedConcepts = await storage.getConceptsByEnhancedBriefId(enhancedBriefId);
    res.json({
      enhancedBriefId: enhancedBriefId,
      savedConcepts: savedConcepts,
      count: savedConcepts.length
    });
  } catch (error) {
    console.error('Error getting saved concepts:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to get saved concepts' });
  }
});

// Get selected concept for a brief
router.get('/:briefId/selected-concept', async (req, res) => {
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