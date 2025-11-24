import { AzureOpenAI } from "openai";
import "@azure/openai/types";
import type { Hcp, PrescriptionHistory, SwitchingEvent } from "@shared/schema";
import { 
  simulateRLEngine, 
  simulateRulesEngine, 
  simulateLLMContextualization,
  type NBAProvenance 
} from "./simulatedEngines";

// Initialize Azure OpenAI client
const azureOpenAI = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-10-21",
});

const MODEL = "gpt-5-mini"; // Using GPT-5-mini as specified

// Export for testing and debugging
export { azureOpenAI, MODEL };

export interface AIGeneratedNBA {
  action: string;
  actionType: "meeting" | "email" | "call" | "event";
  priority: "High" | "Medium" | "Low";
  reason: string;
  aiInsight: string;
  expectedOutcome: string;
  timeframe: string;
}

export interface AITerritoryPlan {
  reasoning: string;
  recommendations: string[];
  prioritizedHcps: number[];
  optimizationStrategy: string;
}

/**
 * Generate intelligent Next Best Action using Azure OpenAI
 */
export async function generateIntelligentNBA(
  hcp: Hcp,
  prescriptionHistory: PrescriptionHistory[],
  switchingEvent?: SwitchingEvent
): Promise<AIGeneratedNBA> {
  const systemPrompt = `You are an elite pharmaceutical commercial AI agent specializing in oncology. Your role is to analyze HCP (Healthcare Provider) data and generate the single most impactful Next Best Action to prevent prescription switching and strengthen relationships.

Key Principles:
- Be data-driven and specific
- Focus on high-impact, actionable recommendations
- Consider timing, HCP preferences, and clinical context
- Provide clear rationale based on evidence
- Think multi-step but recommend one focused action`;

  const userPrompt = `Analyze this HCP and recommend the optimal Next Best Action:

**HCP Profile:**
- Name: ${hcp.name}
- Specialty: ${hcp.specialty}
- Hospital: ${hcp.hospital}
- Territory: ${hcp.territory}
- Engagement Level: ${hcp.engagementLevel}
- Last Visit: ${hcp.lastVisitDate ? new Date(hcp.lastVisitDate).toLocaleDateString() : "N/A"}
- Switch Risk Score: ${hcp.switchRiskScore}/100
- Risk Tier: ${hcp.switchRiskTier}
${hcp.switchRiskReasons && hcp.switchRiskReasons.length > 0 ? `- Risk Factors: ${hcp.switchRiskReasons.join(", ")}` : ""}

**Prescription Trends (Last 3 Months):**
${prescriptionHistory.map(p => `- ${p.month}: ${p.productName} (${p.prescriptionCount} prescriptions)${p.isOurProduct ? " ✓ Our Product" : " ⚠ Competitor"}`).join("\n")}

${switchingEvent ? `**⚠ SWITCHING EVENT DETECTED:**
- Switched from: ${switchingEvent.fromProduct} → ${switchingEvent.toProduct}
- Switch Type: ${switchingEvent.switchType}
- Impact Level: ${switchingEvent.impactLevel}
- Confidence: ${switchingEvent.confidenceScore}%
- Root Causes: ${switchingEvent.rootCauses?.join(", ")}` : ""}

Generate the single most impactful Next Best Action. Return ONLY valid JSON with this structure:
{
  "action": "Specific action title (e.g., 'Schedule Clinical Efficacy Review Meeting')",
  "actionType": "meeting|email|call|event",
  "priority": "High|Medium|Low",
  "reason": "1-2 sentence data-driven rationale",
  "aiInsight": "2-3 sentence strategic insight explaining WHY this action will work, referencing specific data points",
  "expectedOutcome": "Concrete expected result",
  "timeframe": "Suggested timeframe (e.g., 'Within 48 hours', 'Next week')"
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // temperature: GPT-5-mini only supports default (1) // 0.7,
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("AI NBA generation error:", error);
    // Fallback to rule-based generation
    return generateFallbackNBA(hcp, switchingEvent);
  }
}

/**
 * Generate NBA with provenance showing RL, Rules, and LLM contributions
 * This is a DEMO version using simulated engines
 */
export async function generateNBAWithProvenance(
  hcp: Hcp,
  prescriptionHistory: PrescriptionHistory[],
  switchingEvent?: SwitchingEvent
): Promise<NBAProvenance> {
  // Step 1: Get RL Engine recommendations
  const rlOutput = simulateRLEngine(hcp, prescriptionHistory, switchingEvent);
  
  // Step 2: Get Rules Engine decisions
  const rulesOutput = simulateRulesEngine(hcp, prescriptionHistory, switchingEvent);
  
  // Step 3: Get LLM contextualization
  const llmOutput = simulateLLMContextualization(hcp, rlOutput, rulesOutput);
  
  // Step 4: Synthesize final NBA
  // Priority: Rules > RL > LLM defaults
  // Defensive: Ensure we have at least one action from RL
  if (!rlOutput.topActions || rlOutput.topActions.length === 0) {
    throw new Error("RL Engine returned no actions - this should not happen");
  }
  
  let finalAction = rlOutput.topActions[0];
  let priority: "High" | "Medium" | "Low" = "Medium";
  
  // Rules can override priority
  if (rulesOutput.triggeredRules.length > 0) {
    const highPriorityRule = rulesOutput.triggeredRules.find(r => r.priority === "High");
    if (highPriorityRule) {
      priority = "High";
      // If rules suggest a specific action, use it
      if (highPriorityRule.action.toLowerCase().includes("meeting")) {
        finalAction = rlOutput.topActions.find(a => a.actionType === "meeting") || finalAction;
      }
    }
  }
  
  const synthesisRationale = `Combined RL policy recommendation (Q=${finalAction.qValue}, confidence=${finalAction.confidence}) with ${rulesOutput.triggeredRules.length} triggered business rules${rulesOutput.escalations.length > 0 ? ` and ${rulesOutput.escalations.length} escalation(s)` : ''}. ${llmOutput.narrative}`;
  
  return {
    rlContribution: rlOutput,
    rulesContribution: rulesOutput,
    llmContribution: llmOutput,
    finalSynthesis: {
      action: finalAction.action,
      actionType: finalAction.actionType,
      priority,
      reason: finalAction.reasoning,
      synthesisRationale
    }
  };
}

/**
 * Generate deep AI analysis for switching events
 */
export async function analyzeSwitchingWithAI(
  hcp: Hcp,
  fromProduct: string,
  toProduct: string,
  prescriptionHistory: PrescriptionHistory[]
): Promise<{
  analysis: string;
  rootCauses: string[];
  recommendations: string[];
  urgencyLevel: "critical" | "high" | "medium" | "low";
}> {
  const systemPrompt = `You are a pharmaceutical AI analyst specializing in prescription switching behavior in oncology. Analyze switching patterns and provide actionable insights.`;

  const userPrompt = `Analyze this prescription switching event:

**HCP:** ${hcp.name} (${hcp.specialty}, ${hcp.hospital})
**Switch:** ${fromProduct} → ${toProduct}

**Prescription History:**
${prescriptionHistory.map(p => `${p.month}: ${p.productName} - ${p.prescriptionCount} Rx`).join("\n")}

Provide a comprehensive analysis. Return ONLY valid JSON:
{
  "analysis": "3-4 sentence executive summary of the switch and its implications",
  "rootCauses": ["cause1", "cause2", "cause3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "urgencyLevel": "critical|high|medium|low"
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // temperature: GPT-5-mini only supports default (1) // 0.6,
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    return JSON.parse(content);
  } catch (error) {
    console.error("AI switching analysis error:", error);
    return {
      analysis: `${hcp.name} has switched from ${fromProduct} to ${toProduct}. Immediate intervention recommended.`,
      rootCauses: ["Prescription pattern shift detected", "Competitor activity"],
      recommendations: ["Schedule urgent meeting", "Review clinical data"],
      urgencyLevel: "high",
    };
  }
}

/**
 * Generate autonomous territory plan using AI
 */
export async function generateTerritoryPlanWithAI(
  territory: string,
  hcps: Hcp[],
  activeNBAs: number
): Promise<AITerritoryPlan> {
  const systemPrompt = `You are a strategic pharmaceutical territory planning AI. Generate optimal daily/weekly plans that maximize HCP engagement and prevent switching.`;

  const userPrompt = `Create an intelligent territory plan for ${territory}:

**Territory Stats:**
- Total HCPs: ${hcps.length}
- High Risk HCPs: ${hcps.filter(h => h.switchRiskScore && h.switchRiskScore >= 50).length}
- Active NBAs: ${activeNBAs}

**High Priority HCPs:**
${hcps.slice(0, 10).map(h => `- ${h.name} (${h.specialty}, Risk: ${h.switchRiskScore || 0}/100, Engagement: ${h.engagementLevel})`).join("\n")}

Generate an optimized plan. Return ONLY valid JSON:
{
  "reasoning": "2-3 sentence strategic rationale for this plan",
  "recommendations": ["rec1", "rec2", "rec3"],
  "prioritizedHcps": [1, 2, 3],
  "optimizationStrategy": "Brief description of optimization approach"
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // temperature: GPT-5-mini only supports default (1) // 0.7,
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    return JSON.parse(content);
  } catch (error) {
    console.error("AI territory planning error:", error);
    return {
      reasoning: `Focused plan for ${territory} prioritizing high-risk HCPs`,
      recommendations: ["Visit top 3 high-risk HCPs", "Send follow-up emails", "Review prescription trends"],
      prioritizedHcps: hcps.slice(0, 3).map(h => h.id),
      optimizationStrategy: "Risk-based prioritization with geographic optimization",
    };
  }
}

/**
 * Natural language copilot query handler
 */
export async function processCopilotQuery(query: string, context: any): Promise<string> {
  const systemPrompt = `You are an intelligent pharmaceutical sales copilot assistant. Help sales reps with insights, recommendations, and actions. Be concise, actionable, and data-driven.`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context: ${JSON.stringify(context)}\n\nQuery: ${query}` },
      ],
      // temperature: GPT-5-mini only supports default (1) // 0.8,
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
    });

    return response.choices[0]?.message?.content || "I apologize, I couldn't process that query.";
  } catch (error) {
    console.error("Copilot query error:", error);
    return "I'm having trouble processing your request. Please try again.";
  }
}

