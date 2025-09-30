// Storage layer with proper typing
import { db, supabase } from './routes'; // Import db and supabase instances
import { Brief, briefs, Concept, concepts, InsertBrief, InsertConcept, InsertSelectedConcept, selectedConcepts, SelectedConcept, ElementSpecification, elementSpecifications, ReferenceImage, referenceImages, ElementSpecificationData, InsertReferenceImage, ElementImage, elementImages, InsertElementImage } from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import axios from 'axios';

export interface IStorage {
  createBrief(brief: InsertBrief): Promise<Brief>;
  getBrief(id: string): Promise<Brief | null>;
  getAllBriefs(): Promise<Brief[]>;
  updateBrief(id: string, updates: Partial<Pick<InsertBrief, 'enhancedBrief'>>): Promise<Brief>;
  saveConcept(briefId: string, concept: Omit<InsertConcept, 'briefId'>): Promise<Concept>;
  getConceptsByBriefId(briefId: string): Promise<Concept[]>;
  saveSelectedConcept(selectedConcept: InsertSelectedConcept): Promise<SelectedConcept>;
  getSelectedConceptByBriefId(briefId: string): Promise<SelectedConcept | null>;
  getConceptById(id: string): Promise<Concept | null>;
  storeReferenceImage(data: Omit<InsertReferenceImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ReferenceImage>;
  storeElementImage(data: Omit<InsertElementImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ElementImage>;
  getPublicUrl(bucketName: string, fileName: string): Promise<string>;
  createElementSpecification(briefId: string, conceptId: string, specificationData: ElementSpecificationData, promptUsed: string, referenceImageId: string | undefined, aiModelUsed: string): Promise<ElementSpecification>;
  getReferenceImage(id: string): Promise<ReferenceImage | null>;
  getLatestReferenceImageByConceptId(conceptId: string): Promise<ReferenceImage | null>;
  getImageName(referenceImageId: string): Promise<string>;
  convertImageToBase64(imageUrl: string, compress?: boolean): Promise<string>;
  findReferenceImage(params: { userId: string; briefId: string; conceptId: string }): Promise<ReferenceImage | null>;
  findOrphanedImageInStorage(conceptId: string): Promise<{ path: string; name: string } | null>;
  createReferenceImageRecord(data: InsertReferenceImage): Promise<ReferenceImage>;
  findLatestSpecification(briefId: string, conceptId: string): Promise<ElementSpecification | null>;
}

export class DatabaseStorage implements IStorage {
  async createBrief(insertBrief: InsertBrief): Promise<Brief> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for createBrief.');
      return InMemoryStorage.instance.createBrief(insertBrief);
    }

    try {
      const newBriefs = await db!.insert(briefs).values(insertBrief).returning();

      if (!newBriefs || newBriefs.length === 0) {
        throw new Error('Failed to create brief.');
      }
      const newBrief = newBriefs[0];

      return newBrief;
    } catch (error) {
      console.error('Supabase brief creation failed:', error);
      throw error;
    }
  }

