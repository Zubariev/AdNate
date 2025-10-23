import { Router } from 'express';
import { storage } from '../storage.js';
import { supabase } from '../db.js';
import { enhanceBrief, generateConceptsFromEnhancedBrief, BriefInput, EnhancedBriefOutput, generateReferenceImage, generateElementSpecifications, processBriefImages, getElementSpecifications } from '../lib/gemini.js';
import { briefFormSchema, InsertBrief, InsertConcept, RawConcept, InsertSelectedConcept, BriefAsset } from "@shared/schema";
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
    
    // Extract colors and assets from request body
    const { colors, assets, ...briefData } = req.body;
    
    // Validate asset limits
    if (assets && Array.isArray(assets)) {
      const logoCount = assets.filter((a: { type: string }) => a.type === 'logo').length;
      const imageCount = assets.filter((a: { type: string }) => a.type === 'image').length;
      
      if (logoCount > 1) {
        return res.status(400).json({ message: 'Maximum 1 logo allowed' });
      }
      if (imageCount > 1) {
        return res.status(400).json({ message: 'Maximum 1 asset image allowed' });
      }
    }
    
    const validatedData = briefFormSchema.parse(briefData);
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

    // Save colors if provided
    if (colors && Array.isArray(colors) && colors.length > 0) {
      console.log('Saving colors for brief:', newBrief.id);
      await storage.saveBriefColors(newBrief.id, req.user.id, colors);
    }

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

// New endpoint to upload asset library images
router.post('/:briefId/upload-assets', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const { assets } = req.body;

    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ message: 'Assets array is required.' });
    }

    const brief = await storage.getBrief(briefId);
    if (!brief) {
      return res.status(404).json({ message: 'Brief not found.' });
    }

    const uploadedAssets: { type: string; url: string; name: string; description?: string }[] = [];

    for (const asset of assets) {
      if (asset.type === 'color') {
        // Colors don't need to be uploaded to storage
        uploadedAssets.push({
          type: 'color',
          url: asset.url,
          name: asset.name,
          description: asset.description
        });
        continue;
      }

      if (!asset.file || !asset.url) {
        console.warn(`Skipping asset ${asset.name} - missing file data`);
        continue;
      }

      try {
        // Convert base64 to buffer
        const base64Data = asset.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const mimeType = asset.url.match(/data:(image\/\w+);base64,/)?.[1] || 'image/png';
        
        const assetType = asset.type === 'logo' ? 'logo' : 'asset';
        const publicUrl = await storage.uploadAssetImage(briefId, buffer, asset.name, mimeType, assetType);

        uploadedAssets.push({
          type: asset.type,
          url: publicUrl,
          name: asset.name,
          description: asset.description
        });

        console.log(`Uploaded ${assetType}: ${asset.name} to ${publicUrl}`);
      } catch (uploadError) {
        console.error(`Error uploading asset ${asset.name}:`, uploadError);
      }
    }

    res.status(200).json({
      message: 'Assets uploaded successfully',
      uploadedAssets
    });
  } catch (error) {
    console.error('Error uploading assets:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to upload assets' });
  }
});

