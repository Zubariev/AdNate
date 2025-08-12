import { briefs, type Brief, type InsertBrief } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  createBrief(brief: InsertBrief): Promise<Brief>;
  getBrief(id: number): Promise<Brief | undefined>;
  getBriefByShareId(shareId: string): Promise<Brief | undefined>;
  getAllBriefs(): Promise<Brief[]>;
  updateBriefShare(id: number, isPublic: boolean): Promise<Brief>;
}

export class DatabaseStorage implements IStorage {
  async createBrief(insertBrief: InsertBrief): Promise<Brief> {
    if (!db) return InMemoryStorage.instance.createBrief(insertBrief);
    const shareId = nanoid(10);
    const [brief] = await db
      .insert(briefs)
      .values({ ...insertBrief, shareId })
      .returning();
    return brief;
  }

  async getBrief(id: number): Promise<Brief | undefined> {
    if (!db) return InMemoryStorage.instance.getBrief(id);
    const [brief] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.id, id));
    return brief || undefined;
  }

  async getBriefByShareId(shareId: string): Promise<Brief | undefined> {
    if (!db) return InMemoryStorage.instance.getBriefByShareId(shareId);
    const [brief] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.shareId, shareId));
    return brief || undefined;
  }

  async getAllBriefs(): Promise<Brief[]> {
    if (!db) return InMemoryStorage.instance.getAllBriefs();
    return await db.select().from(briefs);
  }

  async updateBriefShare(id: number, isPublic: boolean): Promise<Brief> {
    if (!db) return InMemoryStorage.instance.updateBriefShare(id, isPublic);
    const [brief] = await db
      .update(briefs)
      .set({ isPublic })
      .where(eq(briefs.id, id))
      .returning();
    return brief;
  }
}

class InMemoryStorage implements IStorage {
  static instance = new InMemoryStorage();
  private items: Brief[] = [];
  private nextId = 1;

  async createBrief(insertBrief: InsertBrief): Promise<Brief> {
    const brief: Brief = {
      id: this.nextId++,
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
      concepts: insertBrief.concepts,
      shareId: nanoid(10),
      isPublic: false,
      createdAt: new Date()
    } as Brief;
    this.items.push(brief);
    return brief;
  }

  async getBrief(id: number): Promise<Brief | undefined> {
    return this.items.find(b => b.id === id);
  }

  async getBriefByShareId(shareId: string): Promise<Brief | undefined> {
    return this.items.find(b => b.shareId === shareId);
  }

  async getAllBriefs(): Promise<Brief[]> {
    return [...this.items];
  }

  async updateBriefShare(id: number, isPublic: boolean): Promise<Brief> {
    const brief = this.items.find(b => b.id === id);
    if (!brief) throw new Error('Brief not found');
    brief.isPublic = isPublic;
    return brief;
  }
}

export const storage = new DatabaseStorage();