  async getBrief(id: string): Promise<Brief | null> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getBrief.');
      return InMemoryStorage.instance.getBrief(id);
    }

    try {
      const briefResult = await db!.select().from(briefs).where(eq(briefs.id, id)).limit(1);

      if (!briefResult || briefResult.length === 0) {
        return null;
      }
      const brief = briefResult[0];

      return brief;
    } catch (error) {
      console.error('Supabase brief retrieval failed:', error);
      return InMemoryStorage.instance.getBrief(id);
    }
  }

  // Removed getBriefByShareId

  async getAllBriefs(): Promise<Brief[]> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getAllBriefs.');
      return InMemoryStorage.instance.getAllBriefs();
    }

    try {
      const briefResults = await db!.select().from(briefs).orderBy(desc(briefs.createdAt));

      return briefResults;
    } catch (error) {
      console.error('Supabase briefs retrieval failed:', error);
      return InMemoryStorage.instance.getAllBriefs();
    }
  }

  async updateBrief(id: string, updates: Partial<Pick<InsertBrief, 'enhancedBrief'>>): Promise<Brief> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for updateBrief.');
      return InMemoryStorage.instance.updateBrief(id, updates);
    }
    try {
      const updatedBriefs = await db.update(briefs)
        .set({ ...updates, enhancedBriefUpdatedAt: new Date() })
        .where(eq(briefs.id, id))
        .returning();
      if (!updatedBriefs || updatedBriefs.length === 0) {
        throw new Error('Brief not found for update.');
      }
      return updatedBriefs[0];
    } catch (error) {
      console.error('Supabase brief update failed:', error);
      throw error;
    }
  }

  async saveConcept(briefId: string, concept: Omit<InsertConcept, 'briefId'>): Promise<Concept> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for saveConcept.');
      return InMemoryStorage.instance.saveConcept(briefId, concept);
    }

    try {
      const newConcepts = await db!.insert(concepts).values({
        ...concept,
        briefId: briefId,
      }).returning();

      if (!newConcepts || newConcepts.length === 0) {
        throw new Error('Failed to save concept.');
      }

      return newConcepts[0];
    } catch (error) {
      console.error('Supabase concept save failed:', error);
      throw error;
    }
  }

  async getConceptsByBriefId(briefId: string): Promise<Concept[]> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getConceptsByBriefId.');
      return InMemoryStorage.instance.getConceptsByBriefId(briefId);
    }
    try {
      const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.briefId, briefId));
      return associatedConcepts;
    } catch (error) {
      console.error('Supabase concept retrieval by brief ID failed:', error);
      return InMemoryStorage.instance.getConceptsByBriefId(briefId);
    }
  }

  async saveSelectedConcept(insertSelectedConcept: InsertSelectedConcept): Promise<SelectedConcept> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for saveSelectedConcept.');
      return InMemoryStorage.instance.saveSelectedConcept(insertSelectedConcept);
    }
    try {
      const newSelectedConcepts = await db!.insert(selectedConcepts).values(insertSelectedConcept).returning();
      if (!newSelectedConcepts || newSelectedConcepts.length === 0) {
        throw new Error('Failed to save selected concept.');
      }
      return newSelectedConcepts[0];
    } catch (error) {
      console.error('Supabase selected concept save failed:', error);
      throw error;
    }
  }

  async getSelectedConceptByBriefId(briefId: string): Promise<SelectedConcept | null> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getSelectedConceptByBriefId.');
      return InMemoryStorage.instance.getSelectedConceptByBriefId(briefId);
    }
    try {
      const selectedConceptResult = await db!.select().from(selectedConcepts).where(eq(selectedConcepts.briefId, briefId)).limit(1);
      if (!selectedConceptResult || selectedConceptResult.length === 0) {
        return null;
      }
      return selectedConceptResult[0];
    } catch (error) {
      console.error('Supabase selected concept retrieval failed:', error);
      return InMemoryStorage.instance.getSelectedConceptByBriefId(briefId);
    }
  }

  async getConceptById(id: string): Promise<Concept | null> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getConceptById.');
      return InMemoryStorage.instance.getConceptById(id);
    }
    try {
      const conceptResult = await db!.select().from(concepts).where(eq(concepts.id, id)).limit(1);
      if (!conceptResult || conceptResult.length === 0) {
        return null;
      }
      return conceptResult[0];
    } catch (error) {

      console.error('Supabase concept retrieval failed:', error);
      return InMemoryStorage.instance.getConceptById(id);
    }
  }

  async getPublicUrl(bucketName: string, fileName: string): Promise<string> {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data.publicUrl;
  }
  async storeReferenceImage(data: Omit<InsertReferenceImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ReferenceImage> {
    const { imageBase64, ...restData } = data;
    try {
      const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (!mimeTypeMatch) {
        throw new Error('Invalid image data URL format. Expected "data:image/..."');
      }
      const mimeType = mimeTypeMatch[1];
      const extension = mimeType.split('/')[1];
      const base64Data = imageBase64.substring(imageBase64.indexOf(',') + 1);

      const buffer = Buffer.from(base64Data, 'base64');
      
      const bucketName = 'reference-images';
      const fileName = `${restData.conceptId}/${Date.now()}.${extension}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload to Supabase storage: ${error.message}`);
      }
      
      const publicUrl = await this.getPublicUrl(bucketName, fileName);
      console.log('Reference image successfully stored at:', publicUrl);

      const newImageRecordData: InsertReferenceImage = {
        ...restData,
        imageUrl: publicUrl,
        imagePath: fileName,
        fileName: fileName.split('/').pop() || fileName,
        mimeType: mimeType,
        fileSize: buffer.length
      };

      const newImageRecords = await db!.insert(referenceImages).values(newImageRecordData).returning();

      return newImageRecords[0];

    } catch (error) {
      console.error('Error storing reference image:', error);
      throw error;
    }
  }

  async storeElementImage(data: Omit<InsertElementImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ElementImage> {
    const { elementId, conceptId, briefId, userId, promptUsed, imageBase64, imageType, ...restData } = data;
    try {
      const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (!mimeTypeMatch) {
        throw new Error('Invalid image data URL format. Expected "data:image/..."');
      }
      const mimeType = mimeTypeMatch[1];
      const extension = mimeType.split('/')[1];
      const base64Data = imageBase64.substring(imageBase64.indexOf(',') + 1);

      const buffer = Buffer.from(base64Data, 'base64');
      
      const bucketName = 'element-images';
      const fileName = `${briefId}/${elementId}_${imageType}.${extension}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false, // Do not overwrite existing files
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload to Supabase storage: ${error.message}`);
      }
      
      const publicUrl = await this.getPublicUrl(bucketName, fileName);
      console.log('Element image successfully stored at:', publicUrl);

      const newImageRecordData: InsertElementImage = {
        ...restData,
        conceptId,
        briefId,
        userId,
        elementId,
        promptUsed,
        imageType,
        imageUrl: publicUrl,
        imagePath: fileName,
        fileName: fileName.split('/').pop() || fileName,
        mimeType: mimeType,
        fileSize: buffer.length
      };

      const newImageRecords = await db!.insert(elementImages).values(newImageRecordData).returning();

      return newImageRecords[0];

    } catch (error) {
      console.error('Error storing element image:', error);
      throw error;
    }
  }

  async createElementSpecification(briefId: string, conceptId: string, specificationData: ElementSpecificationData, promptUsed: string, referenceImageId: string | undefined, aiModelUsed: string): Promise<ElementSpecification> {
    if (!db) {
      throw new Error('Drizzle DB not initialized.');
    }

    const brief = await this.getBrief(briefId);
    if (!brief || !brief.userId) {
      throw new Error('Brief or user not found.');
    }

    const newSpec = await db.insert(elementSpecifications).values({
      briefId,
      conceptId,
      userId: brief.userId,
      specificationData,
      promptUsed,
      referenceImageId: referenceImageId ?? null,
      aiModelUsed
    }).returning();

    return newSpec[0];
  }

  async getReferenceImage(id: string): Promise<ReferenceImage | null> {
    if (!db) {
      return InMemoryStorage.instance.getReferenceImage(id);
    }
    const result = await db.select().from(referenceImages).where(eq(referenceImages.id, id)).limit(1);
    return result[0] || null;
  }

  async getLatestReferenceImageByConceptId(conceptId: string): Promise<ReferenceImage | null> {
    if (!db) {
        return InMemoryStorage.instance.getLatestReferenceImageByConceptId(conceptId);
    }
    const result = await db.select()
        .from(referenceImages)
        .where(eq(referenceImages.conceptId, conceptId))
        .orderBy(desc(referenceImages.createdAt))
        .limit(1);
    return result[0] || null;
  }

  async findReferenceImage({ userId, briefId, conceptId }: { userId: string; briefId: string; conceptId: string }): Promise<ReferenceImage | null> {
    if (!db) {
      return InMemoryStorage.instance.findReferenceImage({ userId, briefId, conceptId });
    }
    const result = await db.select()
        .from(referenceImages)
        .where(
            and(
                eq(referenceImages.userId, userId),
                eq(referenceImages.briefId, briefId),
                eq(referenceImages.conceptId, conceptId)
            )
        )
        .orderBy(desc(referenceImages.createdAt))
        .limit(1);
    return result[0] || null;
  }

  async findOrphanedImageInStorage(conceptId: string): Promise<{ path: string; name: string } | null> {
    const { data, error } = await supabase.storage
        .from('reference-images')
        .list(conceptId, {
            limit: 1,
            sortBy: { column: 'created_at', order: 'desc' },
        });

    if (error) {
        console.error('Error listing storage files:', error);
        return null;
    }

    if (data && data.length > 0) {
        const file = data[0];
        return {
            path: `${conceptId}/${file.name}`,
            name: file.name
        };
    }

    return null;
  }

  async createReferenceImageRecord(data: InsertReferenceImage): Promise<ReferenceImage> {
      if (!db) {
          throw new Error('Drizzle DB not initialized.');
      }
      const newImageRecords = await db!.insert(referenceImages).values(data).returning();
      if (!newImageRecords || newImageRecords.length === 0) {
          throw new Error('Failed to create reference image record in database.');
      }
      return newImageRecords[0];
  }

  async getImageName(referenceImageId: string): Promise<string> {
    // This is a placeholder implementation. This assumes the file name is stored in the reference image record.
    const image = await this.getReferenceImage(referenceImageId);
    if (!image || !image.fileName) {
      throw new Error("Reference image not found or has no file name.");
    }
    return image.fileName;
  }

  async convertImageToBase64(imageUrl: string, compress: boolean = false): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data as ArrayBuffer);
      
      // Return base64 data directly
      const base64 = buffer.toString('base64');
      
      if (!compress) {
        // For image models, we need the data:image format
        const mimeType = response.headers['content-type'] || 'image/png';
        return `data:${mimeType};base64,${base64}`;
      }
      
      // Just return the raw base64 string when compression is requested
      // This is slightly smaller as it doesn't include the data:image prefix
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64.');
    }
  }

  async findLatestSpecification(briefId: string, conceptId: string): Promise<ElementSpecification | null> {
    if (!db) {
        return InMemoryStorage.instance.findLatestSpecification(briefId, conceptId);
    }
    const result = await db.select()
        .from(elementSpecifications)
        .where(
            and(
                eq(elementSpecifications.briefId, briefId),
                eq(elementSpecifications.conceptId, conceptId)
            )
        )
        .orderBy(desc(elementSpecifications.createdAt))
        .limit(1);
    return result[0] || null;
  }
}