/**
 * Generate counterfactual analysis answering "What if?" questions or causal "Why?" questions
 */
export async function generateCounterfactualAnalysis(
  hcpId: number,
  question: string,
  hcpData?: {
    hcp?: Hcp;
    prescriptionHistory?: PrescriptionHistory[];
    switchingEvent?: SwitchingEvent;
    callNotes?: any[];
    payerCommunications?: any[];
    patients?: any[];
    clinicalEvents?: any[];
  }
): Promise<string> {
  const isWhyQuestion = question.toLowerCase().trim().startsWith("why");
  
  const systemPrompt = isWhyQuestion 
    ? `You are an elite pharmaceutical commercial AI agent specializing in root cause analysis for oncology HCPs. Your role is to answer "Why?" questions by analyzing causal factors, business dynamics, and healthcare market forces that drive HCP prescribing behavior.

Key Principles:
- Provide crisp, data-driven causal explanations
- Reference specific evidence from the HCP data and timeline
- Consider multiple causal factors (payer policies, market dynamics, clinical evidence, competitive actions)
- Be concise and to-the-point (2-3 SHORT paragraphs maximum)
- Focus on actionable insights that explain the underlying mechanisms
- Avoid verbose language - get straight to the point`
    : `You are an elite pharmaceutical commercial AI agent specializing in counterfactual analysis for oncology HCPs. Your role is to answer "What if?" questions by analyzing alternative scenarios and their predicted outcomes compared to actual results.

Key Principles:
- Provide crisp, data-driven counterfactual analysis
- Compare predicted vs actual outcomes with specific numbers when possible
- Reference specific evidence from the HCP data provided
- Be concise and to-the-point (2-3 SHORT paragraphs maximum)
- Focus on actionable insights and intervention potential
- Avoid verbose language - get straight to the point`;

  // Build dynamic context from database
  const hcpContext = `**HCP Context:**
${hcpData?.hcp ? `
- HCP: ${hcpData.hcp.name}
- Specialty: ${hcpData.hcp.specialty}
- Switch Risk Score: ${hcpData.hcp.switchRiskScore}/100
- Risk Tier: ${hcpData.hcp.switchRiskTier}
` : ""}

${hcpData?.prescriptionHistory && hcpData.prescriptionHistory.length > 0 ? `
**Prescription History:**
${hcpData.prescriptionHistory.map(p => `- ${p.month}: ${p.productName} (${p.prescriptionCount} Rx)${p.isOurProduct ? " ✓ Our Product" : " ⚠ Competitor"}`).join("\n")}
` : ""}

${hcpData?.callNotes && hcpData.callNotes.length > 0 ? `
**Call Notes:**
${hcpData.callNotes.map(n => `- ${n.callDate}: ${n.notes} (Rep: ${n.repName})`).join("\n")}
` : ""}

${hcpData?.payerCommunications && hcpData.payerCommunications.length > 0 ? `
**Payer Communications:**
${hcpData.payerCommunications.map(p => `- ${p.payerName}: ${p.details} (${p.impactLevel} impact)`).join("\n")}
` : ""}

${hcpData?.patients && hcpData.patients.length > 0 ? `
**Patient Context:**
- Total Patients: ${hcpData.patients.length}
- Patient Codes: ${hcpData.patients.map(p => p.patientCode).join(", ")}
` : ""}

${hcpData?.clinicalEvents && hcpData.clinicalEvents.length > 0 ? `
**Clinical Events:**
${hcpData.clinicalEvents.map(e => `- ${e.eventDate}: ${e.eventType} - ${e.description}${e.outcome ? ` (Outcome: ${e.outcome})` : ""}`).join("\n")}
` : ""}

${hcpData?.switchingEvent ? `
**Switching Event:**
- Switched: ${hcpData.switchingEvent.fromProduct} → ${hcpData.switchingEvent.toProduct}
- Impact: ${hcpData.switchingEvent.impactLevel}
- Root Causes: ${hcpData.switchingEvent.rootCauses?.join(", ")}
` : ""}`;

  const userPrompt = isWhyQuestion 
    ? `Answer this causal "Why?" question based on the HCP data:

**Question:** ${question}

${hcpContext}

Provide a comprehensive causal explanation that:
1. Identifies the primary driving forces (payer business decisions, market dynamics, competitive pressures)
2. Explains the timing and coordination based on the evidence
3. Analyzes the business rationale from the payer's perspective
4. Connects to broader healthcare market trends (cost containment, value-based care, competitor rebate strategies)
5. References specific evidence from the call notes, payer communications, prescription data, and clinical events provided`
    : `Answer this counterfactual question based on the HCP data:

**Question:** ${question}

${hcpContext}

Provide a comprehensive counterfactual analysis that:
1. States the hypothetical scenario clearly
2. Predicts what would have happened (with specific patient/prescription numbers if possible)
3. Compares to actual outcomes
4. Explains the key differences and intervention potential
5. Quantifies the impact when possible (e.g., "8 of 12 patients retained vs actual 3")`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 6000,
    });

    return response.choices[0]?.message?.content || "Unable to generate analysis.";
  } catch (error) {
    console.error("Counterfactual/causal analysis error:", error);
    return "I'm having trouble generating the analysis. Please try again.";
  }
}

