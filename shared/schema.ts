import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Healthcare Providers (HCPs)
export const hcps = pgTable("hcps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  hospital: text("hospital").notNull(),
  territory: text("territory").notNull(),
  lastVisitDate: timestamp("last_visit_date"),
  engagementLevel: text("engagement_level").notNull().default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHcpSchema = createInsertSchema(hcps).omit({ 
  id: true, 
  createdAt: true 
});
export const selectHcpSchema = createSelectSchema(hcps);
export type InsertHcp = z.infer<typeof insertHcpSchema>;
export type Hcp = typeof hcps.$inferSelect;

// Next Best Actions - AI-generated recommendations
export const nextBestActions = pgTable("next_best_actions", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  action: text("action").notNull(), // e.g., "Schedule Clinical Review"
  actionType: text("action_type").notNull(), // meeting, email, call, event
  priority: text("priority").notNull(), // High, Medium, Low
  reason: text("reason").notNull(), // Why this action is needed
  aiInsight: text("ai_insight").notNull(), // LLM-generated explanation
  status: text("status").notNull().default("pending"), // pending, completed, dismissed
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertNbaSchema = createInsertSchema(nextBestActions).omit({ 
  id: true, 
  generatedAt: true 
});
export const selectNbaSchema = createSelectSchema(nextBestActions);
export type InsertNba = z.infer<typeof insertNbaSchema>;
export type Nba = typeof nextBestActions.$inferSelect;

// Territory Plans - Agent Copilot generated orchestrations
export const territoryPlans = pgTable("territory_plans", {
  id: serial("id").primaryKey(),
  territory: text("territory").notNull(),
  planDate: timestamp("plan_date").notNull(),
  agentReasoning: text("agent_reasoning").notNull(), // Why this plan was generated
  steps: jsonb("steps").notNull().$type<TerritoryPlanStep[]>(), // Array of plan steps
  status: text("status").notNull().default("active"), // active, completed, archived
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export type TerritoryPlanStep = {
  time: string;
  type: "visit" | "email" | "meeting" | "call";
  title: string;
  hcpId: number;
  location: string;
  priority: "High" | "Medium" | "Low";
  reasoning: string;
  action: string;
  status: "pending" | "ready" | "confirmed" | "completed";
};

export const insertTerritoryPlanSchema = createInsertSchema(territoryPlans).omit({ 
  id: true, 
  generatedAt: true 
});
export const selectTerritoryPlanSchema = createSelectSchema(territoryPlans);
export type InsertTerritoryPlan = z.infer<typeof insertTerritoryPlanSchema>;
export type TerritoryPlan = typeof territoryPlans.$inferSelect;

// Switching Analytics - Root cause data
export const switchingAnalytics = pgTable("switching_analytics", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(), // e.g., "Q3 2024"
  clinicalEfficacy: integer("clinical_efficacy").notNull(), // percentage
  patientAccess: integer("patient_access").notNull(),
  sideEffects: integer("side_effects").notNull(),
  competitorPricing: integer("competitor_pricing").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSwitchingAnalyticsSchema = createInsertSchema(switchingAnalytics).omit({ 
  id: true, 
  updatedAt: true 
});
export const selectSwitchingAnalyticsSchema = createSelectSchema(switchingAnalytics);
export type InsertSwitchingAnalytics = z.infer<typeof insertSwitchingAnalyticsSchema>;
export type SwitchingAnalytics = typeof switchingAnalytics.$inferSelect;