class InMemoryStorage implements IStorage {
  static instance = new InMemoryStorage();
  private items: Brief[] = [];
  // private enhancedBriefs: EnhancedBrief[] = []; // Removed
  private concepts: Concept[] = [];
  private selectedConcepts: SelectedConcept[] = [];

  async createBrief(insertBrief: InsertBrief): Promise<Brief> {
    const newBriefId = uuidv4(); // Generate UUID for in-memory briefs
    const brief = {
      id: newBriefId,
      projectName: insertBrief.projectName ?? null,
      targetAudience: insertBrief.targetAudience ?? null,
      keyMessage: insertBrief.keyMessage ?? null,
      brandGuidelines: insertBrief.brandGuidelines ?? null,
      bannerSizes: insertBrief.bannerSizes ?? null,
      brandContext: insertBrief.brandContext ?? null,
      objective: insertBrief.objective ?? null,
      consumerJourney: insertBrief.consumerJourney ?? null,
      emotionalConnection: insertBrief.emotionalConnection ?? null,
      visualStyle: insertBrief.visualStyle ?? null,
      performanceMetrics: insertBrief.performanceMetrics ?? null,
      // shareId: generateId(10), // Removed
      // isPublic: false, // Removed
      createdAt: new Date(),
      // updatedAt: new Date(), // Removed
      userId: insertBrief.userId, // Use the provided userId
      enhancedBrief: insertBrief.enhancedBrief ?? null, // Add enhancedBrief
      enhancedBriefUpdatedAt: insertBrief.enhancedBriefUpdatedAt ?? null, // Add enhancedBriefUpdatedAt
    } as Brief; // Cast to Brief to satisfy type checker
    this.items.push(brief);

    return brief;
  }

