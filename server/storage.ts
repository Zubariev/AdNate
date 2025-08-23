// Storage layer with proper typing
import { db } from './db.js'; // Import db instance
import { Brief, briefs, Concept, concepts, InsertBrief, InsertConcept } from "@shared/schema.ts";
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Simple ID generator to avoid ES module issues
function generateId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface IStorage {
  createBrief(brief: InsertBrief, initialConcepts: Omit<InsertConcept, 'briefId'>[]): Promise<Brief>;
  getBrief(id: string): Promise<Brief | null>;
  getBriefByShareId(shareId: string): Promise<Brief | null>;
  getAllBriefs(): Promise<Brief[]>;
  updateBriefShare(id: string, isPublic: boolean): Promise<Brief>;
  saveConcept(briefId: string, concept: Omit<InsertConcept, 'briefId'>): Promise<Concept>;
}

export class DatabaseStorage implements IStorage {
  async createBrief(insertBrief: InsertBrief, initialConcepts: Omit<InsertConcept, 'briefId'>[]): Promise<Brief> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for createBrief.');
      return InMemoryStorage.instance.createBrief(insertBrief, initialConcepts);
    }

    try {
      const newBriefs = await db!.insert(briefs).values(insertBrief).returning();

      if (!newBriefs || newBriefs.length === 0) {
        throw new Error('Failed to create brief.');
      }
      const newBrief = newBriefs[0];

      // Insert initial concepts if provided
      let createdConcepts: Concept[] = [];
      if (initialConcepts && initialConcepts.length > 0) {
        const conceptsToInsert = initialConcepts.map(concept => ({
          ...concept,
          briefId: newBrief.id,
        }));
        createdConcepts = await db!.insert(concepts).values(conceptsToInsert).returning();
      }

      return { ...newBrief, concepts: createdConcepts };
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

      const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.briefId, id));

      return { ...brief, concepts: associatedConcepts };
    } catch (error) {
      console.error('Supabase brief retrieval failed:', error);
      return InMemoryStorage.instance.getBrief(id);
    }
  }

  async getBriefByShareId(shareId: string): Promise<Brief | null> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getBriefByShareId.');
      return InMemoryStorage.instance.getBriefByShareId(shareId);
    }

    try {
      const briefResult = await db!.select().from(briefs).where(eq(briefs.shareId, shareId)).limit(1);

      if (!briefResult || briefResult.length === 0) {
        return null;
      }
      const brief = briefResult[0];

      const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.briefId, brief.id));

      return { ...brief, concepts: associatedConcepts };
    } catch (error) {
      console.error('Supabase brief retrieval by shareId failed:', error);
      return InMemoryStorage.instance.getBriefByShareId(shareId);
    }
  }

  async getAllBriefs(): Promise<Brief[]> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getAllBriefs.');
      return InMemoryStorage.instance.getAllBriefs();
    }

    try {
      const briefResults = await db!.select().from(briefs).orderBy(desc(briefs.createdAt));

      const briefsWithConcepts: Brief[] = await Promise.all(briefResults.map(async (brief: Brief) => {
        const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.briefId, brief.id));
        return { ...brief, concepts: associatedConcepts };
      }));

      return briefsWithConcepts;
    } catch (error) {
      console.error('Supabase briefs retrieval failed:', error);
      return InMemoryStorage.instance.getAllBriefs();
    }
  }

  async updateBriefShare(id: string, isPublic: boolean): Promise<Brief> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for updateBriefShare.');
      return InMemoryStorage.instance.updateBriefShare(id, isPublic);
    }

    try {
      const updatedBriefs = await db!.update(briefs)
        .set({ isPublic, updatedAt: new Date() })
        .where(eq(briefs.id, id))
        .returning();

      if (!updatedBriefs || updatedBriefs.length === 0) {
        throw new Error('Brief not found for update.');
      }
      const updatedBrief = updatedBriefs[0];

      const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.briefId, id));

      return { ...updatedBrief, concepts: associatedConcepts };
    } catch (error) {
      console.error('Supabase brief update failed:', error);
      return InMemoryStorage.instance.updateBriefShare(id, isPublic);
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
}

