import { AzureOpenAI } from "openai";
import "@azure/openai/types";
import { storage } from "./storage";
import type { Hcp, PrescriptionHistory, SwitchingEvent } from "@shared/schema";
import { EventEmitter } from "events";
import { z } from "zod";

// Initialize Azure OpenAI client
const azureOpenAI = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-10-21",
});

const MODEL = "gpt-5-mini";

// Zod schemas for validating LLM outputs
const PlanSchema = z.object({
  thought: z.string(),
  goals: z.array(z.string()),
  strategy: z.string(),
  requiredData: z.array(z.string()),
  successCriteria: z.string(),
});

const EvidenceSchema = z.object({
  thought: z.string(),
  keyFindings: z.array(z.string()),
  hypotheses: z.array(z.string()),
  riskFactors: z.array(z.string()),
  opportunities: z.array(z.string()),
});

const SynthesisSchema = z.object({
  thought: z.string(),
  action: z.string(),
  actionType: z.enum(["meeting", "email", "call", "event"]),
  priority: z.enum(["High", "Medium", "Low"]),
  reason: z.string(),
  aiInsight: z.string(),
  confidenceScore: z.number().min(0).max(100),
  expectedOutcome: z.string(),
  timeframe: z.string(),
});

const ReflectionSchema = z.object({
  thought: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
  improvements: z.array(z.string()),
  lessonsLearned: z.array(z.string()),
  overallAssessment: z.string(),
});

/**
 * Agent Orchestrator - Coordinates multi-agent reasoning loops with ReAct pattern
 * Implements: Planning, Analysis, Synthesis, Reflection
 */
export class AgentOrchestrator extends EventEmitter {
  private sessionId?: number;
  private thoughtSequence: number = 0;
  private maxIterations: number = 10;
  
  /**
   * Create a new session and return its ID immediately (for async execution)
   */
  async createSession(goalDescription: string, goalType: string, contextData: any): Promise<number> {
    const session = await storage.createAgentSession({
      goalDescription,
      goalType,
      status: "in_progress",
      currentPhase: "initializing",
      contextData,
    });
    
    this.emit("session:created", { sessionId: session.id, goal: goalDescription });
    
    return session.id;
  }
  
  /**
   * Start a new agentic session with goal-driven planning (legacy method)
   */
  async startSession(goalDescription: string, goalType: string, contextData: any) {
    const session = await storage.createAgentSession({
      goalDescription,
      goalType,
      status: "in_progress",
      currentPhase: "planning",
      contextData,
    });
    
    this.sessionId = session.id;
    this.thoughtSequence = 0;
    
    this.emit("session:started", { sessionId: session.id, goal: goalDescription });
    
    return session;
  }
  