  async getBrief(id: string): Promise<Brief | null> {
    const brief = this.items.find(b => b.id === id) || null;
    return brief ? brief : null;
  }

  async getAllBriefs(): Promise<Brief[]> {
    return this.items;
  }

  async updateBrief(id: string, updates: Partial<Pick<InsertBrief, 'enhancedBrief'>>): Promise<Brief> {
    const briefIndex = this.items.findIndex(b => b.id === id);
    if (briefIndex === -1) {
      throw new Error('Brief not found in-memory.');
    }
    const updatedBrief = {
      ...this.items[briefIndex],
      ...updates,
      enhancedBriefUpdatedAt: new Date(),
    } as Brief;
    this.items[briefIndex] = updatedBrief;
    return updatedBrief;
  }

  async saveConcept(briefId: string, concept: Omit<InsertConcept, 'briefId'>): Promise<Concept> {
    const newConcept: Concept = {
      ...concept,
      id: uuidv4(),
      briefId: briefId,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: concept.title,
      description: concept.description ?? null,
      elements: concept.elements ?? {},
      midjourneyPrompts: concept.midjourneyPrompts ?? {},
      rationale: concept.rationale ?? {},
    };
    this.concepts.push(newConcept);
    return newConcept;
  }

  async getConceptsByBriefId(briefId: string): Promise<Concept[]> {
    return this.concepts.filter(c => c.briefId === briefId);
  }

