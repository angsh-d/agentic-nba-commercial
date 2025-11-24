import type { Hcp, PrescriptionHistory, SwitchingEvent } from "@shared/schema";

export interface RLEngineOutput {
  topActions: Array<{
    action: string;
    actionType: "meeting" | "email" | "call" | "event";
    confidence: number;
    qValue: number;
    reasoning: string;
  }>;
  policyVersion: string;
  modelName: string;
}

export interface RulesEngineOutput {
  triggeredRules: Array<{
    ruleId: string;
    ruleName: string;
    condition: string;
    action: string;
    priority: "High" | "Medium" | "Low";
  }>;
  filters: string[];
  escalations: string[];
}

export interface LLMContextualization {
  narrative: string;
  adjustments: string[];
  hcpSpecificInsights: string[];
}

export interface NBAProvenance {
  rlContribution: RLEngineOutput;
  rulesContribution: RulesEngineOutput;
  llmContribution: LLMContextualization;
  finalSynthesis: {
    action: string;
    actionType: "meeting" | "email" | "call" | "event";
    priority: "High" | "Medium" | "Low";
    reason: string;
    synthesisRationale: string;
  };
}

/**
 * Simulated RL-based NBA Engine
 * In production, this would be a trained reinforcement learning model
 */
export function simulateRLEngine(
  hcp: Hcp,
  prescriptionHistory: PrescriptionHistory[],
  switchingEvent?: SwitchingEvent
): RLEngineOutput {
  const riskScore = hcp.switchRiskScore || 0;
  const hasSwitchingEvent = !!switchingEvent;
  
  // Simulate RL policy recommendations based on state
  const topActions = [];
  
  if (hasSwitchingEvent) {
    topActions.push({
      action: "Schedule urgent face-to-face meeting within 48 hours",
      actionType: "meeting" as const,
      confidence: 0.92,
      qValue: 8.7,
      reasoning: "Historical data shows 87% success rate in reversing switches with immediate engagement"
    });
    topActions.push({
      action: "Send comparative clinical data email",
      actionType: "email" as const,
      confidence: 0.78,
      qValue: 6.3,
      reasoning: "Q-learning indicates data-driven communication has high value in post-switch scenarios"
    });
  } else if (riskScore >= 70) {
    topActions.push({
      action: "Proactive relationship-building call",
      actionType: "call" as const,
      confidence: 0.85,
      qValue: 7.4,
      reasoning: "Policy learned that early intervention prevents 73% of high-risk switches"
    });
    topActions.push({
      action: "Invite to educational dinner event",
      actionType: "event" as const,
      confidence: 0.71,
      qValue: 5.9,
      reasoning: "Social engagement shows strong retention value for high-risk HCPs"
    });
  } else if (riskScore >= 40) {
    topActions.push({
      action: "Send monthly clinical update email",
      actionType: "email" as const,
      confidence: 0.68,
      qValue: 4.2,
      reasoning: "Moderate-risk HCPs respond well to regular informational touchpoints"
    });
    topActions.push({
      action: "Schedule quarterly check-in call",
      actionType: "call" as const,
      confidence: 0.64,
      qValue: 3.8,
      reasoning: "Maintain engagement cadence to prevent risk escalation"
    });
  } else {
    topActions.push({
      action: "Add to monthly newsletter distribution",
      actionType: "email" as const,
      confidence: 0.55,
      qValue: 2.1,
      reasoning: "Low-risk HCPs benefit from passive engagement maintenance"
    });
  }
  
  return {
    topActions: topActions.slice(0, 3),
    policyVersion: "v2.7.3",
    modelName: "DQN-Pharma-Oncology"
  };
}

/**
 * Simulated Business Rules Engine
 * In production, this would be a configurable rule engine with business logic
 */