  /**
   * Execute full ReAct loop for NBA generation with iterative reasoning
   */
  async executeNBAGenerationLoop(hcpId: number, existingSessionId?: number) {
    const goal = `Generate optimal Next Best Action for HCP ${hcpId} with full reasoning trace`;
    
    // Use existing session if provided, otherwise create new one
    let session;
    if (existingSessionId) {
      session = await storage.getAgentSession(existingSessionId);
      if (!session) {
        throw new Error(`Session ${existingSessionId} not found`);
      }
      // Set instance variables so logging works correctly
      this.sessionId = session.id;
      this.thoughtSequence = 0;
      this.emit("session:started", { sessionId: session.id, goal: session.goalDescription });
    } else {
      session = await this.startSession(goal, "nba_generation", { hcpId });
    }
    
    try {
      // Initialize loop state
      let iteration = 0;
      let goalAchieved = false;
      let context: any = { hcpId };
      let finalNBA: any = null;
      let finalReflection: any = null;
      
      // Iterative ReAct Loop
      while (iteration < this.maxIterations && !goalAchieved) {
        iteration++;
        await this.logThought("orchestrator", "observation", 
          `Iteration ${iteration}/${this.maxIterations}: Evaluating next step towards goal`);
        
        // PHASE 1: THINK - What should we do in this iteration?
        await this.logPhase(`Iteration ${iteration} - Strategic Planning`);
        const plan = await this.strategicPlanner(context);
        context.plan = plan;
        
        // PHASE 2: ACT - Gather evidence
        await this.logPhase(`Iteration ${iteration} - Evidence Analysis`);
        const evidence = await this.evidenceAnalyst({ hcpId, iteration });
        context.evidence = evidence;
        
        // Check if we have enough information to synthesize
        const readyToSynthesize = evidence.keyFindings.length > 0 && evidence.hypotheses.length > 0;
        
        if (readyToSynthesize || iteration >= 3) {
          // PHASE 3: ACT - Synthesize NBA
          await this.logPhase(`Iteration ${iteration} - Action Synthesis`);
          const nba = await this.actionSynthesizer({ ...context, hcpId, plan, evidence });
          context.nba = nba;
          finalNBA = nba;
          
          // PHASE 4: REFLECT - Critique and decide if done
          await this.logPhase(`Iteration ${iteration} - Self-Reflection`);
          const reflection = await this.reflectorCritic({ nba, evidence, plan });
          finalReflection = reflection;
          
          // Decision: Are we confident enough?
          if (reflection.confidenceScore >= 75 || iteration >= this.maxIterations - 1) {
            goalAchieved = true;
            await this.logThought("orchestrator", "reasoning", 
              `Goal achieved with confidence ${reflection.confidenceScore}%. Terminating loop.`);
          } else {
            await this.logThought("orchestrator", "reasoning", 
              `Confidence ${reflection.confidenceScore}% below threshold. Need another iteration.`);
            // Add learnings to context for next iteration
            context.previousReflection = reflection;
          }
        } else {
          await this.logThought("orchestrator", "reasoning", 
            `Insufficient evidence gathered. Continuing to next iteration for more data.`);
        }
      }
      
      if (!finalNBA || !finalReflection) {
        throw new Error("Failed to generate NBA within iteration limit");
      }
      
      // Finalize session
      await storage.updateAgentSession(session.id, {
        status: "completed",
        finalOutcome: `Generated NBA: ${finalNBA.action} (Confidence: ${finalReflection.confidenceScore}% after ${iteration} iterations)`,
        confidenceScore: finalReflection.confidenceScore,
        completedAt: new Date(),
      });
      
      this.emit("session:completed", { 
        sessionId: session.id, 
        result: finalNBA,
        confidence: finalReflection.confidenceScore,
        iterations: iteration,
      });
      
      return { nba: finalNBA, reflection: finalReflection, sessionId: session.id, iterations: iteration };
      
    } catch (error) {
      await storage.updateAgentSession(session.id, {
        status: "failed",
        finalOutcome: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        completedAt: new Date(),
      });
      
      this.emit("session:failed", { sessionId: session.id, error });
      throw error;
    }
  }
  
