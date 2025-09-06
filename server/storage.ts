// Storage layer with proper typing
import { db, supabase } from './routes'; // Import db and supabase instances
import { Brief, briefs, Concept, concepts, InsertBrief, InsertConcept, InsertSelectedConcept, selectedConcepts, SelectedConcept } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
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
  storeReferenceImage(conceptId: string, referenceImage: string): Promise<string>;
  getPublicUrl(bucketName: string, fileName: string): Promise<string>;
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
    return supabase.storage.from(bucketName).getPublicUrl(fileName);
  }
  async storeReferenceImage(conceptId: string, referenceImage: string): Promise<string> {
    try {
      // referenceImage is a base64 data URL, extract the base64 part
      const base64Data = referenceImage.replace(/(^data:image\/\w+;base64,)/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const bucketName = 'reference-images';
      const fileName = `${conceptId}/${Date.now()}.png`;

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload to Supabase storage: ${error.message}`);
      }
      const publicUrl = await this.getPublicUrl(bucketName, fileName);
      console.log('Reference image successfully stored at:', publicUrl);
      return fileName;
    } catch (error) {
      console.error('Error storing reference image:', error);
      throw error;
    }
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
      selectedAt: new Date(),
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

  async storeReferenceImage(conceptId: string, referenceImage: string): Promise<string> {
    // For in-memory storage, store the base64 data in memory and return a mock path
    // In a real in-memory implementation, you might store this in a Map
    console.log('In-memory storage: Reference image stored for concept:', conceptId);
    console.log('Image data length:', referenceImage.length);
    return `in-memory/${conceptId}/${Date.now()}.png`;
  }
  
}

export const storage = new DatabaseStorage();