export function simulateRulesEngine(
  hcp: Hcp,
  prescriptionHistory: PrescriptionHistory[],
  switchingEvent?: SwitchingEvent
): RulesEngineOutput {
  const triggeredRules = [];
  const filters = [];
  const escalations = [];
  
  const riskScore = hcp.switchRiskScore || 0;
  const riskTier = hcp.switchRiskTier;
  
  // Rule 1: Critical Risk Escalation
  if (riskScore >= 80 || riskTier === "critical") {
    triggeredRules.push({
      ruleId: "R001",
      ruleName: "Critical Risk Escalation",
      condition: "switchRiskScore >= 80 OR switchRiskTier = 'critical'",
      action: "Escalate to district manager + require urgent meeting",
      priority: "High" as const
    });
    escalations.push("District Manager notification sent");
  }
  
  // Rule 2: Switching Event Response
  if (switchingEvent) {
    triggeredRules.push({
      ruleId: "R002",
      ruleName: "Switching Event Response Protocol",
      condition: "switchingEvent EXISTS",
      action: "Trigger 48-hour response protocol + competitive analysis",
      priority: "High" as const
    });
    escalations.push("48-hour response timer initiated");
  }
  
  // Rule 3: Access Barrier Support
  if (hcp.switchRiskReasons?.includes("Access barriers")) {
    triggeredRules.push({
      ruleId: "R003",
      ruleName: "Access Barrier Support",
      condition: "switchRiskReasons CONTAINS 'Access barriers'",
      action: "Offer copay assistance + PA support resources",
      priority: "High" as const
    });
  }
  
  // Rule 4: High-Value HCP Retention
  if (riskScore >= 50 && hcp.engagementLevel === "high") {
    triggeredRules.push({
      ruleId: "R004",
      ruleName: "High-Value HCP Retention",
      condition: "switchRiskScore >= 50 AND engagementLevel = 'high'",
      action: "Assign dedicated account manager",
      priority: "Medium" as const
    });
  }
  
  // Rule 5: Re-engagement Required
  const lastVisit = hcp.lastVisitDate ? new Date(hcp.lastVisitDate) : null;
  const daysSinceVisit = lastVisit ? (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceVisit > 90) {
    triggeredRules.push({
      ruleId: "R005",
      ruleName: "Re-engagement Required",
      condition: "daysSinceLastVisit > 90",
      action: "Schedule re-engagement meeting",
      priority: "Medium" as const
    });
  }
  
  // Filters
  if (riskScore < 30) {
    filters.push("Low-priority actions filtered due to low risk score");
  }
  
  return {
    triggeredRules,
    filters,
    escalations
  };
}

/**
 * Simulate LLM contextualization layer
 * This takes RL + Rules outputs and adds HCP-specific narrative
 */
export function simulateLLMContextualization(
  hcp: Hcp,
  rlOutput: RLEngineOutput,
  rulesOutput: RulesEngineOutput
): LLMContextualization {
  const narrative = `Based on ${hcp.name}'s profile, the optimal approach combines ${rlOutput.topActions[0]?.action.toLowerCase()} (highest Q-value: ${rlOutput.topActions[0]?.qValue}) with immediate ${rulesOutput.triggeredRules.length > 0 ? 'compliance with triggered business rules' : 'standard engagement protocols'}.`;
  
  const adjustments = [];
  const hcpSpecificInsights = [];
  
  // Add adjustments based on HCP characteristics
  if (hcp.engagementLevel === "low") {
    adjustments.push("Adjust communication style to be less technical, more relationship-focused");
  }
  
  if (hcp.specialty === "Oncologist - RCC") {
    hcpSpecificInsights.push("Emphasize RCC-specific efficacy data and renal safety profile");
  }
  
  if (hcp.hospital?.includes("Academic")) {
    hcpSpecificInsights.push("Frame discussion around latest clinical research and trial data");
  }
  
  // Add timing adjustments
  const lastVisit = hcp.lastVisitDate ? new Date(hcp.lastVisitDate) : null;
  if (lastVisit) {
    const daysSinceVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit < 14) {
      adjustments.push("Recent visit detected - consider email follow-up instead of in-person to avoid over-engagement");
    }
  }
  
  return {
    narrative,
    adjustments,
    hcpSpecificInsights
  };
}