// New endpoint to enhance a brief
router.post('/:briefId/enhance', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const { assets } = req.body; // Receive assets from the request body
    console.log(`Attempting to enhance brief with ID: ${briefId}`);

    const brief = await storage.getBrief(briefId);
    if (!brief) {
      return res.status(404).json({ message: 'Brief not found.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured. Cannot enhance brief.');
      return res.status(503).json({ message: 'AI service unavailable: Gemini API key not set.' });
    }

    // Upload assets if provided
    const uploadedAssets: Array<{ type: string; url: string; name: string; description?: string }> = [];
    const savedAssets: BriefAsset[] = [];
    
    if (assets && Array.isArray(assets) && assets.length > 0) {
      console.log(`Uploading ${assets.length} assets for brief ${briefId}`);
      
      for (const asset of assets) {
        if (asset.type === 'color') {
          uploadedAssets.push({
            type: 'color',
            url: asset.url,
            name: asset.name,
            description: asset.description
          });
          continue;
        }

        if (!asset.url) {
          console.warn(`Skipping asset ${asset.name} - missing file data`);
          continue;
        }

        try {
          // Convert base64 to buffer
          const base64Data = asset.url.split(',')[1];
          if (!base64Data) {
            console.warn(`Skipping asset ${asset.name} - invalid base64 data`);
            continue;
          }
          
          const buffer = Buffer.from(base64Data, 'base64');
          const mimeType = asset.url.match(/data:(image\/\w+);base64,/)?.[1] || 'image/png';
          
          const assetType = asset.type === 'logo' ? 'logo' : 'asset';
          const uploadResult = await storage.uploadAssetImage(briefId, buffer, asset.name, mimeType, assetType);

          uploadedAssets.push({
            type: asset.type,
            url: uploadResult.url,
            name: asset.name,
            description: asset.description
          });

          // Save asset to brief_assets table
          const savedAsset = await storage.saveBriefAsset(briefId, req.user!.id, {
            assetType: asset.type,
            name: asset.name,
            url: uploadResult.url,
            description: asset.description,
            imagePath: uploadResult.imagePath,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType
          });
          savedAssets.push(savedAsset);

          console.log(`✅ Uploaded and saved ${assetType}: ${asset.name} to ${uploadResult.url}`);
        } catch (uploadError) {
          console.error(`Error uploading asset ${asset.name}:`, uploadError);
        }
      }
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
        conceptsGenerated: true,
        uploadedAssets: uploadedAssets
      };
      
      res.status(200).json(responseWithConcepts);
    } catch (conceptError) {
      // If concept generation fails, still return the enhanced brief but log the error
      console.error(`Failed to auto-generate concepts: ${conceptError}`);
      res.status(200).json({
        ...updatedBrief,
        conceptsGenerated: false,
        conceptsError: (conceptError as Error).message,
        uploadedAssets: uploadedAssets
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

// Endpoint to clear concepts from a brief - DISABLED to prevent cascade deletion of element_images
// Note: This endpoint was causing element_images to be deleted due to CASCADE constraint
// Instead of deleting concepts, they should be hidden in the UI if needed
router.delete('/:briefId/concepts', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    
    // Return success without actually deleting
    // Concepts should remain in the database to maintain data integrity
    console.log(`Concept deletion skipped for brief ${briefId} - concepts retained for data integrity`);
    res.status(200).json({ 
      message: 'Concepts retained for data integrity',
      note: 'Concepts are not deleted to preserve element images'
    });
  } catch (error) {
    console.error('Error in concepts endpoint:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to process request' });
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

    // Get assets and colors for this brief
    const briefAssets = await storage.getBriefAssets(briefId);
    const briefColors = await storage.getBriefColors(briefId);
    
    // Download base64 data for image assets
    const assetImagesBase64: Array<{ type: string; base64: string; name: string; description?: string }> = [];
    
    for (const asset of briefAssets) {
      try {
        const bucket = asset.assetType === 'logo' ? 'logos' : 'assets';
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(asset.imagePath);
        
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
          const base64 = buffer.toString('base64');
          assetImagesBase64.push({
            type: asset.assetType,
            base64: `data:${asset.mimeType};base64,${base64}`,
            name: asset.name,
            description: asset.description || undefined
          });
          console.log(`✅ Downloaded asset ${asset.name} for reference image generation`);
        }
      } catch (err) {
        console.error(`Failed to download asset ${asset.name}:`, err);
      }
    }
    
    // Generate the reference image with assets
    console.log("No existing reference image found, proceeding with generation.");
    const newReferenceImage = await generateReferenceImage(
      brief.enhancedBrief as EnhancedBriefData,
      concept,
      req.user.id,
      {
        images: assetImagesBase64,
        colors: briefColors.map(c => ({ name: c.name, value: c.colorValue }))
      },
      brief.bannerSizes // Pass banner size for aspect ratio calculation
    );
    
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

// Get element images for a brief
router.get('/:briefId/element-images', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const userId = req.user?.id;
    
    console.log(`Fetching element images for briefId: ${briefId}, userId: ${userId}`);
    
    if (!supabase) {
      return res.status(503).json({ message: 'Database service is not available' });
    }
    
    // Use service key client but filter by user_id to respect user data isolation
    const { data, error } = await supabase
      .from('element_images')
      .select('*')
      .eq('brief_id', briefId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    console.log('Element images query result:', { data, error });
    
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedData = data?.map(item => ({
      id: item.id,
      brief_id: item.brief_id,
      concept_id: item.concept_id,
      element_id: item.element_id,
      image_url: item.image_url,
      image_path: item.image_path,
      file_name: item.file_name,
      file_size: item.file_size,
      mime_type: item.mime_type,
      image_data: item.image_data,
      prompt_used: item.prompt_used,
      image_type: item.image_type,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
    
    res.status(200).json(mappedData);
  } catch (error) {
    console.error('Error fetching element images:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to fetch element images' });
  }
});

// Get element specifications for a brief
router.get('/:briefId/element-specifications', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const userId = req.user?.id;
    
    console.log(`Fetching element specifications for briefId: ${briefId}, userId: ${userId}`);
    
    if (!supabase) {
      return res.status(503).json({ message: 'Database service is not available' });
    }
    
    // Use service key client but filter by user_id to respect user data isolation
    const { data, error } = await supabase
      .from('element_specifications')
      .select(`
        id, 
        brief_id, 
        concept_id, 
        user_id, 
        specification_data, 
        prompt_used, 
        reference_image_id, 
        ai_model_used, 
        generated_at, 
        created_at, 
        updated_at
      `)
      .eq('brief_id', briefId)
      .eq('user_id', userId);
    
    console.log('Element specifications query result:', { data, error });
    
    if (error) throw error;
    
    // Map the results to correct property names
    const mappedData = data?.map(spec => ({
      id: spec.id,
      briefId: spec.brief_id,
      conceptId: spec.concept_id,
      userId: spec.user_id,
      specificationData: spec.specification_data,
      promptUsed: spec.prompt_used,
      referenceImageId: spec.reference_image_id,
      aiModelUsed: spec.ai_model_used,
      generatedAt: spec.generated_at,
      createdAt: spec.created_at,
      updatedAt: spec.updated_at
    })) || [];
    
    res.status(200).json(mappedData);
  } catch (error) {
    console.error('Error fetching element specifications:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to fetch element specifications' });
  }
});

// Debug endpoint to check what getElementSpecifications returns
router.get('/:briefId/debug-element-specifications', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    
    console.log(`Debug: Checking element specifications for briefId: ${briefId}`);
    
    // Use the same function that processBriefImages uses
    const specRecords = await getElementSpecifications(briefId);
    
    console.log(`getElementSpecifications returned:`, specRecords);
    
    res.status(200).json({
      briefId,
      specRecords,
      count: specRecords.length,
      hasSpecs: specRecords.length > 0
    });
  } catch (error) {
    console.error('Debug element specifications error:', error);
    res.status(500).json({ message: (error as Error).message || 'Debug failed' });
  }
});

