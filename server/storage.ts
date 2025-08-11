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
    const shareId = nanoid(10); // Generate a unique share ID
    const [brief] = await db
      .insert(briefs)
      .values({ ...insertBrief, shareId })
      .returning();
    return brief;
  }

  async getBrief(id: number): Promise<Brief | undefined> {
    const [brief] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.id, id));
    return brief || undefined;
  }

  async getBriefByShareId(shareId: string): Promise<Brief | undefined> {
    const [brief] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.shareId, shareId));
    return brief || undefined;
  }

  async getAllBriefs(): Promise<Brief[]> {
    return await db.select().from(briefs);
  }

  async updateBriefShare(id: number, isPublic: boolean): Promise<Brief> {
    const [brief] = await db
      .update(briefs)
      .set({ isPublic })
      .where(eq(briefs.id, id))
      .returning();
    return brief;
  }
}

export const storage = new DatabaseStorage();