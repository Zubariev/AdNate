import { Router } from 'express';
import { storage } from '../storage.js'; // Added .js extension
import { generateConcepts } from '../lib/gemini.js'; // Added .js extension
import { briefFormSchema, InsertBrief, InsertConcept, RawConcept } from "@shared/schema.ts";
import { ZodError } from 'zod';
import { GeminiResponse } from '../lib/gemini.js'; // Added .js extension

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

router.post('/:id/share', async (req, res) => {
  const id = req.params.id; // Changed to string
  const brief = await storage.updateBriefShare(id, true);
  res.json({ shareUrl: `/share/${brief.shareId}` });
});

router.post('/', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const validatedData = briefFormSchema.parse(req.body);
    console.log('Validation passed, data:', validatedData);

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured. Using mock response.');
      console.log('To enable AI-generated concepts, set GEMINI_API_KEY environment variable.');
      console.log('Get your API key from: https://aistudio.google.com/app/apikey');
    }

    let response: GeminiResponse; // Use GeminiResponse here
    
    if (process.env.GEMINI_API_KEY) {
      try {
        response = await generateConcepts(validatedData);
      } catch (error) {
        console.warn('Gemini API failed, falling back to mock response:', (error as Error).message);
        response = {
          completedBrief: {
            ...validatedData,
            // Auto-fill missing fields with sensible defaults
            targetAudience: validatedData.targetAudience || 'General audience interested in the product/service',
            keyMessage: validatedData.keyMessage || 'Compelling value proposition that drives action',
            brandGuidelines: validatedData.brandGuidelines || 'Modern, clean design with brand colors',
            bannerSizes: validatedData.bannerSizes || '728x90, 300x250, 320x50',
            brandContext: validatedData.brandContext || 'Established brand with strong market presence',
            objective: validatedData.objective || 'Drive awareness and engagement',
            consumerJourney: validatedData.consumerJourney || 'Awareness to consideration stage',
            emotionalConnection: validatedData.emotionalConnection || 'Aspirational and trustworthy',
            visualStyle: validatedData.visualStyle || 'Clean, modern, and professional',
            performanceMetrics: validatedData.performanceMetrics || 'CTR, impressions, engagement rate',
          },
          concepts: [
            {
              title: 'Professional Concept',
              description: 'A clean, professional design focusing on trust and credibility. Features clear hierarchy with prominent value proposition.',
              elements: {
                background: 'Clean white or subtle gradient background',
                graphics: 'Professional imagery or vector graphics aligned with brand',
                text: 'Strong headline with clear call-to-action',
                layout: 'Balanced composition with logical flow',
                typography: 'Professional sans-serif typography',
                animation: 'Subtle hover effects and transitions'
              },
              midjourneyPrompts: {
                background: 'clean professional background, subtle gradient, corporate style',
                graphics: 'professional vector graphics, clean lines, brand colors',
                text: 'bold headline typography, high contrast, readable'
              },
              rationale: {
                targetAudienceAppeal: 'Appeals to professional audience with clean, trustworthy design',
                brandAlignment: 'Maintains brand consistency while focusing on professionalism',
                messagingStrategy: 'Clear value proposition with strong call-to-action',
                visualHierarchy: 'Headline → benefits → call-to-action flow'
              }
            },
            {
              title: 'Engaging Concept',
              description: 'A more dynamic design with engaging visuals and interactive elements to capture attention.',
              elements: {
                background: 'Dynamic gradient or textured background',
                graphics: 'Eye-catching graphics with motion elements',
                text: 'Compelling copy with emotional appeal',
                layout: 'Asymmetrical but balanced composition',
                typography: 'Mix of bold and regular weights for emphasis',
                animation: 'Animated elements and micro-interactions'
              },
              midjourneyPrompts: {
                background: 'dynamic gradient background, energetic colors, modern style',
                graphics: 'engaging vector illustrations, dynamic shapes, vibrant colors',
                text: 'bold engaging typography, high impact, emotional appeal'
              },
              rationale: {
                targetAudienceAppeal: 'Captures attention with dynamic visuals and emotional appeal',
                brandAlignment: 'Balances brand guidelines with engaging presentation',
                messagingStrategy: 'Emotional connection leading to rational benefits',
                visualHierarchy: 'Visual impact → emotional message → action'
              }
            },
            {
              title: 'Minimalist Concept',
              description: 'A clean, minimalist approach focusing on essential elements and white space for maximum impact.',
              elements: {
                background: 'Generous white space with minimal color accents',
                graphics: 'Minimal, purposeful graphics or icons',
                text: 'Concise, impactful messaging',
                layout: 'Generous spacing with focus on key elements',
                typography: 'Clean, minimal typography with strong hierarchy',
                animation: 'Subtle, purposeful animations'
              },
              midjourneyPrompts: {
                background: 'minimal white background, clean space, subtle accents',
                graphics: 'minimal vector graphics, simple icons, purposeful design',
                text: 'clean minimal typography, strong hierarchy, impactful'
              },
              rationale: {
                targetAudienceAppeal: 'Appeals to audiences who appreciate simplicity and clarity',
                brandAlignment: 'Focuses on core brand message without distractions',
                messagingStrategy: 'Less is more - powerful message with minimal elements',
                visualHierarchy: 'Single focal point → supporting elements → action'
              }
            }
          ]
        };
      }
    } else {
      response = {
          completedBrief: {
            ...validatedData,
            // Auto-fill missing fields with sensible defaults
            targetAudience: validatedData.targetAudience || 'General audience interested in the product/service',
            keyMessage: validatedData.keyMessage || 'Compelling value proposition that drives action',
            brandGuidelines: validatedData.brandGuidelines || 'Modern, clean design with brand colors',
            bannerSizes: validatedData.bannerSizes || '728x90, 300x250, 320x50',
            brandContext: validatedData.brandContext || 'Established brand with strong market presence',
            objective: validatedData.objective || 'Drive awareness and engagement',
            consumerJourney: validatedData.consumerJourney || 'Awareness to consideration stage',
            emotionalConnection: validatedData.emotionalConnection || 'Aspirational and trustworthy',
            visualStyle: validatedData.visualStyle || 'Clean, modern, and professional',
            performanceMetrics: validatedData.performanceMetrics || 'CTR, impressions, engagement rate',
          },
          concepts: [
            {
              title: 'Professional Concept',
              description: 'A clean, professional design focusing on trust and credibility. Features clear hierarchy with prominent value proposition.',
              elements: {
                background: 'Clean white or subtle gradient background',
                graphics: 'Professional imagery or vector graphics aligned with brand',
                text: 'Strong headline with clear call-to-action',
                layout: 'Balanced composition with logical flow',
                typography: 'Professional sans-serif typography',
                animation: 'Subtle hover effects and transitions'
              },
              midjourneyPrompts: {
                background: 'clean professional background, subtle gradient, corporate style',
                graphics: 'professional vector graphics, clean lines, brand colors',
                text: 'bold headline typography, high contrast, readable'
              },
              rationale: {
                targetAudienceAppeal: 'Appeals to professional audience with clean, trustworthy design',
                brandAlignment: 'Maintains brand consistency while focusing on professionalism',
                messagingStrategy: 'Clear value proposition with strong call-to-action',
                visualHierarchy: 'Headline → benefits → call-to-action flow'
              }
            }
          ]
        };
    }
    
    console.log('Generated response:', response);

    const briefToInsert: InsertBrief = {
      projectName: response.completedBrief.projectName,
      targetAudience: response.completedBrief.targetAudience,
      keyMessage: response.completedBrief.keyMessage,
      brandGuidelines: response.completedBrief.brandGuidelines,
      bannerSizes: response.completedBrief.bannerSizes,
      brandContext: response.completedBrief.brandContext || undefined,
      objective: response.completedBrief.objective || undefined,
      consumerJourney: response.completedBrief.consumerJourney || undefined,
      emotionalConnection: response.completedBrief.emotionalConnection || undefined,
      visualStyle: response.completedBrief.visualStyle || undefined,
      performanceMetrics: response.completedBrief.performanceMetrics || undefined,
      shareId: response.completedBrief.shareId || undefined,
      isPublic: response.completedBrief.isPublic || false,
    };
    
    const conceptsToInsert: Omit<InsertConcept, 'briefId'>[] = response.concepts.map((concept: RawConcept) => ({
      title: concept.title,
      description: concept.description || undefined,
      elements: concept.elements || {},
      midjourneyPrompts: concept.midjourneyPrompts || {},
      rationale: concept.rationale || {},
    }));

    const brief = await storage.createBrief(briefToInsert, conceptsToInsert);

    // Assign the new briefId to each concept after brief creation
    // The createBrief function in storage.ts is expected to handle the association of concepts with the brief.

    console.log('Created brief:', brief);
    res.json(brief);
  } catch (error) {
    console.error('Error processing brief:', error);
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      res.status(500).json({ message: (error as Error).message || 'Internal server error' });
    }
  }
});

