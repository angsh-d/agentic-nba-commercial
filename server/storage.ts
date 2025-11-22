import { db } from "../drizzle/db";
import { hcps, nextBestActions, territoryPlans, switchingAnalytics, prescriptionHistory, switchingEvents } from "@shared/schema";
import type { Hcp, InsertHcp, Nba, InsertNba, TerritoryPlan, InsertTerritoryPlan, SwitchingAnalytics, InsertSwitchingAnalytics, PrescriptionHistory, InsertPrescriptionHistory, SwitchingEvent, InsertSwitchingEvent } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

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
  
  // Prescription History operations
  createPrescriptionHistory(history: InsertPrescriptionHistory): Promise<PrescriptionHistory>;
  getPrescriptionHistory(hcpId: number): Promise<PrescriptionHistory[]>;
  
  // Switching Events operations
  getAllSwitchingEvents(): Promise<(SwitchingEvent & { hcp: Hcp })[]>;
  getSwitchingEventsByStatus(status: string): Promise<(SwitchingEvent & { hcp: Hcp })[]>;
  updateSwitchingEventStatus(id: number, status: string): Promise<void>;
  
  // High-risk HCPs
  getHighRiskHcps(minScore?: number): Promise<Hcp[]>;
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
  
  // Prescription History operations
  async createPrescriptionHistory(insertHistory: InsertPrescriptionHistory): Promise<PrescriptionHistory> {
    const results = await db.insert(prescriptionHistory).values(insertHistory).returning();
    return results[0];
  }
  
  async getPrescriptionHistory(hcpId: number): Promise<PrescriptionHistory[]> {
    return await db
      .select()
      .from(prescriptionHistory)
      .where(eq(prescriptionHistory.hcpId, hcpId))
      .orderBy(desc(prescriptionHistory.month));
  }
  
  // Switching Events operations
  async getAllSwitchingEvents(): Promise<(SwitchingEvent & { hcp: Hcp })[]> {
    const results = await db
      .select()
      .from(switchingEvents)
      .leftJoin(hcps, eq(switchingEvents.hcpId, hcps.id))
      .orderBy(desc(switchingEvents.detectedAt));
    
    return results.map((row) => ({
      ...row.switching_events,
      hcp: row.hcps!,
    }));
  }
  
  async getSwitchingEventsByStatus(status: string): Promise<(SwitchingEvent & { hcp: Hcp })[]> {
    const results = await db
      .select()
      .from(switchingEvents)
      .leftJoin(hcps, eq(switchingEvents.hcpId, hcps.id))
      .where(eq(switchingEvents.status, status))
      .orderBy(desc(switchingEvents.detectedAt));
    
    return results.map((row) => ({
      ...row.switching_events,
      hcp: row.hcps!,
    }));
  }
  
  async updateSwitchingEventStatus(id: number, status: string): Promise<void> {
    await db
      .update(switchingEvents)
      .set({ status })
      .where(eq(switchingEvents.id, id));
  }
  
  // High-risk HCPs
  async getHighRiskHcps(minScore: number = 50): Promise<Hcp[]> {
    return await db
      .select()
      .from(hcps)
      .where(sql`${hcps.switchRiskScore} >= ${minScore}`)
      .orderBy(desc(hcps.switchRiskScore));
  }
}

export const storage = new DatabaseStorage();
