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
  switchRiskScore: integer("switch_risk_score").default(0), // 0-100 risk score
  switchRiskTier: text("switch_risk_tier").default("low"), // low, medium, high, critical
  switchRiskReasons: jsonb("switch_risk_reasons").$type<string[]>().default([]), // Array of risk factors
  lastRiskUpdate: timestamp("last_risk_update"),
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

// Prescription History - Track prescriptions over time for switching detection
export const prescriptionHistory = pgTable("prescription_history", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  productName: text("product_name").notNull(), // Our product or competitor
  productCategory: text("product_category").notNull(), // e.g., "immunotherapy", "targeted therapy"
  prescriptionCount: integer("prescription_count").notNull(),
  month: text("month").notNull(), // e.g., "2024-10"
  isOurProduct: integer("is_our_product").notNull().default(1), // 1 = our product, 0 = competitor
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrescriptionHistorySchema = createInsertSchema(prescriptionHistory).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPrescriptionHistorySchema = createSelectSchema(prescriptionHistory);
export type InsertPrescriptionHistory = z.infer<typeof insertPrescriptionHistorySchema>;
export type PrescriptionHistory = typeof prescriptionHistory.$inferSelect;

// Switching Events - Detected switching incidents
export const switchingEvents = pgTable("switching_events", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  fromProduct: text("from_product").notNull(), // Product they switched from
  toProduct: text("to_product").notNull(), // Product they switched to
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  switchType: text("switch_type").notNull(), // "gradual", "sudden", "complete"
  impactLevel: text("impact_level").notNull(), // "low", "medium", "high", "critical"
  rootCauses: jsonb("root_causes").$type<string[]>().default([]), // Identified causes
  status: text("status").notNull().default("active"), // active, addressed, monitoring
  aiAnalysis: text("ai_analysis").notNull(), // Detailed AI explanation
});

export const insertSwitchingEventSchema = createInsertSchema(switchingEvents).omit({ 
  id: true, 
  detectedAt: true 
});
export const selectSwitchingEventSchema = createSelectSchema(switchingEvents);
export type InsertSwitchingEvent = z.infer<typeof insertSwitchingEventSchema>;
export type SwitchingEvent = typeof switchingEvents.$inferSelect;

// Agent Sessions - Track multi-agent reasoning sessions
export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  goalDescription: text("goal_description").notNull(), // High-level goal
  goalType: text("goal_type").notNull(), // "nba_generation", "territory_planning", "switching_analysis"
  status: text("status").notNull().default("in_progress"), // in_progress, completed, failed
  currentPhase: text("current_phase"), // Current agent phase
  contextData: jsonb("context_data").$type<Record<string, any>>(), // Session context
  finalOutcome: text("final_outcome"), // Result summary
  confidenceScore: integer("confidence_score"), // 0-100
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertAgentSessionSchema = createInsertSchema(agentSessions).omit({ 
  id: true, 
  startedAt: true 
});
export const selectAgentSessionSchema = createSelectSchema(agentSessions);
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
export type AgentSession = typeof agentSessions.$inferSelect;

// Agent Thoughts - Chain-of-thought reasoning traces
export const agentThoughts = pgTable("agent_thoughts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => agentSessions.id),
  agentType: text("agent_type").notNull(), // "planner", "analyst", "synthesizer", "reflector"
  thoughtType: text("thought_type").notNull(), // "observation", "reasoning", "action", "critique"
  content: text("content").notNull(), // The actual thought/reasoning
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context
  sequenceNumber: integer("sequence_number").notNull(), // Order in the session
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAgentThoughtSchema = createInsertSchema(agentThoughts).omit({ 
  id: true, 
  timestamp: true 
});
export const selectAgentThoughtSchema = createSelectSchema(agentThoughts);
export type InsertAgentThought = z.infer<typeof insertAgentThoughtSchema>;
export type AgentThought = typeof agentThoughts.$inferSelect;

// Agent Actions - Concrete actions taken by agents
export const agentActions = pgTable("agent_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => agentSessions.id),
  agentType: text("agent_type").notNull(),
  actionType: text("action_type").notNull(), // "query_data", "generate_nba", "create_plan", "analyze_pattern"
  actionDescription: text("action_description").notNull(),
  actionParams: jsonb("action_params").$type<Record<string, any>>(),
  result: jsonb("result").$type<Record<string, any>>(),
  success: integer("success").notNull().default(1), // 1 = success, 0 = failure
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const insertAgentActionSchema = createInsertSchema(agentActions).omit({ 
  id: true, 
  executedAt: true 
});
export const selectAgentActionSchema = createSelectSchema(agentActions);
export type InsertAgentAction = z.infer<typeof insertAgentActionSchema>;
export type AgentAction = typeof agentActions.$inferSelect;

// Agent Feedback - Self-reflection and learning
export const agentFeedback = pgTable("agent_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => agentSessions.id),
  feedbackType: text("feedback_type").notNull(), // "self_critique", "outcome_evaluation", "lesson_learned"
  agentType: text("agent_type").notNull(),
  critique: text("critique").notNull(), // What went well/poorly
  improvementSuggestion: text("improvement_suggestion"), // How to improve
  confidenceDelta: integer("confidence_delta"), // Change in confidence (-100 to +100)
  lessonsLearned: jsonb("lessons_learned").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentFeedbackSchema = createInsertSchema(agentFeedback).omit({ 
  id: true, 
  createdAt: true 
});
export const selectAgentFeedbackSchema = createSelectSchema(agentFeedback);
export type InsertAgentFeedback = z.infer<typeof insertAgentFeedbackSchema>;
export type AgentFeedback = typeof agentFeedback.$inferSelect;