// Manual trigger for image generation (for debugging)
router.post('/:briefId/trigger-image-generation', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    console.log(`Manual trigger: Starting image generation for brief ${briefId}, user ${userId}`);
    
    // Trigger the image generation process
    processBriefImages(briefId, userId).catch(err => {
      console.error("Manual image generation failed:", err);
    });
    
    res.status(200).json({ 
      message: 'Image generation triggered successfully',
      briefId,
      userId 
    });
  } catch (error) {
    console.error('Error triggering image generation:', error);
    res.status(500).json({ message: (error as Error).message || 'Failed to trigger image generation' });
  }
});

// Debug endpoint to check if element images exist in database
router.get('/:briefId/debug-element-images', protect, async (req, res) => {
  try {
    const { briefId } = req.params;
    const userId = req.user?.id;
    
    console.log(`Debug: Checking element images for briefId: ${briefId}, userId: ${userId}`);
    
    if (!supabase) {
      return res.status(503).json({ message: 'Database service is not available' });
    }
    
    // Check with service key (bypasses RLS)
    const { data: serviceData, error: serviceError } = await supabase
      .from('element_images')
      .select('*')
      .eq('brief_id', briefId);
    
    console.log('Service key query result:', { data: serviceData, error: serviceError });
    
    // Check with user filtering
    const { data: userData, error: userError } = await supabase
      .from('element_images')
      .select('*')
      .eq('brief_id', briefId)
      .eq('user_id', userId);
    
    console.log('User filtered query result:', { data: userData, error: userError });
    
    res.status(200).json({
      briefId,
      userId,
      serviceKeyResult: { data: serviceData, error: serviceError },
      userFilteredResult: { data: userData, error: userError }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: (error as Error).message || 'Debug endpoint failed' });
  }
});

// Temporary endpoint to check data without RLS (for debugging)
router.get('/:briefId/temp-check-data', async (req, res) => {
  try {
    const { briefId } = req.params;
    
    console.log(`Temp check: Looking for data with briefId: ${briefId}`);
    
    if (!supabase) {
      return res.status(503).json({ message: 'Database service is not available' });
    }
    
    // Use service key to bypass RLS
    const [elementImagesResult, specificationsResult] = await Promise.all([
      supabase.from('element_images').select('*').eq('brief_id', briefId),
      supabase.from('element_specifications').select('*').eq('brief_id', briefId)
    ]);
    
    console.log('Element images (service key):', elementImagesResult);
    console.log('Element specifications (service key):', specificationsResult);
    
    res.status(200).json({
      briefId,
      elementImages: elementImagesResult,
      specifications: specificationsResult
    });
    
  } catch (error) {
    console.error('Temp check error:', error);
    res.status(500).json({ message: (error as Error).message || 'Temp check failed' });
  }
});

export default router; 