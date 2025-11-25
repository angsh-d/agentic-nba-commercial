import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Risk Score Factor - for explainability
export type RiskScoreFactor = {
  factorKey: string; // e.g., "declining_prescriptions"
  label: string; // e.g., "Declining Prescriptions"
  points: number; // Points awarded for this factor
  evidence: string; // Description/evidence (e.g., "Severe decline -64%")
  maxPoints: number; // Maximum possible points for this factor
};

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
  riskScoreBreakdown: jsonb("risk_score_breakdown").$type<RiskScoreFactor[]>(), // Detailed factor breakdown
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

// Patients - Individual patients with cohort data for causal analysis
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  patientCode: text("patient_code").notNull(), // Anonymous identifier like "P001"
  age: integer("age").notNull(),
  cancerType: text("cancer_type").notNull(), // e.g., "Renal Cell Carcinoma"
  cancerStage: text("cancer_stage").notNull(), // e.g., "Stage III"
  hasCardiovascularRisk: integer("has_cardiovascular_risk").notNull().default(0), // 1 = yes, 0 = no
  cardiovascularConditions: jsonb("cardiovascular_conditions").$type<string[]>().default([]), // e.g., ["Prior MI", "CHF"]
  currentDrug: text("current_drug").notNull(), // Current prescription
  cohort: text("cohort").notNull(), // "young_rcc", "cv_risk", "stable", "high_copay", "pa_denied", "fulfillment_delay", "smooth_access"
  switchedDate: timestamp("switched_date"), // When they switched (if applicable)
  switchedToDrug: text("switched_to_drug"), // What drug they switched to
  payer: text("payer"), // Insurance payer name (e.g., "United Healthcare")
  priorAuthStatus: text("prior_auth_status"), // "approved", "denied", "pending", "not_required"
  denialCode: text("denial_code"), // PA denial reason code (e.g., "step_edit_required")
  copayAmount: integer("copay_amount"), // Patient copay in dollars
  fulfillmentLagDays: integer("fulfillment_lag_days"), // Days from Rx to first fill
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPatientSchema = createSelectSchema(patients);
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Clinical Events - External events that influence prescribing (ASCO, AEs, publications)
export const clinicalEvents = pgTable("clinical_events", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").references(() => hcps.id), // Null if event is global (like ASCO)
  patientId: integer("patient_id").references(() => patients.id), // Null if not patient-specific
  eventType: text("event_type").notNull(), // "conference", "adverse_event", "publication", "webinar"
  eventTitle: text("event_title").notNull(), // e.g., "ASCO 2025 - ORION-Y Trial"
  eventDescription: text("event_description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  impact: text("impact").notNull(), // "high", "medium", "low"
  relatedDrug: text("related_drug"), // Drug mentioned in event
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClinicalEventSchema = createInsertSchema(clinicalEvents).omit({ 
  id: true, 
  createdAt: true 
});
export const selectClinicalEventSchema = createSelectSchema(clinicalEvents);
export type InsertClinicalEvent = z.infer<typeof insertClinicalEventSchema>;
export type ClinicalEvent = typeof clinicalEvents.$inferSelect;

// Prescription History - Track prescriptions over time for switching detection
export const prescriptionHistory = pgTable("prescription_history", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  patientId: integer("patient_id").references(() => patients.id), // Link to specific patient
  productName: text("product_name").notNull(), // Our product or competitor
  productCategory: text("product_category").notNull(), // e.g., "immunotherapy", "targeted therapy"
  prescriptionCount: integer("prescription_count").notNull(),
  month: text("month").notNull(), // e.g., "2024-10"
  isOurProduct: integer("is_our_product").notNull().default(1), // 1 = our product, 0 = competitor
  cohort: text("cohort"), // Patient cohort this prescription belongs to
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

// Payers - Insurance payers with policies and denial rates
export const payers = pgTable("payers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "United Healthcare", "Aetna"
  payerType: text("payer_type").notNull(), // "commercial", "medicare", "medicaid"
  marketShare: integer("market_share"), // Percentage 0-100
  priorAuthRequired: integer("prior_auth_required").notNull().default(1), // 1 = yes, 0 = no
  denialRate: integer("denial_rate").notNull().default(0), // Percentage 0-100 of PAs denied
  averageApprovalDays: integer("average_approval_days"), // Days to PA approval
  formularyTier: text("formulary_tier"), // "preferred", "non-preferred", "step_therapy"
  copayRange: text("copay_range"), // e.g., "$50-$200"
  policies: jsonb("policies").$type<string[]>().default([]), // ["step_edit_required", "quantity_limits"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPayerSchema = createInsertSchema(payers).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPayerSchema = createSelectSchema(payers);
export type InsertPayer = z.infer<typeof insertPayerSchema>;
export type Payer = typeof payers.$inferSelect;

// Access Events - Real-Time Transactional (RTT) data for access barriers
export const accessEvents = pgTable("access_events", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  payerId: integer("payer_id").references(() => payers.id),
  eventType: text("event_type").notNull(), // "pa_denial", "copay_issue", "prescription_abandonment", "fulfillment_delay"
  eventDate: timestamp("event_date").notNull(),
  drugName: text("drug_name").notNull(), // Drug affected
  denialReason: text("denial_reason"), // For PA denials
  denialCode: text("denial_code"), // Standardized code
  copayAmount: integer("copay_amount"), // For copay issues
  expectedCopay: integer("expected_copay"), // What patient expected
  lagDays: integer("lag_days"), // For fulfillment delays
  switchedToDrug: text("switched_to_drug"), // If they switched as a result
  switchDate: timestamp("switch_date"), // When they switched
  resolved: integer("resolved").notNull().default(0), // 1 = resolved, 0 = unresolved
  resolutionNotes: text("resolution_notes"),
  impact: text("impact").notNull(), // "high", "medium", "low"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccessEventSchema = createInsertSchema(accessEvents).omit({ 
  id: true, 
  createdAt: true 
});
export const selectAccessEventSchema = createSelectSchema(accessEvents);
export type InsertAccessEvent = z.infer<typeof insertAccessEventSchema>;
export type AccessEvent = typeof accessEvents.$inferSelect;

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

// Detected Signals - Weak signals detected by observation agent
export const detectedSignals = pgTable("detected_signals", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  signalType: text("signal_type").notNull(), // "rx_decline", "rx_spike", "event_attendance", "peer_influence", "adverse_event_cluster"
  signalStrength: integer("signal_strength").notNull(), // 1-10 strength score
  signalSource: text("signal_source").notNull(), // "prescription_history", "clinical_events", "peer_network"
  signalDescription: text("signal_description").notNull(), // Human-readable description
  contextData: jsonb("context_data").$type<Record<string, any>>(), // Additional signal metadata
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  status: text("status").notNull().default("active"), // active, correlated, dismissed
});

export const insertDetectedSignalSchema = createInsertSchema(detectedSignals).omit({ 
  id: true, 
  detectedAt: true 
});
export const selectDetectedSignalSchema = createSelectSchema(detectedSignals);
export type InsertDetectedSignal = z.infer<typeof insertDetectedSignalSchema>;
export type DetectedSignal = typeof detectedSignals.$inferSelect;

// Signal Correlations - Discovered temporal patterns between signals
export const signalCorrelations = pgTable("signal_correlations", {
  id: serial("id").primaryKey(),
  patternName: text("pattern_name").notNull(), // e.g., "ASCO Conference → RCC Switch Pattern"
  signalA: text("signal_a").notNull(), // First signal type
  signalB: text("signal_b").notNull(), // Second signal type
  temporalLag: integer("temporal_lag").notNull(), // Days between signal A and signal B
  correlationStrength: integer("correlation_strength").notNull(), // 0-100 confidence
  occurrenceCount: integer("occurrence_count").notNull(), // How many times this pattern occurred
  description: text("description").notNull(), // Explanation of the correlation
  discoveredBy: text("discovered_by").notNull().default("correlation_agent"), // Which agent discovered it
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  isActive: integer("is_active").notNull().default(1), // 1 = active pattern, 0 = retired
});

export const insertSignalCorrelationSchema = createInsertSchema(signalCorrelations).omit({ 
  id: true, 
  discoveredAt: true 
});
export const selectSignalCorrelationSchema = createSelectSchema(signalCorrelations);
export type InsertSignalCorrelation = z.infer<typeof insertSignalCorrelationSchema>;
export type SignalCorrelation = typeof signalCorrelations.$inferSelect;

// AI Insights - Narrative explanations for HCP risk stratification
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  insightType: text("insight_type").notNull(), // "risk_explanation", "signal_synthesis", "recommendation"
  narrative: text("narrative").notNull(), // AI-generated human-readable explanation
  keySignals: jsonb("key_signals").$type<string[]>().default([]), // Signal IDs that contributed
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  generatedBy: text("generated_by").notNull().default("narrative_generator"), // Which agent generated it
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When this insight becomes stale
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({ 
  id: true, 
  generatedAt: true 
});
export const selectAiInsightSchema = createSelectSchema(aiInsights);
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;

// Call Notes - Field rep visit notes (unstructured data source for agentic analysis)
export const callNotes = pgTable("call_notes", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  repName: text("rep_name").notNull(), // Sales rep who made the visit
  visitDate: timestamp("visit_date").notNull(), // When the visit occurred
  noteText: text("note_text").notNull(), // Unstructured free-text notes
  noteType: text("note_type").notNull().default("routine_visit"), // "routine_visit", "follow_up", "urgent", "virtual"
  keyTopics: jsonb("key_topics").$type<string[]>().default([]), // Extracted topics for filtering
  sentiment: text("sentiment"), // "positive", "neutral", "negative", "frustrated" (can be AI-extracted)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCallNoteSchema = createInsertSchema(callNotes).omit({ 
  id: true, 
  createdAt: true 
});
export const selectCallNoteSchema = createSelectSchema(callNotes);
export type InsertCallNote = z.infer<typeof insertCallNoteSchema>;
export type CallNote = typeof callNotes.$inferSelect;

// Payer Communications - Insurance/formulary policy documents (unstructured source)
export const payerCommunications = pgTable("payer_communications", {
  id: serial("id").primaryKey(),
  payerName: text("payer_name").notNull(), // e.g., "United Healthcare", "Aetna"
  documentType: text("document_type").notNull(), // "formulary_update", "policy_change", "pa_requirement", "tier_change"
  documentTitle: text("document_title").notNull(), // e.g., "Q3 2025 Formulary Update"
  documentText: text("document_text").notNull(), // Full text of the communication (can be long)
  effectiveDate: timestamp("effective_date"), // When policy takes effect
  products: jsonb("products").$type<string[]>().default([]), // Products mentioned in the document
  keyChanges: jsonb("key_changes").$type<string[]>().default([]), // AI-extracted key policy changes
  source: text("source").notNull(), // "email", "pdf", "portal", "fax"
  receivedDate: timestamp("received_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPayerCommunicationSchema = createInsertSchema(payerCommunications).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPayerCommunicationSchema = createSelectSchema(payerCommunications);
export type InsertPayerCommunication = z.infer<typeof insertPayerCommunicationSchema>;
export type PayerCommunication = typeof payerCommunications.$inferSelect;

// Generated Artifacts - AI-generated ready-to-use content (call scripts, email drafts, agendas)
export const generatedArtifacts = pgTable("generated_artifacts", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcps.id),
  nbaId: integer("nba_id").references(() => nextBestActions.id), // Optional link to NBA
  artifactType: text("artifact_type").notNull(), // "call_script", "email_draft", "meeting_agenda"
  actionType: text("action_type").notNull(), // "meeting", "email", "call", "event"
  title: text("title").notNull(), // e.g., "Call Script: Safety Data Review"
  content: jsonb("content").notNull().$type<ArtifactContent>(), // Type-specific structured content
  context: text("context"), // Background context used for generation
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export type ArtifactContent = CallScriptContent | EmailDraftContent | MeetingAgendaContent;

export type CallScriptContent = {
  type: "call_script";
  opening: string;
  keyPoints: string[];
  objectionHandling: { objection: string; response: string }[];
  closingStatement: string;
  followUpAction: string;
};

export type EmailDraftContent = {
  type: "email_draft";
  subject: string;
  greeting: string;
  body: string[];
  closing: string;
  signature: string;
  attachmentSuggestions?: string[];
};

export type MeetingAgendaContent = {
  type: "meeting_agenda";
  objective: string;
  duration: string;
  agenda: { time: string; topic: string; details: string }[];
  keyMessages: string[];
  materialsNeeded: string[];
  desiredOutcome: string;
};

export const insertGeneratedArtifactSchema = createInsertSchema(generatedArtifacts).omit({ 
  id: true, 
  generatedAt: true 
});
export const selectGeneratedArtifactSchema = createSelectSchema(generatedArtifacts);
export type InsertGeneratedArtifact = z.infer<typeof insertGeneratedArtifactSchema>;
export type GeneratedArtifact = typeof generatedArtifacts.$inferSelect;
