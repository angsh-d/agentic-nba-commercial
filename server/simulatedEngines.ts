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
    // Check if this is an access-barrier scenario
    const hasAccessBarriers = hcp.switchRiskReasons?.some(r => 
      r.toLowerCase().includes("access") || r.toLowerCase().includes("barrier") || r.toLowerCase().includes("payer")
    );
    
    const reasoning = hasAccessBarriers
      ? "Early intervention saved 9 of 12 barrier patients (75% retention) in access-crisis cohort | Policy v2.7 vs v2.6: +23% success rate"
      : "Policy learned that early intervention prevents 73% of high-risk switches | Historical success rate: 87% retention with proactive engagement";
    
    topActions.push({
      action: "Proactive relationship-building call",
      actionType: "call" as const,
      confidence: 0.85,
      qValue: 7.4,
      reasoning
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
    escalations.push("District Manager notification sent → 24hr payer war-room committed");
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
      action: "Assign dedicated account manager → Priority copay assistance activation",
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
  // Create call theme based on HCP scenario (case-insensitive check)
  let callTheme = "";
  const hasAccessBarriers = hcp.switchRiskReasons?.some(r => 
    r.toLowerCase().includes("access") || r.toLowerCase().includes("barrier") || r.toLowerCase().includes("payer")
  );
  
  if (hasAccessBarriers) {
    callTheme = "🚨 Stop the $450 Copay Freefall";
  } else {
    callTheme = "Critical Intervention Window Open";
  }
  
  const narrative = `${callTheme} — The AI recommends starting with "${rlOutput.topActions[0]?.action}" because it has the highest historical success rate (Q-value: ${rlOutput.topActions[0]?.qValue}, ${Math.round((rlOutput.topActions[0]?.confidence || 0) * 100)}% confidence).`;
  
  const adjustments = [];
  const hcpSpecificInsights = [];
  
  // Add what's customized vs standard script
  if (hasAccessBarriers) {
    adjustments.push("Mentions the specific $450 copay amount and names 3 affected patients (instead of generic 'financial barriers')");
    adjustments.push("Uses real patient name 'Mr. Daniels' who switched due to Aetna PA denial (builds credibility)");
  }
  
  // Add timing considerations (can coexist with access-barrier guidance)
  const lastVisit = hcp.lastVisitDate ? new Date(hcp.lastVisitDate) : null;
  if (lastVisit) {
    const daysSinceVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit < 14) {
      adjustments.push(`Recommends email instead of office visit (${hcp.name} was just visited ${Math.round(daysSinceVisit)} days ago)`);
    }
  }
  
  // Add communication style adjustments
  if (hcp.engagementLevel === "low") {
    adjustments.push("Uses relationship-focused language instead of clinical data (matches low-engagement style)");
  }
  
  if (hcp.specialty === "Oncologist - RCC" || hcp.specialty === "Oncologist") {
    hcpSpecificInsights.push("RCC (kidney cancer) efficacy data and renal safety (matches ${hcp.name}'s specialty)");
  }
  
  if (hcp.hospital?.includes("Academic") || hcp.hospital?.includes("Cancer")) {
    hcpSpecificInsights.push("Latest clinical research and trial data (academic centers value evidence-based discussions)");
  }
  
  return {
    narrative,
    adjustments,
    hcpSpecificInsights
  };
}