/**
 * Fallback NBA generation when AI is unavailable
 */
function generateFallbackNBA(hcp: Hcp, switchingEvent?: SwitchingEvent): AIGeneratedNBA {
  if (switchingEvent) {
    return {
      action: "Schedule Urgent Clinical Review Meeting",
      actionType: "meeting",
      priority: "High",
      reason: `Switching event detected from ${switchingEvent.fromProduct} to ${switchingEvent.toProduct}`,
      aiInsight: "Immediate engagement recommended to understand switch drivers and present competitive data.",
      expectedOutcome: "Regain prescriber confidence and halt further switching",
      timeframe: "Within 48 hours",
    };
  }

  const riskScore = hcp.switchRiskScore || 0;
  if (riskScore >= 50) {
    return {
      action: "Proactive Relationship Building Call",
      actionType: "call",
      priority: "High",
      reason: `High switch risk detected (${riskScore}/100)`,
      aiInsight: "Early intervention to address concerns before switching occurs.",
      expectedOutcome: "Strengthen relationship and identify pain points",
      timeframe: "This week",
    };
  }

  return {
    action: "Send Clinical Update Email",
    actionType: "email",
    priority: "Medium",
    reason: "Maintain regular engagement",
    aiInsight: "Keep HCP informed of latest developments to maintain top-of-mind awareness.",
    expectedOutcome: "Sustained engagement and brand awareness",
    timeframe: "Next 7 days",
  };
}

