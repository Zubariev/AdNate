import { Router } from 'express';
import { storage } from '../storage';
import { generateConcepts } from '../lib/openai';
import { briefFormSchema } from '../../shared/schema';
import { ZodError } from 'zod';

const router = Router();

router.post('/', async (req, res) => {
  try {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const validatedData = briefFormSchema.parse(req.body);
    console.log('Validation passed, data:', validatedData);

    const response = await generateConcepts(validatedData);
    console.log('Generated response:', response);

    const brief = await storage.createBrief({
      ...response.completedBrief,
      concepts: response.concepts
    });

    console.log('Created brief:', brief);
    res.json(brief);
  } catch (error) {
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
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

export default router; 