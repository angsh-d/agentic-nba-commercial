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

// Multi-Hypothesis Causal Discovery Schema
const HypothesisSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  causalChain: z.array(z.string()), // e.g., ["ASCO conference", "Efficacy data", "RCC patient switching"]
  predictedPatterns: z.array(z.string()), // What we'd expect to see if true
  dataSourcesNeeded: z.array(z.string()), // Where to find evidence
  initialConfidence: z.number().min(0).max(100),
});

const HypothesisGenerationSchema = z.object({
  thought: z.string(),
  hypotheses: z.array(HypothesisSchema),
  rationale: z.string(),
});

const EvidenceScoreSchema = z.object({
  hypothesisId: z.string(),
  evidenceFound: z.array(z.object({
    source: z.string(),
    finding: z.string(),
    supportsHypothesis: z.boolean(),
    strength: z.enum(["weak", "moderate", "strong"]),
  })),
  finalConfidence: z.number().min(0).max(100),
  verdict: z.enum(["proven", "likely", "possible", "unlikely", "disproven"]),
  reasoning: z.string(),
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
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawPlan = JSON.parse(decodedContent);
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
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawEvidence = JSON.parse(decodedContent);
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

CRITICAL REQUIREMENT: Your NBA must be COHORT-SPECIFIC and address BOTH causal drivers identified in the evidence.

If evidence shows TWO DISTINCT SWITCHING PATTERNS (e.g., efficacy-driven for young RCC + safety-driven for CV-risk patients), your action MUST:
1. Be a DUAL-PURPOSE intervention that addresses both cohorts simultaneously
2. Include specific tactical elements: CME-aligned format, cardiology expert, peer KOL, live case review, monitoring protocols, and operational support with SLAs
3. Reference both cohorts explicitly in the action description

REQUIRED NBA FORMAT for dual-cohort switching:
{
  "action": "Host 60-90 minute CME-aligned Cardio-Oncology Tumor Board at [HOSPITAL] with: (1) Cardiology co-management expert to address CV-risk patient safety concerns, (2) Peer KOL to present nuanced [TRIAL NAME] subgroup data for [COHORT], (3) Review 8-12 live patient cases with pre-pulled charts, (4) Establish cardiac monitoring protocol and standing cardiology consult workflow, (5) Activate fast-track PA team with <10 business day SLA",
  "actionType": "event",
  "priority": "High",
  "reason": "Two distinct causal drivers require cohort-specific dual intervention: efficacy signal for [COHORT A] + safety signal for [COHORT B]",
  "aiInsight": "Dr. [Name]'s switching reveals two evidence-driven patterns: (1) [X] young RCC patients (ages [AGE RANGE]) switched [TIMEFRAME] following ASCO ORION-Y trial (Jun 15) showing 40% PFS benefit in patients <55—pure efficacy-driven adoption. (2) [Y] CV-risk patients (ages [AGE RANGE]) with cardiac comorbidities switched in September after experiencing [Z] cardiac AEs in August (QT prolongation, arrhythmia, chest pain) amplified by Onco-Rival safety webinar (Aug 30)—defensive safety-driven switching. Notably, [Z] stable cohort patients (bladder, ovarian, prostate) remain on Onco-Pro, confirming strategic not categorical switching. This dual-driver pattern requires a CME-aligned intervention combining cardiology co-management for CV safety AND peer-reviewed ORION-Y patient selection criteria for efficacy-appropriate young RCC use.",
  "confidenceScore": 85,
  "expectedOutcome": "Retain stable cohort, win back selective CV-risk patients via monitoring protocols, establish appropriate ORION-Y selection criteria for young RCC segment",
  "timeframe": "Within 3 weeks"
}

If evidence shows only ONE cohort pattern, generate a standard targeted NBA.

OUTPUT (JSON):
{
  "thought": "Why this is the optimal action based on causal patterns...",
  "action": "Specific cohort-aware action with tactical elements",
  "actionType": "meeting|email|call|event",
  "priority": "High|Medium|Low",
  "reason": "Business justification with explicit cohort drivers",
  "aiInsight": "LAYERED NARRATIVE with cohort labels, specific dates, percentages, temporal correlations, and dual causal drivers",
  "confidenceScore": 85,
  "expectedOutcome": "What we expect to achieve per cohort",
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
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawSynthesis = JSON.parse(decodedContent);
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
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawReflection = JSON.parse(decodedContent);
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
   * CAUSAL DISCOVERY AGENT - Multi-Hypothesis Investigation
   * Generates competing hypotheses, gathers evidence, and identifies root causes
   */
  async executeCausalInvestigation(hcpId: number) {
    const goal = `Investigate root causes of switching behavior for HCP ${hcpId} using multi-hypothesis reasoning`;
    const session = await this.startSession(goal, "causal_investigation", { hcpId });
    
    try {
      await this.logPhase("Hypothesis Generation");
      
      // Step 1: Generate multiple competing hypotheses
      const hypotheses = await this.generateHypotheses(hcpId);
      await this.logAction("causal_discovery", "generate_hypotheses", 
        `Generated ${hypotheses.hypotheses.length} competing hypotheses`, 
        { hcpId }, 
        { count: hypotheses.hypotheses.length }
      );
      
      await this.logPhase("Evidence Gathering");
      
      // Step 2: Fan out - test each hypothesis in parallel
      const evidenceScores = await Promise.all(
        hypotheses.hypotheses.map(h => this.gatherEvidenceForHypothesis(h, hcpId))
      );
      
      await this.logPhase("Hypothesis Evaluation");
      
      // Step 3: Score and rank hypotheses
      const rankedHypotheses = evidenceScores
        .map((score, idx) => ({
          hypothesis: hypotheses.hypotheses[idx],
          evidence: score,
        }))
        .sort((a, b) => b.evidence.finalConfidence - a.evidence.finalConfidence);
      
      // Step 4: Prune weak hypotheses
      const provenHypotheses = rankedHypotheses.filter(
        h => h.evidence.finalConfidence >= 70 && 
        (h.evidence.verdict === "proven" || h.evidence.verdict === "likely")
      );
      
      const ruledOut = rankedHypotheses.filter(h => h.evidence.finalConfidence < 40);
      
      await this.logThought("causal_discovery", "reasoning",
        `Investigation complete: ${provenHypotheses.length} hypotheses proven, ${ruledOut.length} ruled out`
      );
      
      // Finalize session with investigation results in contextData
      await storage.updateAgentSession(session.id, {
        status: "completed",
        finalOutcome: `Causal investigation complete. Top hypothesis: ${provenHypotheses[0]?.hypothesis.title} (${provenHypotheses[0]?.evidence.finalConfidence}% confidence)`,
        confidenceScore: provenHypotheses[0]?.evidence.finalConfidence || 0,
        contextData: {
          ...(session.contextData || {}),
          provenHypotheses,
          allHypotheses: rankedHypotheses,
          ruledOut,
        },
        completedAt: new Date(),
      });
      
      return {
        sessionId: session.id,
        allHypotheses: rankedHypotheses,
        provenHypotheses,
        ruledOut,
        topHypothesis: provenHypotheses[0],
      };
      
    } catch (error) {
      await storage.updateAgentSession(session.id, {
        status: "failed",
        finalOutcome: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        completedAt: new Date(),
      });
      throw error;
    }
  }
  
  /**
   * Generate multiple competing hypotheses for switching behavior
   */
  private async generateHypotheses(hcpId: number) {
    await this.logThought("causal_discovery", "observation",
      `Analyzing HCP ${hcpId} to generate multiple competing causal hypotheses`
    );
    
    const hcp = await storage.getHcp(hcpId);
    const history = await storage.getPrescriptionHistory(hcpId);
    const patients = await storage.getPatientsByHcp(hcpId);
    const events = await storage.getClinicalEventsByHcp(hcpId);
    
    const switchedCount = patients.filter(p => p.switchedDate).length;
    const totalCount = patients.length;
    
    const prompt = `You are a Causal Discovery Agent investigating prescription switching behavior.

HCP PROFILE:
- Name: ${hcp?.name}
- Specialty: ${hcp?.specialty}
- Hospital: ${hcp?.hospital}
- Patients: ${totalCount} total, ${switchedCount} switched (${Math.round(switchedCount/totalCount*100)}%)

PRESCRIPTION TIMELINE:
${history.slice(0, 8).map(h => `${h.month}: ${h.productName} (${h.prescriptionCount} Rx)`).join('\n')}

CLINICAL EVENTS:
${events.map(e => `- ${e.eventDate.toISOString().split('T')[0]}: ${e.eventTitle} (${e.eventType})`).join('\n')}

PATIENT COHORTS:
${patients.slice(0, 6).map(p => `- ${p.patientCode}: Age ${p.age}, ${p.cancerType}, ${p.cohort} cohort, ${p.switchedDate ? 'Switched' : 'Stable'}`).join('\n')}

TASK: Generate 3-5 COMPETING causal hypotheses that could explain the switching behavior.

CRITICAL: If you see MULTIPLE PATIENT COHORTS (young_rcc, cv_risk, stable) in the data, generate COHORT-SPECIFIC hypotheses.
- Label each hypothesis with the affected cohort: "[Young RCC] ...", "[CV-Risk] ...", "[Stable] ..."
- Link each hypothesis to a specific causal trigger (conference, adverse event, etc.)
- Explain WHY that trigger would affect THAT specific cohort

Think like a detective: what are DIFFERENT possible root causes? Consider:
- Conference/clinical trial data (efficacy-driven for specific indications)
- Adverse events/safety signals (safety-driven for at-risk patients)
- Competitor marketing/pricing
- Payer/formulary changes
- Peer influence
- Patient population shifts

EXAMPLE COHORT-SPECIFIC HYPOTHESES:
{
  "id": "H1",
  "title": "[Young RCC Cohort] ASCO ORION-Y trial drove systematic efficacy-based adoption",
  "description": "Young RCC patients (ages <55) switched following June 15 ASCO presentation showing 40% PFS benefit in this specific subgroup",
  "causalChain": ["ASCO ORION-Y trial (Jun 15)", "40% PFS benefit in <55 age group", "Evidence-based efficacy signal", "Young RCC cohort switching (Jul-Aug)"],
  "predictedPatterns": ["Switches cluster in July-Aug (post-conference)", "Only young_rcc cohort affected", "Temporal alignment with trial publication"],
  "dataSourcesNeeded": ["ASCO conference schedule", "ORION-Y trial data", "Patient age/indication breakdown"],
  "initialConfidence": 75
}

OUTPUT (JSON):
{
  "thought": "My reasoning about potential causes...",
  "hypotheses": [
    {
      "id": "H1",
      "title": "[Cohort Name] Specific causal trigger and mechanism",
      "description": "Detailed explanation linking cause to specific patient cohort",
      "causalChain": ["Event/Trigger", "Mechanism", "HCP decision", "Cohort-specific switching"],
      "predictedPatterns": ["Temporal correlation", "Cohort selectivity", "Other observable patterns"],
      "dataSourcesNeeded": ["Source 1", "Source 2"],
      "initialConfidence": 60-90
    }
  ],
  "rationale": "Why I generated these cohort-specific hypotheses..."
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty hypothesis generation response");
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawHypotheses = JSON.parse(decodedContent);
    const hypotheses = HypothesisGenerationSchema.parse(rawHypotheses);
    
    await this.logThought("causal_discovery", "reasoning", hypotheses.thought);
    
    return hypotheses;
  }
  
  /**
   * Gather and score evidence for a specific hypothesis
   */
  private async gatherEvidenceForHypothesis(hypothesis: z.infer<typeof HypothesisSchema>, hcpId: number) {
    await this.logThought("causal_discovery", "observation",
      `Testing hypothesis: ${hypothesis.title}`
    );
    
    const hcp = await storage.getHcp(hcpId);
    const history = await storage.getPrescriptionHistory(hcpId);
    const patients = await storage.getPatientsByHcp(hcpId);
    const events = await storage.getClinicalEventsByHcp(hcpId);
    
    const prompt = `You are an Evidence Analyst with access to MULTIPLE data sources testing a specific causal hypothesis.

HYPOTHESIS:
${JSON.stringify(hypothesis, null, 2)}

INTERNAL DATA SOURCES:
Prescription History: ${history.length} months
Patients: ${patients.length} (${patients.filter(p => p.switchedDate).length} switched)
Clinical Events: ${events.length} events
${events.map(e => `- ${e.eventDate.toISOString().split('T')[0]}: ${e.eventTitle}`).join('\n')}

Cohort Breakdown:
${Object.entries(patients.reduce((acc: any, p) => { acc[p.cohort] = (acc[p.cohort] || 0) + 1; return acc; }, {}))
  .map(([cohort, count]) => `- ${cohort}: ${count} patients`)
  .join('\n')}

EXTERNAL DATA SOURCES YOU CAN QUERY (generate realistic synthetic findings):
1. FDA FAERS Database - Adverse event reports (exact case counts, MedDRA terms, reporting trends)
2. PubMed/Clinical Literature - Recent publications, trial results, meta-analyses (with DOI, journal names, dates)
3. ASCO/ESMO Conference Archives - Presentation abstracts, poster sessions (with abstract IDs, presenters, institutions)
4. Real-World Evidence Databases - Claims data patterns, market share shifts (with specific percentages, timeframes)
5. Competitor Marketing Intelligence - Campaign launches, promotional materials, HCP outreach programs
6. Payer/Formulary Databases - Coverage changes, prior auth requirements, tier placements (specific plans, dates)
7. KOL Social Media/Publications - Twitter threads, blog posts, opinion pieces by named oncologists
8. Medical Affairs Field Reports - HCP feedback themes, clinical questions, objection patterns

CRITICAL INSTRUCTIONS:
- Generate 6-10 pieces of evidence from DIVERSE sources (mix internal + external)
- Make external evidence ULTRA-REALISTIC with specific details:
  * Exact numbers (e.g., "847 FAERS reports", "N=1,247 patients", "23.4% market share decline")
  * Real-sounding names (Dr. names, institutions, journals, conference sessions)
  * Precise dates and timeframes
  * Technical terminology (MedDRA codes, ICD-10, NCCN guidelines, etc.)
  * Volumous variety - don't repeat source types
- Be OBJECTIVE: some evidence may contradict the hypothesis
- Vary evidence strength: mix strong, moderate, and weak findings

EXAMPLE REALISTIC EVIDENCE FORMAT:
{
  "source": "FDA FAERS Database Query (Jan-Aug 2025)",
  "finding": "Identified 127 cardiac adverse event reports for Onco-Pro (MedDRA PT: Myocardial infarction, SOC: Cardiac disorders). 68% occurred in patients >65 years. Reporting rate increased 340% in Q3 2025 vs. Q2 baseline.",
  "supportsHypothesis": true,
  "strength": "strong"
}

OUTPUT (JSON):
{
  "hypothesisId": "${hypothesis.id}",
  "evidenceFound": [
    /* 6-10 realistic evidence items from varied sources */
  ],
  "finalConfidence": 85,
  "verdict": "proven",
  "reasoning": "Detailed analysis of why hypothesis is proven/disproven based on preponderance of evidence..."
}`;
    
    const response = await azureOpenAI.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 6000,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty evidence scoring response");
    
    // Decode HTML entities that may appear in Azure OpenAI responses
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const rawScore = JSON.parse(decodedContent);
    const score = EvidenceScoreSchema.parse(rawScore);
    
    await this.logAction("causal_discovery", "gather_evidence",
      `Found ${score.evidenceFound.length} pieces of evidence for ${hypothesis.title}`,
      { hypothesisId: hypothesis.id },
      { confidence: score.finalConfidence, verdict: score.verdict }
    );
    
    return score;
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
