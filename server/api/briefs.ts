import { Router } from 'express';
import { storage } from '../storage';
import { generateConcepts } from '../lib/openai';
import { briefFormSchema } from '../../shared/schema';
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

router.post('/:id/share', async (req, res) => {
  const id = Number(req.params.id);
  const brief = await storage.updateBriefShare(id, true);
  res.json({ shareUrl: `/share/${brief.shareId}` });
});

router.post('/', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const validatedData = briefFormSchema.parse(req.body);
    console.log('Validation passed, data:', validatedData);

    // If OpenAI key isn't configured, return a deterministic mock for local dev
    const response = process.env.OPENAI_API_KEY
      ? await generateConcepts(validatedData)
      : {
          completedBrief: validatedData,
          concepts: [
            {
              title: 'Concept A',
              description: 'Mock concept for local development.',
              elements: {
                background: 'Soft gradient background',
                graphics: 'Abstract shapes with brand colors',
                text: 'Clear headline and supportive subtext',
                layout: 'Centered hero with CTA',
                typography: 'Sans-serif, bold headline',
                animation: 'Subtle fade-in'
              },
              midjourneyPrompts: {
                background: 'soft gradient background, brand palette',
                graphics: 'abstract shapes, vector, clean',
                text: 'headline with strong contrast, legible'
              },
              rationale: {
                targetAudienceAppeal: 'Professional tone for young professionals',
                brandAlignment: 'Warm and inviting visuals',
                messagingStrategy: 'Emphasizes clarity and benefits',
                visualHierarchy: 'Headline first, then value, then CTA'
              }
            }
          ]
        };
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
    } else {
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
});

export default router; 