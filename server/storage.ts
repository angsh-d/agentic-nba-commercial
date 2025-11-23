import { db } from "../drizzle/db";
import { hcps, nextBestActions, territoryPlans, switchingAnalytics, prescriptionHistory, switchingEvents, agentSessions, agentThoughts, agentActions, agentFeedback, patients, clinicalEvents, detectedSignals, signalCorrelations, aiInsights } from "@shared/schema";
import type { Hcp, InsertHcp, Nba, InsertNba, TerritoryPlan, InsertTerritoryPlan, SwitchingAnalytics, InsertSwitchingAnalytics, PrescriptionHistory, InsertPrescriptionHistory, SwitchingEvent, InsertSwitchingEvent, AgentSession, InsertAgentSession, AgentThought, InsertAgentThought, AgentAction, InsertAgentAction, AgentFeedback, InsertAgentFeedback, Patient, InsertPatient, ClinicalEvent, InsertClinicalEvent, DetectedSignal, InsertDetectedSignal, SignalCorrelation, InsertSignalCorrelation, AiInsight, InsertAiInsight } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // HCP operations
  getAllHcps(): Promise<Hcp[]>;
  getHcp(id: number): Promise<Hcp | undefined>;
  createHcp(hcp: InsertHcp): Promise<Hcp>;
  
  // Next Best Actions operations
  getAllNbas(): Promise<(Nba & { hcp: Hcp })[]>;
  getNbasByTerritory(territory: string): Promise<(Nba & { hcp: Hcp })[]>;
  getNbasByHcp(hcpId: number): Promise<Nba[]>;
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
  
  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatientsByHcp(hcpId: number): Promise<Patient[]>;
  
  // Clinical Event operations
  createClinicalEvent(event: InsertClinicalEvent): Promise<ClinicalEvent>;
  getClinicalEventsByHcp(hcpId: number): Promise<ClinicalEvent[]>;
  
  // Switching Events operations
  getAllSwitchingEvents(): Promise<(SwitchingEvent & { hcp: Hcp })[]>;
  getSwitchingEventsByStatus(status: string): Promise<(SwitchingEvent & { hcp: Hcp })[]>;
  updateSwitchingEventStatus(id: number, status: string): Promise<void>;
  
  // High-risk HCPs
  getHighRiskHcps(minScore?: number): Promise<Hcp[]>;
  
  // Agent Session operations
  createAgentSession(session: InsertAgentSession): Promise<AgentSession>;
  getAgentSession(id: number): Promise<AgentSession | undefined>;
  updateAgentSession(id: number, updates: Partial<AgentSession>): Promise<void>;
  getRecentAgentSessions(limit?: number): Promise<AgentSession[]>;
  getAgentSessionsByHcp(hcpId: number): Promise<AgentSession[]>;
  
  // Agent Thought operations
  createAgentThought(thought: InsertAgentThought): Promise<AgentThought>;
  getSessionThoughts(sessionId: number): Promise<AgentThought[]>;
  
  // Agent Action operations
  createAgentAction(action: InsertAgentAction): Promise<AgentAction>;
  getSessionActions(sessionId: number): Promise<AgentAction[]>;
  
  // Agent Feedback operations
  createAgentFeedback(feedback: InsertAgentFeedback): Promise<AgentFeedback>;
  getSessionFeedback(sessionId: number): Promise<AgentFeedback[]>;
  
  // Signal Detection operations
  createDetectedSignal(signal: InsertDetectedSignal): Promise<DetectedSignal>;
  getDetectedSignals(hcpId: number): Promise<DetectedSignal[]>;
  getAllActiveSignals(): Promise<DetectedSignal[]>;
  
  // Signal Correlation operations
  createSignalCorrelation(correlation: InsertSignalCorrelation): Promise<SignalCorrelation>;
  getAllActiveCorrelations(): Promise<SignalCorrelation[]>;
  
  // AI Insight operations
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;
  getAiInsights(hcpId: number): Promise<AiInsight[]>;
  getLatestAiInsight(hcpId: number): Promise<AiInsight | undefined>;
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

  async getNbasByHcp(hcpId: number): Promise<Nba[]> {
    return await db
      .select()
      .from(nextBestActions)
      .where(eq(nextBestActions.hcpId, hcpId))
      .orderBy(desc(nextBestActions.generatedAt));
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
  
  // Patient operations
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const results = await db.insert(patients).values(insertPatient).returning();
    return results[0];
  }
  
  async getPatientsByHcp(hcpId: number): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(eq(patients.hcpId, hcpId))
      .orderBy(desc(patients.createdAt));
  }
  
  // Clinical Event operations
  async createClinicalEvent(insertEvent: InsertClinicalEvent): Promise<ClinicalEvent> {
    const results = await db.insert(clinicalEvents).values(insertEvent).returning();
    return results[0];
  }
  
  async getClinicalEventsByHcp(hcpId: number): Promise<ClinicalEvent[]> {
    return await db
      .select()
      .from(clinicalEvents)
      .where(eq(clinicalEvents.hcpId, hcpId))
      .orderBy(desc(clinicalEvents.eventDate));
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
  
  // Agent Session operations
  async createAgentSession(insertSession: InsertAgentSession): Promise<AgentSession> {
    const results = await db.insert(agentSessions).values(insertSession).returning();
    return results[0];
  }
  
  async getAgentSession(id: number): Promise<AgentSession | undefined> {
    const results = await db.select().from(agentSessions).where(eq(agentSessions.id, id));
    return results[0];
  }
  
  async updateAgentSession(id: number, updates: Partial<AgentSession>): Promise<void> {
    await db.update(agentSessions).set(updates).where(eq(agentSessions.id, id));
  }
  
  async getRecentAgentSessions(limit: number = 10): Promise<AgentSession[]> {
    return await db
      .select()
      .from(agentSessions)
      .orderBy(desc(agentSessions.startedAt))
      .limit(limit);
  }

  async getAgentSessionsByHcp(hcpId: number): Promise<AgentSession[]> {
    return await db
      .select()
      .from(agentSessions)
      .where(sql`${agentSessions.contextData}->>'hcpId' = ${hcpId.toString()}`)
      .orderBy(desc(agentSessions.startedAt));
  }
  
  // Agent Thought operations
  async createAgentThought(insertThought: InsertAgentThought): Promise<AgentThought> {
    const results = await db.insert(agentThoughts).values(insertThought).returning();
    return results[0];
  }
  
  async getSessionThoughts(sessionId: number): Promise<AgentThought[]> {
    return await db
      .select()
      .from(agentThoughts)
      .where(eq(agentThoughts.sessionId, sessionId))
      .orderBy(agentThoughts.sequenceNumber);
  }
  
  // Agent Action operations
  async createAgentAction(insertAction: InsertAgentAction): Promise<AgentAction> {
    const results = await db.insert(agentActions).values(insertAction).returning();
    return results[0];
  }
  
  async getSessionActions(sessionId: number): Promise<AgentAction[]> {
    return await db
      .select()
      .from(agentActions)
      .where(eq(agentActions.sessionId, sessionId))
      .orderBy(desc(agentActions.executedAt));
  }
  
  // Agent Feedback operations
  async createAgentFeedback(insertFeedback: InsertAgentFeedback): Promise<AgentFeedback> {
    const results = await db.insert(agentFeedback).values(insertFeedback).returning();
    return results[0];
  }
  
  async getSessionFeedback(sessionId: number): Promise<AgentFeedback[]> {
    return await db
      .select()
      .from(agentFeedback)
      .where(eq(agentFeedback.sessionId, sessionId))
      .orderBy(desc(agentFeedback.createdAt));
  }
  
  // Signal Detection operations
  async createDetectedSignal(insertSignal: InsertDetectedSignal): Promise<DetectedSignal> {
    const results = await db.insert(detectedSignals).values(insertSignal).returning();
    return results[0];
  }
  
  async getDetectedSignals(hcpId: number): Promise<DetectedSignal[]> {
    return await db
      .select()
      .from(detectedSignals)
      .where(eq(detectedSignals.hcpId, hcpId))
      .orderBy(desc(detectedSignals.detectedAt));
  }
  
  async getAllActiveSignals(): Promise<DetectedSignal[]> {
    return await db
      .select()
      .from(detectedSignals)
      .where(eq(detectedSignals.status, 'active'))
      .orderBy(desc(detectedSignals.detectedAt));
  }
  
  // Signal Correlation operations
  async createSignalCorrelation(insertCorrelation: InsertSignalCorrelation): Promise<SignalCorrelation> {
    const results = await db.insert(signalCorrelations).values(insertCorrelation).returning();
    return results[0];
  }
  
  async getAllActiveCorrelations(): Promise<SignalCorrelation[]> {
    return await db
      .select()
      .from(signalCorrelations)
      .where(eq(signalCorrelations.isActive, 1))
      .orderBy(desc(signalCorrelations.correlationStrength));
  }
  
  // AI Insight operations
  async createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const results = await db.insert(aiInsights).values(insertInsight).returning();
    return results[0];
  }
  
  async getAiInsights(hcpId: number): Promise<AiInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.hcpId, hcpId))
      .orderBy(desc(aiInsights.generatedAt));
  }
  
  async getLatestAiInsight(hcpId: number): Promise<AiInsight | undefined> {
    const results = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.hcpId, hcpId))
      .orderBy(desc(aiInsights.generatedAt))
      .limit(1);
    return results[0];
  }
}

export const storage = new DatabaseStorage();