/**
 * Generate a call script artifact based on NBA context
 */
export async function generateCallScript(
  hcp: Hcp,
  nba: AIGeneratedNBA,
  context: string
): Promise<import("@shared/schema").CallScriptContent> {
  const systemPrompt = `You are an expert pharmaceutical sales trainer. Generate practical, professional call scripts for field representatives. Focus on consultative selling, active listening, and addressing HCP needs with data-driven insights.`;

  const userPrompt = `Generate a call script for this scenario:

**HCP:** ${hcp.name}, ${hcp.specialty} at ${hcp.hospital}
**Recommended Action:** ${nba.action}
**Context:** ${context}
**AI Insight:** ${nba.aiInsight}

Create a professional call script with:
1. Opening (warm greeting + purpose)
2. 3-5 key talking points
3. 2-3 common objections with responses
4. Closing statement
5. Follow-up action

Return ONLY valid JSON with this structure:
{
  "type": "call_script",
  "opening": "Brief opening statement",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "objectionHandling": [{"objection": "...", "response": "..."}],
  "closingStatement": "Brief closing",
  "followUpAction": "Next step"
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      max_completion_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Call script generation error:", error);
    // Return fallback
    return {
      type: "call_script",
      opening: `Hello Dr. ${hcp.name}, this is [Your Name] from [Company]. I wanted to follow up on ${nba.action.toLowerCase()}.`,
      keyPoints: [
        `Discuss recent clinical data supporting product efficacy`,
        `Address any concerns about ${context}`,
        `Explore current treatment patterns and patient outcomes`,
      ],
      objectionHandling: [
        { objection: "I'm satisfied with current therapies", response: "I understand. Can we discuss any specific patient cases where outcomes could be improved?" },
      ],
      closingStatement: `Thank you for your time, Dr. ${hcp.name}. I'll follow up with the materials we discussed.`,
      followUpAction: "Send follow-up email with clinical data within 24 hours",
    };
  }
}

