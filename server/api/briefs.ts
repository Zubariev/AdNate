import { Router } from 'express';
import { storage } from '../storage.js';
import { supabase } from '../db.js';
import { enhanceBrief, generateConceptsFromEnhancedBrief, BriefInput, EnhancedBriefOutput, generateReferenceImage, generateElementSpecifications, processBriefImages } from '../lib/gemini.js';
import { briefFormSchema, InsertBrief, InsertConcept, RawConcept, InsertSelectedConcept } from "@shared/schema";
import { ZodError } from 'zod';
import { protect } from '../middleware/auth.js';
import { EnhancedBriefData } from '../../src/types.js';

const router = Router();

// Basic GET routes to support client queries
router.get('/', protect, async (_req, res) => {
  const list = await storage.getAllBriefs();
  res.json(list);
});
// Get a brief by ID
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

    // Automatically generate concepts after enhancing the brief
    try {
      console.log(`Auto-generating concepts for brief with ID: ${briefId}`);
      
      // Generate concepts using the enhanced brief
      const conceptsFromLLM: RawConcept[] = await generateConceptsFromEnhancedBrief(enhancedContent);
      
      // Format concepts for storage
      const insertedConcepts: Omit<InsertConcept, 'briefId'>[] = conceptsFromLLM.map(concept => ({
        title: concept.title,
        description: concept.description || undefined,
        elements: concept.elements || {},
        midjourneyPrompts: concept.midjourneyPrompts || {},
        rationale: concept.rationale || {},
      }));
      
      // Save each concept to the database
      const savedConcepts = await Promise.all(insertedConcepts.map(async (concept) => {
        return await storage.saveConcept(brief.id, concept);
      }));
      
      console.log(`Successfully auto-generated ${savedConcepts.length} concepts for brief ${briefId}`);
      
      // Include the saved concepts in the response
      const responseWithConcepts = {
        ...updatedBrief,
        concepts: savedConcepts,
        conceptsGenerated: true
      };
      
      res.status(200).json(responseWithConcepts);
    } catch (conceptError) {
      // If concept generation fails, still return the enhanced brief but log the error
      console.error(`Failed to auto-generate concepts: ${conceptError}`);
      res.status(200).json({
        ...updatedBrief,
        conceptsGenerated: false,
        conceptsError: (conceptError as Error).message
      });
    }
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

// New endpoint to get the image generation status of a brief
router.get('/:briefId/image-generation-status', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    
    if (!supabase) {
      return res.status(503).json({ message: 'Database service is not available' });
    }
    
    // Query the status directly from the database to avoid any caching
    const { data, error } = await supabase
      .from('briefs')
      .select('image_generation_status')
      .eq('id', briefId)
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Brief not found.' });
    }
    res.status(200).json({ status: data.image_generation_status || 'pending' });
  } catch (error) {
    console.error('Error fetching brief status:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to fetch brief status' });
  }
});

// New endpoint to generate a reference image
router.post('/:briefId/generate-reference-image', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    
    // Get selected concept for this brief
    const selectedConcept = await storage.getSelectedConceptByBriefId(briefId);
    if (!selectedConcept) {
      return res.status(404).json({ message: 'No concept selected for this brief.' });
    }
    
    // Get the brief
    const brief = await storage.getBrief(briefId);
    if (!brief || !brief.enhancedBrief) {
      return res.status(404).json({ message: 'Enhanced brief not found.' });
    }
    
    // Get the concept details
    const concept = await storage.getConceptById(selectedConcept.conceptId);
    if (!concept) {
      return res.status(404).json({ message: 'Concept not found.' });
    }
    
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Check for an existing reference image first
    const existingImage = await storage.findReferenceImage({
      userId: req.user.id,
      briefId: brief.id,
      conceptId: concept.id
    });

    if (existingImage) {
      console.log(`✅ Found existing reference image in DB (${existingImage.id}), skipping generation.`);
      return res.status(200).json(existingImage);
    }

    // If not in DB, check for an orphaned image in storage
    console.log(`No reference image found in DB for concept ${concept.id}, checking storage for orphans...`);
    const orphanedImage = await storage.findOrphanedImageInStorage(concept.id);

    if (orphanedImage) {
        console.log(`✅ Found orphaned image in storage: ${orphanedImage.path}. Creating DB record...`);
        const publicUrl = await storage.getPublicUrl('reference-images', orphanedImage.path);
        const recoveredImage = await storage.createReferenceImageRecord({
            userId: req.user.id,
            briefId: brief.id,
            conceptId: concept.id,
            promptUsed: `Recovered orphan image for concept: ${concept.title}`,
            imageUrl: publicUrl,
            imagePath: orphanedImage.path,
            fileName: orphanedImage.name,
            mimeType: `image/${orphanedImage.name.split('.').pop()}`,
            imageData: { source: 'recovered-orphan' }
        });
        return res.status(200).json(recoveredImage);
    }

    // Generate the reference image
    console.log("No existing reference image found, proceeding with generation.");
    const newReferenceImage = await generateReferenceImage(brief.enhancedBrief as EnhancedBriefData, concept, req.user.id);
    
    res.status(200).json(newReferenceImage);
  } catch (error) {
    console.error('Error generating reference image:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to generate reference image' });
  }
});

router.post('/:briefId/generate-element-specifications', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const { conceptId, referenceImageId } = req.body;

    if (!conceptId) {
      return res.status(400).json({ message: 'Concept ID is required.' });
    }

    // Check for existing specifications first
    const existingSpec = await storage.findLatestSpecification(briefId, conceptId);
    if (existingSpec) {
        console.log(`✅ Found existing element specifications for concept ${conceptId}, skipping generation.`);
        
        // Trigger TS image generation as a background task, don't await
        process.nextTick(() => {
            if (!req.user?.id) {
              console.error("Cannot process images without a user ID.");
              return;
            }
            processBriefImages(briefId, req.user.id).catch(err => {
              console.error("Async TS image generation trigger failed:", err);
            });
        });

        // To match the structure returned by generateElementSpecifications
        return res.status(200).json({
            success: true,
            elementSpecification: existingSpec,
            specifications: existingSpec.specificationData,
            metadata: { /* metadata can be minimal or omitted if not needed by frontend */ }
        });
    }

    console.log(`No existing element specifications for concept ${conceptId}, proceeding with generation.`);
    const result = await generateElementSpecifications(briefId, conceptId, referenceImageId);
    
    // If specification generation was successful, trigger the python image generation
    if (result.success) {
      // Trigger TS image generation as a background task, don't await
      process.nextTick(() => {
        if (!req.user?.id) {
          console.error("Cannot process images without a user ID.");
          return;
        }
        processBriefImages(briefId, req.user.id).catch(err => {
          console.error("Async TS image generation trigger failed:", err);
        });
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating element specifications:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to generate element specifications' });
  }
});

export default router; 