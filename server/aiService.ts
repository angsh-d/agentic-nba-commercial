import { AzureOpenAI } from "openai";
import "@azure/openai/types";
import type { Hcp, PrescriptionHistory, SwitchingEvent } from "@shared/schema";

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
 * Generate counterfactual analysis answering "What if?" questions
 */
export async function generateCounterfactualAnalysis(
  hcpId: number,
  question: string,
  hcpData?: {
    hcp?: Hcp;
    prescriptionHistory?: PrescriptionHistory[];
    switchingEvent?: SwitchingEvent;
  }
): Promise<string> {
  const systemPrompt = `You are an elite pharmaceutical commercial AI agent specializing in counterfactual analysis for oncology HCPs. Your role is to answer "What if?" questions by analyzing alternative scenarios and their predicted outcomes compared to actual results.

Key Principles:
- Provide data-driven counterfactual analysis
- Compare predicted vs actual outcomes with specific numbers when possible
- Reference specific evidence from the HCP data provided
- Be concise but thorough (3-5 paragraphs)
- Focus on actionable insights and intervention potential`;

  const userPrompt = `Answer this counterfactual question based on the HCP data:

**Question:** ${question}

**HCP Context:**
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

${hcpData?.switchingEvent ? `
**Switching Event:**
- Switched: ${hcpData.switchingEvent.fromProduct} → ${hcpData.switchingEvent.toProduct}
- Impact: ${hcpData.switchingEvent.impactLevel}
- Root Causes: ${hcpData.switchingEvent.rootCauses?.join(", ")}
` : ""}

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

    return response.choices[0]?.message?.content || "Unable to generate counterfactual analysis.";
  } catch (error) {
    console.error("Counterfactual analysis error:", error);
    return "I'm having trouble generating the counterfactual analysis. Please try again.";
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