class InMemoryStorage implements IStorage {
  static instance = new InMemoryStorage();
  private items: Brief[] = [];

  async createBrief(insertBrief: InsertBrief, initialConcepts: Omit<InsertConcept, 'briefId'>[]): Promise<Brief> {
    const newBriefId = uuidv4(); // Generate UUID for in-memory briefs
    const brief = {
      id: newBriefId,
      projectName: insertBrief.projectName,
      targetAudience: insertBrief.targetAudience,
      keyMessage: insertBrief.keyMessage,
      brandGuidelines: insertBrief.brandGuidelines,
      bannerSizes: insertBrief.bannerSizes,
      brandContext: insertBrief.brandContext ?? null,
      objective: insertBrief.objective ?? null,
      consumerJourney: insertBrief.consumerJourney ?? null,
      emotionalConnection: insertBrief.emotionalConnection ?? null,
      visualStyle: insertBrief.visualStyle ?? null,
      performanceMetrics: insertBrief.performanceMetrics ?? null,
      shareId: generateId(10),
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(), // Add updatedAt for consistency
      concepts: [] as Concept[]
    };
    this.items.push(brief);

    // Save initial concepts for in-memory brief
    if (initialConcepts && initialConcepts.length > 0) {
      const createdConcepts = initialConcepts.map(concept => ({
        ...concept, id: uuidv4(), briefId: newBriefId, createdAt: new Date(), updatedAt: new Date(), title: concept.title, description: concept.description ?? null,
        elements: concept.elements ?? null,
        midjourneyPrompts: concept.midjourneyPrompts ?? null,
        rationale: concept.rationale ?? null,
       }));
      brief.concepts.push(...createdConcepts);
    }

    return brief;
  }

  async getBrief(id: string): Promise<Brief | null> {
    const brief = this.items.find(b => b.id === id) || null;
    return brief ? { ...brief, concepts: brief.concepts || [] } : null; // Ensure concepts array is always present
  }

  async getBriefByShareId(shareId: string): Promise<Brief | null> {
    const brief = this.items.find(b => b.shareId === shareId) || null;
    return brief ? { ...brief, concepts: brief.concepts || [] } : null;
  }

  async getAllBriefs(): Promise<Brief[]> {
    return this.items.map(brief => ({ ...brief, concepts: brief.concepts || [] }));
  }

  async updateBriefShare(id: string, isPublic: boolean): Promise<Brief> {
    const brief = this.items.find(b => b.id === id);
    if (!brief) throw new Error('Brief not found');
    brief.isPublic = isPublic;
    brief.updatedAt = new Date(); // Update updatedAt field
    return brief;
  }

  async saveConcept(briefId: string, concept: Omit<InsertConcept, 'briefId'>): Promise<Concept> {
    const brief = this.items.find(b => b.id === briefId);
    if (!brief) throw new Error('Brief not found');
    
    const newConcept: Concept = {
      ...concept,
      id: uuidv4(),
      briefId: briefId,
      createdAt: new Date(),
      updatedAt: new Date(),
      elements: concept.elements ?? null, // Ensure elements is always an object
      midjourneyPrompts: concept.midjourneyPrompts ?? null, // Ensure midjourneyPrompts is always an object
      rationale: concept.rationale ?? null, // Ensure rationale is always an object
      title: concept.title,
      description: concept.description ?? null,
    };

    if (!brief.concepts) { // Initialize if undefined
      brief.concepts = [];
    }
    brief.concepts.push(newConcept);
    brief.updatedAt = new Date(); // Update brief's updatedAt field when concept is saved
    return newConcept;
  }
}

export const storage = new DatabaseStorage();