  async saveSelectedConcept(insertSelectedConcept: InsertSelectedConcept): Promise<SelectedConcept> {
    const selectedConcept: SelectedConcept = {
      id: uuidv4(),
      conceptId: insertSelectedConcept.conceptId,
      briefId: insertSelectedConcept.briefId,
      userId: insertSelectedConcept.userId,
      selectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.selectedConcepts.push(selectedConcept);
    return selectedConcept;
  }

  async getSelectedConceptByBriefId(briefId: string): Promise<SelectedConcept | null> {
    return this.selectedConcepts.find(sc => sc.briefId === briefId) || null;
  }

  async getConceptById(id: string): Promise<Concept | null> {
    return this.concepts.find(c => c.id === id) || null;
  }

  async storeReferenceImage(data: Omit<InsertReferenceImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ReferenceImage> {
    const { conceptId, imageBase64 } = data;
    console.log('In-memory storage: Reference image stored for concept:', conceptId);
    console.log('Image data length:', imageBase64.length);
    const path = `in-memory/${conceptId}/${Date.now()}.png`;

    const newImage: ReferenceImage = {
        id: uuidv4(),
        imageUrl: path,
        imagePath: path,
        fileName: path,
        ...data,
        imageData: data.imageData || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        fileSize: null,
        mimeType: null,
    };
    return newImage;
  }

  async storeElementImage(data: Omit<InsertElementImage, 'imageUrl' | 'imagePath' | 'fileName'> & { imageBase64: string; }): Promise<ElementImage> {
    const { briefId, elementId, imageType, imageBase64 } = data;
    console.log(`In-memory storage: Element image stored for brief ${briefId}, element ${elementId}`);
    console.log('Image data length:', imageBase64.length);
    const path = `in-memory/${briefId}/${elementId}_${imageType}.png`;

    const newImage: ElementImage = {
        id: uuidv4(),
        imageUrl: path,
        imagePath: path,
        fileName: path,
        ...data,
        imageData: data.imageData || {},
        imageType: data.imageType,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileSize: null,
        mimeType: null,
    };
    return newImage;
  }
  
  async findReferenceImage(params: { userId: string; briefId: string; conceptId: string }): Promise<ReferenceImage | null> {
    console.log(`In-memory storage: Finding reference image for user ${params.userId}, brief ${params.briefId}, concept ${params.conceptId}`);
    return null; // Not implemented for in-memory
  }

  async findOrphanedImageInStorage(conceptId: string): Promise<{ path: string; name: string } | null> {
      console.log(`In-memory storage: Checking for orphaned images for concept ${conceptId}`);
      return null;
  }

  async createReferenceImageRecord(data: InsertReferenceImage): Promise<ReferenceImage> {
      console.log(`In-memory storage: Creating reference image record`);
      const newImage: ReferenceImage = {
          id: uuidv4(),
          userId: data.userId,
          briefId: data.briefId,
          conceptId: data.conceptId,
          imageUrl: data.imageUrl,
          imagePath: data.imagePath || null,
          fileName: data.fileName || null,
          fileSize: data.fileSize || null,
          mimeType: data.mimeType || null,
          imageData: data.imageData || {},
          promptUsed: data.promptUsed,
          createdAt: new Date(),
          updatedAt: new Date()
      };
      return newImage;
  }

  async findLatestSpecification(briefId: string, conceptId: string): Promise<ElementSpecification | null> {
      console.log(`In-memory storage: Finding latest specification for brief ${briefId} and concept ${conceptId}`);
      return null;
  }

  async getPublicUrl(bucketName: string, fileName: string): Promise<string> {
      console.log(`In-memory storage: Getting public url for ${fileName} in bucket ${bucketName}`);
      return `https://mock.storage.com/${bucketName}/${fileName}`;
  }

  // Mock implementations for new methods
  async createElementSpecification(briefId: string, conceptId: string, specificationData: ElementSpecificationData, promptUsed: string, referenceImageId: string | undefined, aiModelUsed: string): Promise<ElementSpecification> {
    console.log('In-memory storage: Creating element specification');
    const spec: ElementSpecification = {
      id: uuidv4(),
      briefId,
      conceptId,
      userId: uuidv4(), // mock user id
      specificationData,
      promptUsed,
      referenceImageId: referenceImageId ?? null,
      aiModelUsed,
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return spec;
  }

  async getReferenceImage(id: string): Promise<ReferenceImage | null> {
    console.log(`In-memory storage: Getting reference image for id ${id}`);
    return null; // Not implemented for in-memory
  }

  async getLatestReferenceImageByConceptId(conceptId: string): Promise<ReferenceImage | null> {
      console.log(`In-memory storage: Getting latest reference image for concept id ${conceptId}`);
      return null; // Not implemented for in-memory
  }

  async getImageName(referenceImageId: string): Promise<string> {
    console.log(`In-memory storage: Getting image name for reference image id ${referenceImageId}`);
    return "mock-image-name.png";
  }

  async convertImageToBase64(imageUrl: string, compress: boolean = false): Promise<string> {
    console.log(`In-memory storage: Converting image to base64 for url ${imageUrl}, compress: ${compress}`);
    return compress ? "mock-base64-string" : "data:image/png;base64,mock-base64-string";
  }
}

export const storage = new DatabaseStorage();