/**
 * Generate an email draft artifact based on NBA context
 */
export async function generateEmailDraft(
  hcp: Hcp,
  nba: AIGeneratedNBA,
  context: string
): Promise<import("@shared/schema").EmailDraftContent> {
  const systemPrompt = `You are an expert pharmaceutical communications specialist. Generate professional, concise emails for field representatives to send to HCPs. Keep tone professional yet warm, focus on value and data, respect the HCP's time.`;

  const userPrompt = `Generate an email draft for this scenario:

**HCP:** ${hcp.name}, ${hcp.specialty} at ${hcp.hospital}
**Recommended Action:** ${nba.action}
**Context:** ${context}
**AI Insight:** ${nba.aiInsight}

Create a professional email with:
1. Compelling subject line
2. Warm greeting
3. 2-3 short body paragraphs (value-focused)
4. Professional closing
5. Signature placeholder
6. Optional attachment suggestions

Return ONLY valid JSON with this structure:
{
  "type": "email_draft",
  "subject": "Subject line",
  "greeting": "Greeting",
  "body": ["Paragraph 1", "Paragraph 2"],
  "closing": "Closing statement",
  "signature": "Signature placeholder",
  "attachmentSuggestions": ["Optional attachment 1"]
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      max_completion_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Email draft generation error:", error);
    // Return fallback
    return {
      type: "email_draft",
      subject: `${nba.action} - Onco-Pro Update`,
      greeting: `Dear Dr. ${hcp.name},`,
      body: [
        `I hope this message finds you well. I wanted to reach out regarding ${nba.action.toLowerCase()}.`,
        `${nba.aiInsight}`,
      ],
      closing: "I'd be happy to discuss this further at your convenience. Please let me know a good time to connect.",
      signature: "Best regards,\n[Your Name]\n[Title]\n[Contact Information]",
      attachmentSuggestions: ["Latest clinical trial data", "Product monograph"],
    };
  }
}

/**
 * Generate a meeting agenda artifact based on NBA context
 */
export async function generateMeetingAgenda(
  hcp: Hcp,
  nba: AIGeneratedNBA,
  context: string
): Promise<import("@shared/schema").MeetingAgendaContent> {
  const systemPrompt = `You are an expert pharmaceutical sales strategist. Generate professional, structured meeting agendas for field representatives. Focus on clear objectives, time management, and measurable outcomes.`;

  const userPrompt = `Generate a meeting agenda for this scenario:

**HCP:** ${hcp.name}, ${hcp.specialty} at ${hcp.hospital}
**Recommended Action:** ${nba.action}
**Context:** ${context}
**AI Insight:** ${nba.aiInsight}

Create a professional meeting agenda with:
1. Clear objective
2. Suggested duration
3. 3-5 timed agenda items
4. 3-4 key messages to convey
5. Materials needed
6. Desired outcome

Return ONLY valid JSON with this structure:
{
  "type": "meeting_agenda",
  "objective": "Clear objective",
  "duration": "Duration estimate",
  "agenda": [{"time": "0-5 min", "topic": "Topic", "details": "Details"}],
  "keyMessages": ["Message 1", "Message 2"],
  "materialsNeeded": ["Material 1"],
  "desiredOutcome": "Desired outcome"
}`;

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1,
      max_completion_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Meeting agenda generation error:", error);
    // Return fallback
    return {
      type: "meeting_agenda",
      objective: `${nba.action} to address ${context}`,
      duration: "30-45 minutes",
      agenda: [
        { time: "0-5 min", topic: "Introduction & Relationship Building", details: "Warm greeting, check-in on recent cases" },
        { time: "5-20 min", topic: "Core Discussion", details: `${nba.aiInsight}` },
        { time: "20-35 min", topic: "Clinical Data Review", details: "Present relevant efficacy and safety data" },
        { time: "35-40 min", topic: "Q&A and Objection Handling", details: "Address concerns and questions" },
        { time: "40-45 min", topic: "Next Steps & Closing", details: "Agree on follow-up actions" },
      ],
      keyMessages: [
        "Our product offers differentiated clinical benefits",
        "Strong safety profile in target population",
        "Comprehensive patient support programs available",
      ],
      materialsNeeded: ["Clinical data slides", "Product monograph", "Patient case studies", "Samples (if applicable)"],
      desiredOutcome: `Increase HCP confidence in product and commit to ${nba.expectedOutcome.toLowerCase()}`,
    };
  }
}