// Save a concept to a brief
router.post('/:id/concepts', async (req, res) => {
  try {
    const { id } = req.params;
    const { concept: rawConcept } = req.body;
    
    if (!rawConcept) {
      return res.status(400).json({ message: 'Concept data is required' });
    }

    const conceptToInsert: InsertConcept = {
      briefId: id,
      title: rawConcept.title,
      description: rawConcept.description || undefined,
      elements: rawConcept.elements || {},
      midjourneyPrompts: rawConcept.midjourneyPrompts || {},
      rationale: rawConcept.rationale || {},
    };
    
    console.log(`Saving concept to brief ${id}:`, conceptToInsert);
    
    const brief = await storage.getBrief(id);
    if (!brief) {
      return res.status(404).json({ message: 'Brief not found' });
    }
    
    const savedConcept = await storage.saveConcept(id, conceptToInsert);
    
    res.json({ 
      success: true, 
      message: 'Concept saved successfully',
      briefId: id,
      conceptTitle: rawConcept.title,
      savedConcept: savedConcept
    });
  } catch (error) {
    console.error('Error saving concept:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to save concept' });
  }
});

// Get saved concepts for a brief
router.get('/:id/concepts', async (req, res) => {
  try {
    const { id } = req.params;
    
    const brief = await storage.getBrief(id);
    if (!brief) {
      return res.status(404).json({ message: 'Brief not found' });
    }
    
    const savedConcepts = brief.concepts || [];
    res.json({
      briefId: id,
      savedConcepts: savedConcepts,
      count: savedConcepts.length
    });
  } catch (error) {
    console.error('Error getting saved concepts:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to get saved concepts' });
  }
});

export default router; 