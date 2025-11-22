import { db } from "../drizzle/db";
import { hcps, nextBestActions, territoryPlans, switchingAnalytics } from "@shared/schema";
import type { Hcp, InsertHcp, Nba, InsertNba, TerritoryPlan, InsertTerritoryPlan, SwitchingAnalytics, InsertSwitchingAnalytics } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // HCP operations
  getAllHcps(): Promise<Hcp[]>;
  getHcp(id: number): Promise<Hcp | undefined>;
  createHcp(hcp: InsertHcp): Promise<Hcp>;
  
  // Next Best Actions operations
  getAllNbas(): Promise<(Nba & { hcp: Hcp })[]>;
  getNbasByTerritory(territory: string): Promise<(Nba & { hcp: Hcp })[]>;
  createNba(nba: InsertNba): Promise<Nba>;
  updateNbaStatus(id: number, status: string): Promise<void>;
  
  // Territory Plans operations
  getTerritoryPlan(territory: string, date: Date): Promise<TerritoryPlan | undefined>;
  createTerritoryPlan(plan: InsertTerritoryPlan): Promise<TerritoryPlan>;
  
  // Switching Analytics operations
  getLatestAnalytics(): Promise<SwitchingAnalytics | undefined>;
  createAnalytics(analytics: InsertSwitchingAnalytics): Promise<SwitchingAnalytics>;
}

export class DatabaseStorage implements IStorage {
  // HCP operations
  async getAllHcps(): Promise<Hcp[]> {
    return await db.select().from(hcps);
  }

  async getHcp(id: number): Promise<Hcp | undefined> {
    const results = await db.select().from(hcps).where(eq(hcps.id, id));
    return results[0];
  }

  async createHcp(insertHcp: InsertHcp): Promise<Hcp> {
    const results = await db.insert(hcps).values(insertHcp).returning();
    return results[0];
  }

  // Next Best Actions operations
  async getAllNbas(): Promise<(Nba & { hcp: Hcp })[]> {
    const results = await db
      .select()
      .from(nextBestActions)
      .leftJoin(hcps, eq(nextBestActions.hcpId, hcps.id))
      .orderBy(desc(nextBestActions.generatedAt));
    
    return results.map((row) => ({
      ...row.next_best_actions,
      hcp: row.hcps!,
    }));
  }

  async getNbasByTerritory(territory: string): Promise<(Nba & { hcp: Hcp })[]> {
    const results = await db
      .select()
      .from(nextBestActions)
      .leftJoin(hcps, eq(nextBestActions.hcpId, hcps.id))
      .where(eq(hcps.territory, territory))
      .orderBy(desc(nextBestActions.generatedAt));
    
    return results.map((row) => ({
      ...row.next_best_actions,
      hcp: row.hcps!,
    }));
  }

  async createNba(insertNba: InsertNba): Promise<Nba> {
    const results = await db.insert(nextBestActions).values(insertNba).returning();
    return results[0];
  }

  async updateNbaStatus(id: number, status: string): Promise<void> {
    await db
      .update(nextBestActions)
      .set({ status, completedAt: status === "completed" ? new Date() : null })
      .where(eq(nextBestActions.id, id));
  }

  // Territory Plans operations
  async getTerritoryPlan(territory: string, date: Date): Promise<TerritoryPlan | undefined> {
    const results = await db
      .select()
      .from(territoryPlans)
      .where(eq(territoryPlans.territory, territory))
      .orderBy(desc(territoryPlans.generatedAt))
      .limit(1);
    
    return results[0];
  }

  async createTerritoryPlan(insertPlan: InsertTerritoryPlan): Promise<TerritoryPlan> {
    const results = await db.insert(territoryPlans).values(insertPlan).returning();
    return results[0];
  }

  // Switching Analytics operations
  async getLatestAnalytics(): Promise<SwitchingAnalytics | undefined> {
    const results = await db
      .select()
      .from(switchingAnalytics)
      .orderBy(desc(switchingAnalytics.updatedAt))
      .limit(1);
    
    return results[0];
  }

  async createAnalytics(insertAnalytics: InsertSwitchingAnalytics): Promise<SwitchingAnalytics> {
    const results = await db.insert(switchingAnalytics).values(insertAnalytics).returning();
    return results[0];
  }
}

export const storage = new DatabaseStorage();
