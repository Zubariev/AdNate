// Simplified storage without strict typing for now

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
  createBrief(brief: any): Promise<any>;
  getBrief(id: number): Promise<any>;
  getBriefByShareId(shareId: string): Promise<any>;
  getAllBriefs(): Promise<any[]>;
  updateBriefShare(id: number, isPublic: boolean): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async createBrief(insertBrief: any): Promise<any> {
    // Use in-memory storage for now to avoid Drizzle version conflicts
    return InMemoryStorage.instance.createBrief(insertBrief);
  }

  async getBrief(id: number): Promise<any> {
    return InMemoryStorage.instance.getBrief(id);
  }

  async getBriefByShareId(shareId: string): Promise<any> {
    return InMemoryStorage.instance.getBriefByShareId(shareId);
  }

  async getAllBriefs(): Promise<any[]> {
    return InMemoryStorage.instance.getAllBriefs();
  }

  async updateBriefShare(id: number, isPublic: boolean): Promise<any> {
    return InMemoryStorage.instance.updateBriefShare(id, isPublic);
  }
}

class InMemoryStorage implements IStorage {
  static instance = new InMemoryStorage();
  private items: any[] = [];
  private nextId = 1;

  async createBrief(insertBrief: any): Promise<any> {
    const brief = {
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
      shareId: generateId(10),
      isPublic: false,
      createdAt: new Date()
    };
    this.items.push(brief);
    return brief;
  }

  async getBrief(id: number): Promise<any> {
    return this.items.find(b => b.id === id);
  }

  async getBriefByShareId(shareId: string): Promise<any> {
    return this.items.find(b => b.shareId === shareId);
  }

  async getAllBriefs(): Promise<any[]> {
    return [...this.items];
  }

  async updateBriefShare(id: number, isPublic: boolean): Promise<any> {
    const brief = this.items.find(b => b.id === id);
    if (!brief) throw new Error('Brief not found');
    brief.isPublic = isPublic;
    return brief;
  }
}

export const storage = new DatabaseStorage();