// Storage layer with proper typing
import { db } from './db.js'; // Import db instance
import { Brief, briefs, Concept, concepts, InsertBrief, InsertConcept, enhancedBriefs, InsertEnhancedBrief, EnhancedBrief, InsertSelectedConcept, selectedConcepts, SelectedConcept } from "@shared/schema.ts";
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
  createBrief(brief: InsertBrief): Promise<Brief>;
  getBrief(id: string): Promise<Brief | null>;
  getBriefByShareId(shareId: string): Promise<Brief | null>;
  getAllBriefs(): Promise<Brief[]>;
  updateBriefShare(id: string, isPublic: boolean): Promise<Brief>;
  createEnhancedBrief(enhancedBrief: InsertEnhancedBrief): Promise<EnhancedBrief>;
  getEnhancedBriefByBriefId(briefId: string): Promise<EnhancedBrief | null>;
  saveConcept(enhancedBriefId: string, concept: Omit<InsertConcept, 'enhancedBriefId'>): Promise<Concept>;
  getConceptsByEnhancedBriefId(enhancedBriefId: string): Promise<Concept[]>;
  saveSelectedConcept(selectedConcept: InsertSelectedConcept): Promise<SelectedConcept>;
  getSelectedConceptByBriefId(briefId: string): Promise<SelectedConcept | null>;
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

      return brief;
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

      return briefResults;
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

      return updatedBrief;
    } catch (error) {
      console.error('Supabase brief update failed:', error);
      throw error;
    }
  }

  async createEnhancedBrief(insertEnhancedBrief: InsertEnhancedBrief): Promise<EnhancedBrief> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for createEnhancedBrief.');
      return InMemoryStorage.instance.createEnhancedBrief(insertEnhancedBrief);
    }
    try {
      const newEnhancedBriefs = await db!.insert(enhancedBriefs).values(insertEnhancedBrief).returning();
      if (!newEnhancedBriefs || newEnhancedBriefs.length === 0) {
        throw new Error('Failed to create enhanced brief.');
      }
      return newEnhancedBriefs[0];
    } catch (error) {
      console.error('Supabase enhanced brief creation failed:', error);
      throw error;
    }
  }

  async getEnhancedBriefByBriefId(briefId: string): Promise<EnhancedBrief | null> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getEnhancedBriefByBriefId.');
      return InMemoryStorage.instance.getEnhancedBriefByBriefId(briefId);
    }
    try {
      const enhancedBriefResult = await db!.select().from(enhancedBriefs).where(eq(enhancedBriefs.briefId, briefId)).limit(1);
      if (!enhancedBriefResult || enhancedBriefResult.length === 0) {
        return null;
      }
      return enhancedBriefResult[0];
    } catch (error) {
      console.error('Supabase enhanced brief retrieval failed:', error);
      return InMemoryStorage.instance.getEnhancedBriefByBriefId(briefId);
    }
  }

  async saveConcept(enhancedBriefId: string, concept: Omit<InsertConcept, 'enhancedBriefId'>): Promise<Concept> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for saveConcept.');
      return InMemoryStorage.instance.saveConcept(enhancedBriefId, concept);
    }

    try {
      const newConcepts = await db!.insert(concepts).values({
        ...concept,
        enhancedBriefId: enhancedBriefId,
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

  async getConceptsByEnhancedBriefId(enhancedBriefId: string): Promise<Concept[]> {
    if (!db) {
      console.warn('Drizzle DB not initialized, falling back to in-memory storage for getConceptsByEnhancedBriefId.');
      return InMemoryStorage.instance.getConceptsByEnhancedBriefId(enhancedBriefId);
    }
    try {
      const associatedConcepts = await db!.select().from(concepts).where(eq(concepts.enhancedBriefId, enhancedBriefId));
      return associatedConcepts;
    } catch (error) {
      console.error('Supabase concept retrieval by enhanced brief ID failed:', error);
      return InMemoryStorage.instance.getConceptsByEnhancedBriefId(enhancedBriefId);
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
}

class InMemoryStorage implements IStorage {
  static instance = new InMemoryStorage();
  private items: Brief[] = [];
  private enhancedBriefs: EnhancedBrief[] = [];
  private concepts: Concept[] = [];
  private selectedConcepts: SelectedConcept[] = [];

  async createBrief(insertBrief: InsertBrief): Promise<Brief> {
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
    };
    this.items.push(brief);

    return brief;
  }

  async getBrief(id: string): Promise<Brief | null> {
    const brief = this.items.find(b => b.id === id) || null;
    return brief ? brief : null;
  }

  async getBriefByShareId(shareId: string): Promise<Brief | null> {
    const brief = this.items.find(b => b.shareId === shareId) || null;
    return brief ? brief : null;
  }

  async getAllBriefs(): Promise<Brief[]> {
    return this.items;
  }

  async updateBriefShare(id: string, isPublic: boolean): Promise<Brief> {
    const brief = this.items.find(b => b.id === id);
    if (!brief) throw new Error('Brief not found');
    brief.isPublic = isPublic;
    brief.updatedAt = new Date(); // Update updatedAt field
    return brief;
  }

  async createEnhancedBrief(insertEnhancedBrief: InsertEnhancedBrief): Promise<EnhancedBrief> {
    const enhancedBrief: EnhancedBrief = {
      id: uuidv4(),
      briefId: insertEnhancedBrief.briefId,
      enhancedContent: insertEnhancedBrief.enhancedContent,
      createdAt: new Date(),
    };
    this.enhancedBriefs.push(enhancedBrief);
    return enhancedBrief;
  }

  async getEnhancedBriefByBriefId(briefId: string): Promise<EnhancedBrief | null> {
    return this.enhancedBriefs.find(eb => eb.briefId === briefId) || null;
  }

  async saveConcept(enhancedBriefId: string, concept: Omit<InsertConcept, 'enhancedBriefId'>): Promise<Concept> {
    const newConcept: Concept = {
      ...concept,
      id: uuidv4(),
      enhancedBriefId: enhancedBriefId,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: concept.title,
      description: concept.description ?? null,
      elements: concept.elements ?? null,
      midjourneyPrompts: concept.midjourneyPrompts ?? null,
      rationale: concept.rationale ?? null,
    };
    this.concepts.push(newConcept);
    return newConcept;
  }

  async getConceptsByEnhancedBriefId(enhancedBriefId: string): Promise<Concept[]> {
    return this.concepts.filter(c => c.enhancedBriefId === enhancedBriefId);
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
}

export const storage = new DatabaseStorage();