  /**
   * Strategic Planner Agent - Decomposes goals into actionable plans
   */
  private async strategicPlanner(context: any) {
    await this.logThought("planner", "observation", 
      `Analyzing HCP ${context.hcpId} to determine optimal intervention strategy`);
    
    const hcp = await storage.getHcp(context.hcpId);
    if (!hcp) throw new Error("HCP not found");
    
    const history = await storage.getPrescriptionHistory(context.hcpId);
    const events = await storage.getSwitchingEventsByStatus("active");
    const switchingEvent = events.find(e => e.hcpId === context.hcpId);
    
    await this.logAction("planner", "query_data", "Retrieved HCP data, prescription history, and switching events", {
      hcpId: context.hcpId,
      historyCount: history.length,
      hasSwitchingEvent: !!switchingEvent,
    });
    
    const prompt = `You are a Strategic Planning Agent. Analyze this HCP and create a strategic intervention plan.

HCP DATA:
Name: ${hcp.name}
Specialty: ${hcp.specialty}
Hospital: ${hcp.hospital}
Territory: ${hcp.territory}
Last Visit: ${hcp.lastVisitDate || 'Never'}
Engagement: ${hcp.engagementLevel}
Risk Score: ${hcp.switchRiskScore}/100 (${hcp.switchRiskTier})
Risk Factors: ${hcp.switchRiskReasons?.join(', ') || 'None'}
History: ${history.length} months
Switching: ${switchingEvent ? `${switchingEvent.fromProduct} → ${switchingEvent.toProduct}` : 'No'}

You must respond ONLY with valid JSON in exactly this format:
{
  "thought": "your strategic reasoning here",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "strategy": "your overall strategy",
  "requiredData": ["data 1", "data 2"],
  "successCriteria": "success measurement"
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
    });
    
    const content = response.choices[0]?.message?.content;
    console.log("Planner raw response:", content);
    
    if (!content || content.trim() === "") {
      throw new Error("Empty response from GPT-5-mini planner");
    }
    
    const rawPlan = JSON.parse(content);
    const plan = PlanSchema.parse(rawPlan);
    
    await this.logThought("planner", "reasoning", plan.thought);
    
    return { ...plan, hcp, history, switchingEvent };
  }
  
  /**
   * Evidence Analyst Agent - Gathers data and tests hypotheses
   */
  private async evidenceAnalyst(context: any) {
    await this.logThought("analyst", "observation", 
      `Gathering evidence about prescription patterns, patient cohorts, and clinical events for HCP ${context.hcpId}`);
    
    const hcp = await storage.getHcp(context.hcpId);
    if (!hcp) throw new Error("HCP not found");
    
    const history = await storage.getPrescriptionHistory(context.hcpId);
    const patients = await storage.getPatientsByHcp(context.hcpId);
    const clinicalEvents = await storage.getClinicalEventsByHcp(context.hcpId);
    const allHcps = await storage.getAllHcps();
    
    // Cohort analysis
    const cohortBreakdown = patients.reduce((acc: any, p) => {
      acc[p.cohort] = (acc[p.cohort] || 0) + 1;
      return acc;
    }, {});
    
    const switchedPatients = patients.filter(p => p.switchedDate);
    const cvRiskPatients = patients.filter(p => p.hasCardiovascularRisk === 1);
    
    await this.logAction("analyst", "analyze_pattern", "Analyzed prescription trends, patient cohorts, and clinical events", {
      trendsIdentified: true,
      peerCount: allHcps.length,
      patientCount: patients.length,
      clinicalEventsCount: clinicalEvents.length,
      cohorts: Object.keys(cohortBreakdown),
    });
    
    const prompt = `You are an Evidence Analysis Agent performing deep causal data analysis.

HCP PROFILE:
- Name: ${hcp.name}
- Specialty: ${hcp.specialty}
- Hospital: ${hcp.hospital}
- Risk Score: ${hcp.switchRiskScore}/100
- Engagement: ${hcp.engagementLevel}

PRESCRIPTION TIMELINE (${history.length} months):
${history.slice(0, 10).map(h => `- ${h.month}: ${h.productName} (${h.prescriptionCount} Rx) ${h.cohort ? `[Cohort: ${h.cohort}]` : ''}`).join('\n')}

PATIENT COHORT ANALYSIS:
- Total Patients: ${patients.length}
- Cohort Breakdown: ${Object.entries(cohortBreakdown).map(([cohort, count]) => `${cohort}: ${count}`).join(', ')}
- Switched Patients: ${switchedPatients.length} (${Math.round(switchedPatients.length / patients.length * 100)}%)
- CV-Risk Patients: ${cvRiskPatients.length}
${patients.slice(0, 5).map(p => `  • ${p.patientCode}: Age ${p.age}, ${p.cancerType}, ${p.cohort} cohort, ${p.switchedDate ? `Switched to ${p.switchedToDrug} on ${p.switchedDate.toISOString().split('T')[0]}` : 'Stable on ' + p.currentDrug}`).join('\n')}

CLINICAL EVENTS (Potential Causal Factors):
${clinicalEvents.map(e => `- ${e.eventDate.toISOString().split('T')[0]}: [${e.eventType.toUpperCase()}] ${e.eventTitle}
  ${e.eventDescription.substring(0, 150)}${e.eventDescription.length > 150 ? '...' : ''}
  Impact: ${e.impact} | Related Drug: ${e.relatedDrug || 'N/A'}`).join('\n\n')}

PEER COMPARISON:
- Territory ${hcp.territory} has ${allHcps.filter(h => h.territory === hcp.territory).length} HCPs
- Average risk score in territory: ${Math.round(allHcps.filter(h => h.territory === hcp.territory).reduce((sum, h) => sum + (h.switchRiskScore || 0), 0) / allHcps.filter(h => h.territory === hcp.territory).length)}

TASK: Perform CAUSAL ANALYSIS:
1. Identify temporal correlations between clinical events and switching patterns
2. Segment patients by cohort and analyze switching behavior per cohort
3. Hypothesize causal relationships (e.g., "Did ASCO conference trigger young RCC patient switches?")
4. Identify distinct switching patterns across different patient populations
5. Extract evidence-based insights about HCP decision-making drivers

OUTPUT (JSON):
{
  "thought": "My causal analysis connecting events to switching patterns...",
  "keyFindings": ["Finding 1 with timeline correlation", "Finding 2 about cohort patterns", "Finding 3"],
  "hypotheses": ["Causal hypothesis 1 (event → behavior)", "Cohort-specific hypothesis 2"],
  "riskFactors": ["Factor 1 with evidence", "Factor 2"],
  "opportunities": ["Opportunity 1 based on causality", "Opportunity 2"]
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
    });
    
    const content = response.choices[0]?.message?.content;
    console.log("Analyst raw response:", content);
    
    if (!content || content.trim() === "") {
      throw new Error("Empty response from GPT-5-mini analyst");
    }
    
    const rawEvidence = JSON.parse(content);
    const evidence = EvidenceSchema.parse(rawEvidence);
    
    await this.logThought("analyst", "reasoning", evidence.thought);
    
    return evidence;
  }
  
  /**
   * Action Synthesizer Agent - Generates concrete NBAs with confidence scores
   */
  private async actionSynthesizer(context: any) {
    await this.logThought("synthesizer", "observation", 
      `Synthesizing optimal action based on strategic plan and evidence`);
    
    const { plan, evidence, hcpId } = context;
    const hcp = await storage.getHcp(hcpId);
    
    const prompt = `You are an Action Synthesis Agent creating actionable recommendations based on causal analysis.

STRATEGIC PLAN:
${JSON.stringify(plan, null, 2)}

EVIDENCE & CAUSAL ANALYSIS:
${JSON.stringify(evidence, null, 2)}

TASK: Generate the single best Next Best Action with layered narrative explaining causal factors.

Your "aiInsight" field should be a NARRATIVE that:
1. Explains distinct switching patterns across different patient cohorts
2. Connects clinical events (conferences, adverse events) to behavioral changes
3. Demonstrates evidence-based, strategic HCP decision-making
4. Provides specific dates, percentages, and temporal correlations
5. Shows how multiple causal factors drive different cohort behaviors

Example narrative structure:
"Dr. [Name]'s switching behavior reveals two distinct, evidence-driven patterns: First, following [EVENT] on [DATE], all patients in [COHORT A] systematically switched to [COMPETITOR], representing a [X]% shift driven by [CAUSAL FACTOR]. Second, after experiencing [EVENT CLUSTER] in [TIMEFRAME], [COHORT B] patients selectively migrated due to [SAFETY/EFFICACY CONCERN]. Notably, [COHORT C] patients remain on our drug, indicating strategic, not categorical switching."

OUTPUT (JSON):
{
  "thought": "Why this is the optimal action based on causal patterns...",
  "action": "Specific action to take",
  "actionType": "meeting|email|call|event",
  "priority": "High|Medium|Low",
  "reason": "Business justification with cohort-specific focus",
  "aiInsight": "LAYERED NARRATIVE explaining causal factors, cohort patterns, temporal correlations, and strategic HCP behavior with specific dates and statistics",
  "confidenceScore": 85,
  "expectedOutcome": "What we expect to achieve",
  "timeframe": "When to execute"
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
    });
    
    const content = response.choices[0]?.message?.content;
    console.log("Synthesizer raw response:", content);
    
    if (!content || content.trim() === "") {
      throw new Error("Empty response from GPT-5-mini synthesizer");
    }
    
    const rawSynthesis = JSON.parse(content);
    const synthesis = SynthesisSchema.parse(rawSynthesis);
    
    await this.logThought("synthesizer", "reasoning", synthesis.thought);
    
    // Create NBA in database
    const createdNba = await storage.createNba({
      hcpId: hcpId,
      action: synthesis.action,
      actionType: synthesis.actionType,
      priority: synthesis.priority,
      reason: synthesis.reason,
      aiInsight: synthesis.aiInsight,
      status: "pending",
    });
    
    await this.logAction("synthesizer", "generate_nba", `Created NBA: ${synthesis.action}`, {
      nbaId: createdNba.id,
      confidence: synthesis.confidenceScore,
    });
    
    // Return with correct field names
    return { 
      action: synthesis.action,
      actionType: synthesis.actionType,
      priority: synthesis.priority,
      reason: synthesis.reason,
      aiInsight: synthesis.aiInsight,
      confidenceScore: synthesis.confidenceScore,
      expectedOutcome: synthesis.expectedOutcome,
      timeframe: synthesis.timeframe,
      nbaId: createdNba.id,
      thought: synthesis.thought,
    };
  }
  
  /**
   * Reflector/Critic Agent - Self-evaluates and provides feedback
   */
  private async reflectorCritic(context: any) {
    await this.logThought("reflector", "observation", 
      `Evaluating quality of generated NBA and overall reasoning process`);
    
    const { nba, evidence, plan } = context;
    
    const prompt = `You are a Reflector/Critic Agent performing self-evaluation.

GENERATED NBA:
${JSON.stringify(nba, null, 2)}

EVIDENCE USED:
${JSON.stringify(evidence, null, 2)}

STRATEGIC PLAN:
${JSON.stringify(plan, null, 2)}

TASK: Critique the NBA and reasoning process. Be honest about strengths and weaknesses.

OUTPUT (JSON):
{
  "thought": "My critique of the work...",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "confidenceScore": 85,
  "improvements": ["How to improve 1", "How to improve 2"],
  "lessonsLearned": ["Lesson 1", "Lesson 2"],
  "overallAssessment": "Final judgment on quality"
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,  // Conservative limit for Azure GPT-5-mini
    });
    
    const content = response.choices[0]?.message?.content;
    console.log("Reflector raw response:", content);
    
    if (!content || content.trim() === "") {
      throw new Error("Empty response from GPT-5-mini reflector");
    }
    
    const rawReflection = JSON.parse(content);
    const reflection = ReflectionSchema.parse(rawReflection);
    
    await this.logThought("reflector", "critique", reflection.thought);
    
    // Store feedback for learning
    if (this.sessionId) {
      await storage.createAgentFeedback({
        sessionId: this.sessionId,
        feedbackType: "self_critique",
        agentType: "reflector",
        critique: reflection.overallAssessment,
        improvementSuggestion: reflection.improvements?.join('; '),
        confidenceDelta: 0,
        lessonsLearned: reflection.lessonsLearned || [],
      });
    }
    
    return reflection;
  }
  
  /**
   * Log phase transition
   */
  private async logPhase(phase: string) {
    if (this.sessionId) {
      await storage.updateAgentSession(this.sessionId, { currentPhase: phase });
      this.emit("phase:changed", { sessionId: this.sessionId, phase });
    }
  }
  
  /**
   * Log agent thought (visible reasoning)
   */
  private async logThought(agentType: string, thoughtType: string, content: string, metadata?: any) {
    if (!this.sessionId) return;
    
    this.thoughtSequence++;
    
    const thought = await storage.createAgentThought({
      sessionId: this.sessionId,
      agentType,
      thoughtType,
      content,
      metadata,
      sequenceNumber: this.thoughtSequence,
    });
    
    this.emit("thought:created", { sessionId: this.sessionId, thought });
    
    return thought;
  }
  
  /**
   * Log agent action
   */
  private async logAction(agentType: string, actionType: string, description: string, params?: any, result?: any) {
    if (!this.sessionId) return;
    
    const action = await storage.createAgentAction({
      sessionId: this.sessionId,
      agentType,
      actionType,
      actionDescription: description,
      actionParams: params,
      result: result,
      success: 1,
    });
    
    this.emit("action:executed", { sessionId: this.sessionId, action });
    
    return action;
  }
  
  /**
   * Get session details with full reasoning trace
   */
  async getSessionDetails(sessionId: number) {
    const session = await storage.getAgentSession(sessionId);
    const thoughts = await storage.getSessionThoughts(sessionId);
    const actions = await storage.getSessionActions(sessionId);
    const feedback = await storage.getSessionFeedback(sessionId);
    
    return { session, thoughts, actions, feedback };
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
