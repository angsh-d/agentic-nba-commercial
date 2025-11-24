import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHcpSchema, insertNbaSchema, insertTerritoryPlanSchema, insertSwitchingAnalyticsSchema, insertPrescriptionHistorySchema } from "@shared/schema";
import { z } from "zod";
import { detectSwitchingPatterns, runSwitchingDetectionForAllHCPs } from "./switchingDetection";
import { generateIntelligentNBA, generateTerritoryPlanWithAI, processCopilotQuery, generateCounterfactualAnalysis, generateNBAWithProvenance, generateCallScript, generateEmailDraft, generateMeetingAgenda } from "./aiService";
import { agentOrchestrator, detectSignalsForHcp, discoverCorrelations, generateRiskInsight } from "./agentOrchestrator";

export async function registerRoutes(app: Express): Promise<Server> {
  // HCP routes
  app.get("/api/hcps", async (_req, res) => {
    try {
      const hcps = await storage.getAllHcps();
      res.json(hcps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HCPs" });
    }
  });

  app.get("/api/hcps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hcp = await storage.getHcp(id);
      if (!hcp) {
        return res.status(404).json({ error: "HCP not found" });
      }
      res.json(hcp);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HCP" });
    }
  });

  // Get comparative prescription trends with benchmarks
  app.get("/api/hcps/:id/prescription-trends", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get prescription history for this HCP
      const history = await storage.getPrescriptionHistory(id);
      
      // Group by month and aggregate
      const monthlyData = new Map<string, { ownDrug: number; competitorDrug: number }>();
      
      history.forEach((record: any) => {
        const existing = monthlyData.get(record.month) || { ownDrug: 0, competitorDrug: 0 };
        if (record.isOurProduct === 1) {
          existing.ownDrug += record.prescriptionCount;
        } else {
          existing.competitorDrug += record.prescriptionCount;
        }
        monthlyData.set(record.month, existing);
      });
      
      // Sort by month and convert to array
      const sortedMonths = Array.from(monthlyData.keys()).sort();
      const trends = sortedMonths.map(month => {
        const data = monthlyData.get(month)!;
        return {
          month: month.substring(5), // Extract MM from YYYY-MM
          ownDrug: data.ownDrug,
          competitorDrug: data.competitorDrug,
          // Synthetic benchmarks (in production, these would come from real aggregated data)
          regionalBenchmarkOwn: 30,
          regionalBenchmarkCompetitor: 12,
          nationalBenchmarkOwn: 28,
          nationalBenchmarkCompetitor: 10,
        };
      });
      
      res.json(trends);
    } catch (error) {
      console.error("Failed to get prescription trends:", error);
      res.status(500).json({ error: "Failed to retrieve prescription trends" });
    }
  });

  app.get("/api/hcps/:id/call-notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const callNotes = await storage.getCallNotesByHcp(id);
      res.json(callNotes);
    } catch (error) {
      console.error("Failed to get call notes:", error);
      res.status(500).json({ error: "Failed to retrieve call notes" });
    }
  });

  app.get("/api/hcps/:id/payer-communications", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payerCommunications = await storage.getPayerCommunicationsByHcp(id);
      res.json(payerCommunications);
    } catch (error) {
      console.error("Failed to get payer communications:", error);
      res.status(500).json({ error: "Failed to retrieve payer communications" });
    }
  });

  // Stage 3 Agent Activity Feed - Ensemble synthesis from multiple sources
  app.get("/api/hcps/:id/stage3-activity", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const startTime = Date.now();
      
      // Simulated agent activities for Stage 3: Synthesize & Reflect (~40 seconds)
      const activities = [
        { id: 1, timestamp: startTime, agent: "Orchestrator Agent", activity: "Initializing ensemble synthesis pipeline...", status: "in_progress" },
        { id: 2, timestamp: startTime + 3000, agent: "Orchestrator Agent", activity: "Routing to 3 parallel engines: LLM, RL-NBA, Rules", status: "completed" },
        { id: 3, timestamp: startTime + 4000, agent: "LLM Engine", activity: "Generating strategic recommendations from proven hypotheses...", status: "in_progress" },
        { id: 4, timestamp: startTime + 8000, agent: "LLM Engine", activity: id === 1 ? "Generated 4 safety-focused NBAs with contextual rationale" : "Generated 5 access-barrier NBAs with tactical steps", status: "completed" },
        { id: 5, timestamp: startTime + 5000, agent: "RL-based NBA Engine", activity: "Analyzing historical effectiveness patterns...", status: "in_progress" },
        { id: 6, timestamp: startTime + 10000, agent: "RL-based NBA Engine", activity: id === 1 ? "Scored actions: Medical Affairs +0.82, KOL Engagement +0.76" : "Scored actions: Benefits Investigation +0.88, Hub Services +0.79", status: "completed" },
        { id: 7, timestamp: startTime + 6000, agent: "Rules Engine", activity: "Validating against compliance & commercial guardrails...", status: "in_progress" },
        { id: 8, timestamp: startTime + 11000, agent: "Rules Engine", activity: id === 1 ? "3/4 actions approved, 1 flagged (promotional timing)" : "4/5 actions approved, 1 optimized (copay program eligibility)", status: "completed" },
        { id: 9, timestamp: startTime + 12000, agent: "Ensemble Synthesizer", activity: "Weighing LLM creativity × RL effectiveness × Rules compliance...", status: "in_progress" },
        { id: 10, timestamp: startTime + 17000, agent: "Ensemble Synthesizer", activity: id === 1 ? "Weighted ensemble: LLM 40% + RL 35% + Rules 25%" : "Weighted ensemble: RL 45% + LLM 30% + Rules 25%", status: "completed" },
        { id: 11, timestamp: startTime + 18000, agent: "Ensemble Synthesizer", activity: "Ranking final NBA candidates by composite score...", status: "in_progress" },
        { id: 12, timestamp: startTime + 22000, agent: "Ensemble Synthesizer", activity: id === 1 ? "Top NBA: Medical Affairs engagement (0.87 composite)" : "Top NBA: Benefits Investigation Service (0.91 composite)", status: "completed" },
        { id: 13, timestamp: startTime + 23000, agent: "Reflector Agent", activity: "Assessing recommendation confidence & uncertainty...", status: "in_progress" },
        { id: 14, timestamp: startTime + 28000, agent: "Reflector Agent", activity: id === 1 ? "High confidence (89%) - strong causal evidence + proven tactic" : "Very high confidence (94%) - clear barrier + high RL score", status: "completed" },
        { id: 15, timestamp: startTime + 29000, agent: "Reflector Agent", activity: "Identifying adaptation triggers for monitoring...", status: "in_progress" },
        { id: 16, timestamp: startTime + 33000, agent: "Reflector Agent", activity: id === 1 ? "Monitor: New cardiac events, ASCO follow-up, competitor moves" : "Monitor: Policy reversals, PA approval rates, patient access", status: "completed" },
        { id: 17, timestamp: startTime + 34000, agent: "Contextualizer Agent", activity: "Generating field-ready tactical playbook...", status: "in_progress" },
        { id: 18, timestamp: startTime + 40000, agent: "Contextualizer Agent", activity: id === 1 ? "Playbook ready: 3 NBAs with timing, talking points, resources" : "Playbook ready: 4 NBAs with sequencing, scripts, support tools", status: "completed" },
      ];

      res.json(activities);
    } catch (error) {
      console.error("Failed to get stage 3 activity:", error);
      res.status(500).json({ error: "Failed to retrieve agent activity" });
    }
  });

  // Stage 2 Agent Activity Feed - Causal investigation with hypothesis testing
  app.get("/api/hcps/:id/stage2-activity", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const startTime = Date.now();
      
      // Simulated agent activities for Stage 2: Plan & Investigate (~35 seconds)
      const activities = [
        { id: 1, timestamp: startTime, agent: "Planner Agent", activity: "Creating investigation strategy...", status: "in_progress" },
        { id: 2, timestamp: startTime + 4000, agent: "Planner Agent", activity: id === 1 ? "Identified 2 causal domains: safety + temporal events" : "Identified primary domain: access barriers", status: "completed" },
        { id: 3, timestamp: startTime + 5000, agent: "Hypothesis Generator", activity: "Building competing hypothesis tree...", status: "in_progress" },
        { id: 4, timestamp: startTime + 8000, agent: "Hypothesis Generator", activity: id === 1 ? "Generated 5 hypotheses across safety, efficacy, access domains" : "Generated 6 hypotheses: copay, PA, fulfillment, network, formulary, competitive", status: "completed" },
        { id: 5, timestamp: startTime + 9000, agent: "Evidence Gatherer", activity: "Cross-referencing call notes with patient switches...", status: "in_progress" },
        { id: 6, timestamp: startTime + 13000, agent: "Evidence Gatherer", activity: id === 1 ? "Found 6 cardiac events correlating with 6 switches" : "Found 100% correlation between Aug 1 policy and switch dates", status: "completed" },
        { id: 7, timestamp: startTime + 14000, agent: "Hypothesis Tester", activity: id === 1 ? "Testing H1: Cardiac safety concerns..." : "Testing H1: High copay shock...", status: "in_progress" },
        { id: 8, timestamp: startTime + 17000, agent: "Hypothesis Tester", activity: id === 1 ? "H1 proven: 100% switch rate in CV-risk cohort" : "H1 proven: 4/4 copay shock patients switched", status: "completed" },
        { id: 9, timestamp: startTime + 18000, agent: "Hypothesis Tester", activity: id === 1 ? "Testing H2: ASCO conference influence..." : "Testing H2: PA denial patterns...", status: "in_progress" },
        { id: 10, timestamp: startTime + 21000, agent: "Hypothesis Tester", activity: id === 1 ? "H2 proven: Young RCC cohort switched post-ASCO" : "H2 proven: 3/3 PA denied patients switched", status: "completed" },
        { id: 11, timestamp: startTime + 22000, agent: "Hypothesis Tester", activity: id === 1 ? "Testing H3-H5: Access barriers, competitive..." : "Testing H3: Fulfillment delays...", status: "in_progress" },
        { id: 12, timestamp: startTime + 25000, agent: "Hypothesis Tester", activity: id === 1 ? "H3-H5 disproven: No access/competitive evidence" : "H3 proven: 2/2 fulfillment delay patients switched", status: "completed" },
        { id: 13, timestamp: startTime + 26000, agent: "Causal Analyzer", activity: "Building causal graph from proven hypotheses...", status: "in_progress" },
        { id: 14, timestamp: startTime + 30000, agent: "Causal Analyzer", activity: id === 1 ? "Dual causality confirmed: safety + temporal" : "Multi-payer causality confirmed: 3 access barriers", status: "completed" },
        { id: 15, timestamp: startTime + 31000, agent: "Confidence Scorer", activity: "Calculating evidence-to-hypothesis confidence...", status: "in_progress" },
        { id: 16, timestamp: startTime + 35000, agent: "Confidence Scorer", activity: id === 1 ? "Final confidence: 92% (6/6 events + 6/6 switches)" : "Final confidence: 95% (9/9 switches + policy correlation)", status: "completed" },
      ];

      res.json(activities);
    } catch (error) {
      console.error("Failed to get stage 2 activity:", error);
      res.status(500).json({ error: "Failed to retrieve agent activity" });
    }
  });

  // Stage 1 Agent Activity Feed - Simulates agents analyzing data in real-time
  app.get("/api/hcps/:id/stage1-activity", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const startTime = Date.now();
      
      // Simulated agent activities for Stage 1: Observe & Correlate (~30 seconds)
      const activities = [
        { id: 1, timestamp: startTime, agent: "Signal Detector", activity: "Scanning prescription history database...", status: "in_progress" },
        { id: 2, timestamp: startTime + 4000, agent: "Signal Detector", activity: "Analyzing 8 months of prescription data...", status: "in_progress" },
        { id: 3, timestamp: startTime + 7000, agent: "Signal Detector", activity: "Detected 44% Rx volume decline (45→25)", status: "completed" },
        { id: 4, timestamp: startTime + 8000, agent: "NLP Analyzer", activity: "Processing 15 field call notes...", status: "in_progress" },
        { id: 5, timestamp: startTime + 12000, agent: "NLP Analyzer", activity: "Running sentiment analysis on HCP feedback...", status: "in_progress" },
        { id: 6, timestamp: startTime + 15000, agent: "NLP Analyzer", activity: "Extracted sentiment shift: positive→frustrated", status: "completed" },
        { id: 7, timestamp: startTime + 16000, agent: "Document Parser", activity: "Analyzing payer communications...", status: "in_progress" },
        { id: 8, timestamp: startTime + 19000, agent: "Document Parser", activity: id === 1 ? "No formulary changes detected" : "Found Tier 3 policy change (Aug 1)", status: "completed" },
        { id: 9, timestamp: startTime + 20000, agent: "Cohort Tracker", activity: "Mapping patient cohorts and switching patterns...", status: "in_progress" },
        { id: 10, timestamp: startTime + 24000, agent: "Cohort Tracker", activity: id === 1 ? "Identified 6 switches in 2 cohorts" : "Identified 9 switches across 4 access cohorts", status: "completed" },
        { id: 11, timestamp: startTime + 25000, agent: "Correlation Engine", activity: "Cross-referencing temporal signals...", status: "in_progress" },
        { id: 12, timestamp: startTime + 28000, agent: "Correlation Engine", activity: "Building causal hypothesis tree...", status: "in_progress" },
        { id: 13, timestamp: startTime + 30000, agent: "Correlation Engine", activity: id === 1 ? "Dual causality detected: safety events + ASCO conference" : "Causality: Aug 1 multi-payer policy changes", status: "completed" },
      ];

      res.json(activities);
    } catch (error) {
      console.error("Failed to get stage 1 activity:", error);
      res.status(500).json({ error: "Failed to retrieve agent activity" });
    }
  });

  app.post("/api/hcps", async (req, res) => {
    try {
      const validatedData = insertHcpSchema.parse(req.body);
      const hcp = await storage.createHcp(validatedData);
      res.status(201).json(hcp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create HCP" });
    }
  });

  // Counterfactual Analysis
  app.post("/api/hcps/:id/counterfactual", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      // Fetch comprehensive HCP data for dynamic context
      const [hcp, prescriptionHistory, callNotes, payerComms, patients, clinicalEvents] = await Promise.all([
        storage.getHcp(id),
        storage.getPrescriptionHistory(id),
        storage.getCallNotesByHcp(id),
        storage.getPayerCommunicationsByHcp(id),
        storage.getPatientsByHcp(id),
        storage.getClinicalEventsByHcp(id),
      ]);

      // Generate counterfactual analysis using AI
      const answer = await generateCounterfactualAnalysis(id, question, {
        hcp: hcp || undefined,
        prescriptionHistory,
        callNotes,
        payerCommunications: payerComms,
        patients,
        clinicalEvents,
      });

      res.json({ answer });
    } catch (error) {
      console.error("Counterfactual analysis error:", error);
      res.status(500).json({ error: "Failed to generate counterfactual analysis" });
    }
  });

  // NBA Provenance (shows RL, Rules, LLM contributions)
  app.get("/api/hcps/:id/nba-provenance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Fetch HCP data
      const hcp = await storage.getHcp(id);
      if (!hcp) {
        return res.status(404).json({ error: "HCP not found" });
      }
      
      const prescriptionHistory = await storage.getPrescriptionHistory(id);
      const switchingEvents = await storage.getSwitchingEventsByStatus("active");
      const switchingEvent = switchingEvents.find(e => e.hcp.id === id);
      
      // Generate NBA with provenance
      const provenance = await generateNBAWithProvenance(hcp, prescriptionHistory, switchingEvent);
      
      res.json(provenance);
    } catch (error) {
      console.error("NBA provenance error:", error);
      res.status(500).json({ error: "Failed to generate NBA provenance" });
    }
  });

  // Next Best Actions routes
  app.get("/api/nbas", async (req, res) => {
    try {
      const { territory } = req.query;
      const nbas = territory 
        ? await storage.getNbasByTerritory(territory as string)
        : await storage.getAllNbas();
      res.json(nbas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NBAs" });
    }
  });

  app.post("/api/nbas", async (req, res) => {
    try {
      const validatedData = insertNbaSchema.parse(req.body);
      const nba = await storage.createNba(validatedData);
      res.status(201).json(nba);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create NBA" });
    }
  });

  app.patch("/api/nbas/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateNbaStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update NBA status" });
    }
  });

  // Territory Plans routes
  app.get("/api/territory-plans/:territory", async (req, res) => {
    try {
      const { territory } = req.params;
      const plan = await storage.getTerritoryPlan(territory, new Date());
      if (!plan) {
        return res.status(404).json({ error: "No plan found for territory" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch territory plan" });
    }
  });

  app.post("/api/territory-plans", async (req, res) => {
    try {
      const validatedData = insertTerritoryPlanSchema.parse(req.body);
      const plan = await storage.createTerritoryPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create territory plan" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/latest", async (_req, res) => {
    try {
      const analytics = await storage.getLatestAnalytics();
      if (!analytics) {
        return res.status(404).json({ error: "No analytics data found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics", async (req, res) => {
    try {
      const validatedData = insertSwitchingAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(validatedData);
      res.status(201).json(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create analytics" });
    }
  });

  // Stats endpoint - aggregate data for dashboard
  app.get("/api/stats", async (_req, res) => {
    try {
      const hcps = await storage.getAllHcps();
      const nbas = await storage.getAllNbas();
      const highRiskHcps = await storage.getHighRiskHcps(50);
      
      const stats = {
        activeHcps: hcps.length,
        switchingRisks: highRiskHcps.length,
        actionsCompleted: nbas.filter(n => n.status === "completed").length,
        totalActions: nbas.length,
        agentAccuracy: 94.2,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Switching Detection endpoints
  app.get("/api/switching/events", async (req, res) => {
    try {
      const { status } = req.query;
      const events = status 
        ? await storage.getSwitchingEventsByStatus(status as string)
        : await storage.getAllSwitchingEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch switching events" });
    }
  });

  app.patch("/api/switching/events/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateSwitchingEventStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update event status" });
    }
  });

  app.get("/api/switching/high-risk", async (req, res) => {
    try {
      const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : 50;
      const highRiskHcps = await storage.getHighRiskHcps(minScore);
      res.json(highRiskHcps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch high-risk HCPs" });
    }
  });

  app.post("/api/switching/analyze/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const analysis = await detectSwitchingPatterns(hcpId);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze HCP" });
    }
  });

  app.post("/api/switching/analyze-all", async (_req, res) => {
    try {
      await runSwitchingDetectionForAllHCPs();
      res.json({ success: true, message: "Switching detection completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run detection" });
    }
  });

  // Prescription History endpoints
  app.get("/api/prescription-history/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const history = await storage.getPrescriptionHistory(hcpId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescription history" });
    }
  });

  app.post("/api/prescription-history", async (req, res) => {
    try {
      const validatedData = insertPrescriptionHistorySchema.parse(req.body);
      const history = await storage.createPrescriptionHistory(validatedData);
      res.status(201).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create prescription history" });
    }
  });

  // Patient endpoints
  app.get("/api/hcps/:hcpId/patients", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const patients = await storage.getPatientsByHcp(hcpId);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Clinical Event endpoints
  app.get("/api/hcps/:hcpId/events", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const events = await storage.getClinicalEventsByHcp(hcpId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clinical events" });
    }
  });

  // AI-Powered endpoints
  
  // Causal Investigation - Multi-Hypothesis Reasoning
  app.post("/api/ai/investigate/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const hcp = await storage.getHcp(hcpId);
      if (!hcp) {
        return res.status(404).json({ error: "HCP not found" });
      }

      // Trigger async causal investigation
      const investigation = await agentOrchestrator.executeCausalInvestigation(hcpId);
      
      res.json({ 
        success: true,
        sessionId: investigation.sessionId,
        investigation 
      });
    } catch (error) {
      console.error("Causal investigation error:", error);
      res.status(500).json({ error: "Failed to run causal investigation" });
    }
  });

  // Get investigation results for an HCP
  app.get("/api/ai/investigation-results/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      
      // Get all sessions for this HCP
      const sessions = await storage.getAgentSessionsByHcp(hcpId);
      
      // Filter for completed causal investigation sessions only
      const investigationSessions = sessions.filter(
        s => s.goalType === 'causal_investigation' && s.status === 'completed'
      );
      
      if (investigationSessions.length === 0) {
        return res.json({ hasInvestigation: false });
      }
      
      // Sort investigation sessions by startedAt DESC to get the most recent
      investigationSessions.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      
      // Get the most recent completed investigation
      const latestInvestigation = investigationSessions[0];
      const sessionDetails = await agentOrchestrator.getSessionDetails(latestInvestigation.id);
      
      // Parse the proven hypotheses from session contextData
      const provenHypotheses = latestInvestigation.contextData?.provenHypotheses || [];
      const allHypotheses = latestInvestigation.contextData?.allHypotheses || [];
      const confirmedHypotheses = latestInvestigation.contextData?.confirmedHypotheses || [];
      const isConfirmed = latestInvestigation.contextData?.humanConfirmed || false;
      
      res.json({
        hasInvestigation: true,
        session: latestInvestigation,
        provenHypotheses,
        allHypotheses,
        confirmedHypotheses,
        isConfirmed,
        thoughts: sessionDetails.thoughts,
        actions: sessionDetails.actions,
      });
    } catch (error) {
      console.error("Failed to get investigation results:", error);
      res.status(500).json({ error: "Failed to retrieve investigation results" });
    }
  });

  // Submit human confirmation of investigation hypotheses
  app.post("/api/ai/confirm-investigation/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const { confirmedHypotheses, smeNotes } = req.body;
      
      // Validation: Require at least one confirmed hypothesis
      if (!confirmedHypotheses || confirmedHypotheses.length === 0) {
        return res.status(400).json({ error: "At least one hypothesis must be confirmed" });
      }
      
      // Get the most recent investigation session
      const sessions = await storage.getAgentSessionsByHcp(hcpId);
      const investigationSessions = sessions.filter(
        s => s.goalType === 'causal_investigation' && s.status === 'completed'
      );
      
      if (investigationSessions.length === 0) {
        return res.status(404).json({ error: "No completed investigation found" });
      }
      
      investigationSessions.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      
      const latestInvestigation = investigationSessions[0];
      const provenHypotheses = latestInvestigation.contextData?.provenHypotheses || [];
      
      // Validation: Only allow confirmation of proven hypotheses
      const provenIds = new Set(provenHypotheses.map((h: any) => h.hypothesis.id));
      const invalidConfirmations = confirmedHypotheses.filter(
        (h: any) => !provenIds.has(h.hypothesis.id)
      );
      
      if (invalidConfirmations.length > 0) {
        return res.status(400).json({ 
          error: "Can only confirm hypotheses that were proven by investigation"
        });
      }
      
      // Store full hypothesis objects (not just IDs) so they can be retrieved later
      await storage.updateAgentSession(latestInvestigation.id, {
        contextData: {
          ...latestInvestigation.contextData,
          confirmedHypotheses: confirmedHypotheses, // Full hypothesis result objects
          humanConfirmed: true,
          smeNotes,
          confirmedAt: new Date().toISOString(),
        },
      });
      
      res.json({ 
        success: true,
        confirmedCount: confirmedHypotheses.length,
        message: "Investigation confirmed by SME"
      });
    } catch (error) {
      console.error("Failed to confirm investigation:", error);
      res.status(500).json({ error: "Failed to save confirmation" });
    }
  });
  
  app.post("/api/ai/territory-plan/:territory", async (req, res) => {
    try {
      const { territory } = req.params;
      const hcps = await storage.getAllHcps();
      const territoryHcps = hcps.filter(h => h.territory === territory);
      const nbas = await storage.getNbasByTerritory(territory);

      const aiPlan = await generateTerritoryPlanWithAI(
        territory,
        territoryHcps,
        nbas.length
      );

      res.json(aiPlan);
    } catch (error) {
      console.error("AI territory planning error:", error);
      res.status(500).json({ error: "Failed to generate AI territory plan" });
    }
  });

  app.post("/api/ai/copilot", async (req, res) => {
    try {
      const { query, context } = req.body;
      const response = await processCopilotQuery(query, context);
      res.json({ response });
    } catch (error) {
      console.error("Copilot query error:", error);
      res.status(500).json({ error: "Failed to process copilot query" });
    }
  });

  // Generate NBA for a single HCP (Phase 1)
  app.post("/api/ai/generate-nba/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      
      // Create session FIRST and return its ID immediately
      const sessionId = await agentOrchestrator.createSession(
        `Generate optimal Next Best Action for HCP ${hcpId} with full reasoning trace`,
        "nba_generation",
        { hcpId }
      );
      
      // Run orchestrator in background (don't await)
      agentOrchestrator.executeNBAGenerationLoop(hcpId, sessionId).then(result => {
        console.log(`NBA generation completed for HCP ${hcpId}, session ${sessionId}`);
      }).catch(error => {
        console.error(`Failed to generate NBA for HCP ${hcpId}:`, error);
        storage.updateAgentSession(sessionId, { status: 'failed' }).catch(console.error);
      });

      // Return immediately with session ID
      res.json({ 
        success: true,
        sessionId,
        hcpId,
        message: `NBA generation started for HCP ${hcpId}` 
      });
    } catch (error) {
      console.error("NBA generation error:", error);
      res.status(500).json({ error: "Failed to start NBA generation" });
    }
  });

  // Get formatted NBA results for Phase 1 display
  app.get("/api/ai/nba-results/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      
      // Get the most recent session for this HCP
      const sessions = await storage.getAgentSessionsByHcp(hcpId);
      if (!sessions || sessions.length === 0) {
        return res.json({ hasResults: false });
      }
      
      const latestSession = sessions[0];
      const sessionDetails = await agentOrchestrator.getSessionDetails(latestSession.id);
      
      // Get the NBA created in this session
      const nbas = await storage.getNbasByHcp(hcpId);
      let latestNba = nbas.find((nba: any) => {
        // Find NBA created around the same time as this session
        const nbaTime = new Date(nba.generatedAt).getTime();
        const sessionTime = new Date(latestSession.startedAt).getTime();
        return Math.abs(nbaTime - sessionTime) < 120000; // Within 2 minutes (NBA generation can take 60-90 seconds)
      });
      
      // If no NBA found for this session (e.g., session failed), show the most recent NBA available
      if (!latestNba && nbas.length > 0) {
        latestNba = nbas[0]; // NBAs are already sorted by generated_at DESC
      }
      
      res.json({
        hasResults: true,
        session: latestSession,
        thoughts: sessionDetails.thoughts,
        actions: sessionDetails.actions,
        nba: latestNba,
      });
    } catch (error) {
      console.error("Failed to get NBA results:", error);
      res.status(500).json({ error: "Failed to retrieve NBA results" });
    }
  });

  // Get generated artifacts for an HCP
  app.get("/api/hcps/:id/artifacts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const artifacts = await storage.getArtifactsByHcp(id);
      
      res.json(artifacts);
    } catch (error) {
      console.error("Failed to get artifacts:", error);
      res.status(500).json({ error: "Failed to retrieve artifacts" });
    }
  });

  // Generate a single artifact based on NBA details
  app.post("/api/ai/generate-artifact", async (req, res) => {
    try {
      const { hcpId, hcpName, actionType, actionText, reason, synthesisRationale } = req.body;

      if (!hcpId || !actionType || !actionText) {
        return res.status(400).json({ error: "Missing required fields: hcpId, actionType, actionText" });
      }

      let content: any;
      let artifactType: string;

      // Generate appropriate artifact based on action type
      if (actionType === "call") {
        content = await generateCallScript(hcpName, actionText, reason, synthesisRationale);
        artifactType = "call_script";
      } else if (actionType === "email") {
        content = await generateEmailDraft(hcpName, actionText, reason, synthesisRationale);
        artifactType = "email_draft";
      } else if (actionType === "meeting") {
        content = await generateMeetingAgenda(hcpName, actionText, reason, synthesisRationale);
        artifactType = "meeting_agenda";
      } else {
        // Default to call script for other action types
        content = await generateCallScript(hcpName, actionText, reason, synthesisRationale);
        artifactType = "call_script";
      }

      // Save to database
      const artifact = await storage.createArtifact({
        hcpId,
        nbaId: null, // Not linked to a specific NBA record since we're generating on-demand
        artifactType,
        actionType,
        content,
      });

      res.json(artifact);
    } catch (error) {
      console.error("Failed to generate artifact:", error);
      res.status(500).json({ error: "Failed to generate artifact" });
    }
  });

  // Autonomous Agent - Generate NBAs for all high-risk HCPs with visible reasoning
  app.post("/api/ai/auto-generate-nbas", async (_req, res) => {
    try {
      const highRiskHcps = await storage.getHighRiskHcps(50);
      const sessions = [];

      for (const hcp of highRiskHcps.slice(0, 5)) {  // Limit to top 5 for demo
        // Create session FIRST and return its ID immediately
        const sessionId = await agentOrchestrator.createSession(
          `Generate optimal Next Best Action for HCP ${hcp.id} with full reasoning trace`,
          "nba_generation",
          { hcpId: hcp.id }
        );
        
        sessions.push({
          hcpId: hcp.id,
          sessionId,
          status: 'in_progress',
        });
        
        // Run orchestrator in background with pre-created session (don't await)
        agentOrchestrator.executeNBAGenerationLoop(hcp.id, sessionId).then(result => {
          console.log(`NBA generation completed for HCP ${hcp.id}, session ${sessionId}`);
        }).catch(error => {
          console.error(`Failed to generate NBA for HCP ${hcp.id}:`, error);
          // Mark session as failed
          storage.updateAgentSession(sessionId, { status: 'failed' }).catch(console.error);
        });
      }

      // Return immediately with session IDs so UI can connect to streams
      res.json({ 
        success: true, 
        generated: sessions.length,
        sessions,
        message: `Started ${sessions.length} AI-powered NBA generation sessions - live reasoning now streaming` 
      });
    } catch (error) {
      console.error("Auto NBA generation error:", error);
      res.status(500).json({ error: "Failed to start NBA generation" });
    }
  });

  // Test Azure OpenAI connection
  app.get("/api/test/azure-openai", async (_req, res) => {
    try {
      const { azureOpenAI, MODEL } = await import("./aiService");
      
      console.log("Testing Azure OpenAI with model:", MODEL);
      
      const response = await azureOpenAI.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello in JSON format with a greeting field." }
        ],
        max_completion_tokens: 100,
      });
      
      console.log("Full response object:", JSON.stringify(response, null, 2));
      console.log("Message content:", response.choices[0]?.message?.content);
      
      res.json({
        success: true,
        model: MODEL,
        content: response.choices[0]?.message?.content,
        fullResponse: response,
      });
    } catch (error: any) {
      console.error("Azure OpenAI test failed:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // Agent Session endpoints
  app.get("/api/agent/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getRecentAgentSessions(20);
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch agent sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get the latest IN-PROGRESS agent session (for polling)
  app.get("/api/agent/sessions/latest", async (_req, res) => {
    try {
      const sessions = await storage.getRecentAgentSessions(10);
      // Only return in-progress sessions, not completed ones
      const inProgressSession = sessions.find(s => s.status === 'in_progress');
      if (!inProgressSession) {
        res.status(404).json({ error: "No in-progress sessions found" });
        return;
      }
      res.json(inProgressSession);
    } catch (error) {
      console.error("Failed to fetch latest session:", error);
      res.status(500).json({ error: "Failed to fetch latest session" });
    }
  });

  app.get("/api/agent/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const details = await agentOrchestrator.getSessionDetails(sessionId);
      res.json(details);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
      res.status(500).json({ error: "Failed to fetch session details" });
    }
  });

  // ============================================================================
  // SIGNAL DETECTION ROUTES
  // ============================================================================

  // Trigger on-demand signal detection for a specific HCP
  app.post("/api/signals/detect/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      
      // Run all three agents in sequence
      await detectSignalsForHcp(hcpId);
      await discoverCorrelations();
      await generateRiskInsight(hcpId);
      
      // Retrieve the generated insights
      const signals = await storage.getDetectedSignals(hcpId);
      const insight = await storage.getLatestAiInsight(hcpId);
      
      res.json({
        success: true,
        signalsDetected: signals.length,
        insight,
      });
    } catch (error) {
      console.error("Signal detection failed:", error);
      res.status(500).json({ 
        error: "Failed to detect signals",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get all signals and insights for an HCP
  app.get("/api/signals/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      
      const signals = await storage.getDetectedSignals(hcpId);
      const insights = await storage.getAiInsights(hcpId);
      const latestInsight = await storage.getLatestAiInsight(hcpId);
      
      res.json({
        signals,
        insights,
        latestInsight,
      });
    } catch (error) {
      console.error("Failed to retrieve signals:", error);
      res.status(500).json({ error: "Failed to retrieve signals" });
    }
  });

  // Batch process signal detection for all high-risk HCPs
  app.post("/api/signals/batch", async (req, res) => {
    try {
      const { minRiskScore = 50 } = req.body;
      
      // Get high-risk HCPs
      const highRiskHcps = await storage.getHighRiskHcps(minRiskScore);
      
      // Process each HCP in sequence (in production, this would be a background job)
      const results = [];
      for (const hcp of highRiskHcps) {
        try {
          await detectSignalsForHcp(hcp.id);
          await generateRiskInsight(hcp.id);
          results.push({ hcpId: hcp.id, success: true });
        } catch (error) {
          console.error(`Failed to process HCP ${hcp.id}:`, error);
          results.push({ 
            hcpId: hcp.id, 
            success: false, 
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      // Run global correlation discovery once
      await discoverCorrelations();
      
      res.json({
        success: true,
        processed: results.length,
        results,
      });
    } catch (error) {
      console.error("Batch signal detection failed:", error);
      res.status(500).json({ 
        error: "Failed to run batch signal detection",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get all active signal correlations
  app.get("/api/signals/correlations", async (req, res) => {
    try {
      const correlations = await storage.getAllActiveCorrelations();
      res.json(correlations);
    } catch (error) {
      console.error("Failed to retrieve correlations:", error);
      res.status(500).json({ error: "Failed to retrieve correlations" });
    }
  });

  // Server-Sent Events stream for real-time reasoning
  app.get("/api/agent/stream/:sessionId", async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    // Create scoped handlers that only respond to this session
    const thoughtHandler = (data: any) => {
      if (data.sessionId === sessionId && !res.writableEnded) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'thought', ...data })}\n\n`);
        } catch (err) {
          cleanup();
        }
      }
    };

    const actionHandler = (data: any) => {
      if (data.sessionId === sessionId && !res.writableEnded) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'action', ...data })}\n\n`);
        } catch (err) {
          cleanup();
        }
      }
    };

    const phaseHandler = (data: any) => {
      if (data.sessionId === sessionId && !res.writableEnded) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'phase', ...data })}\n\n`);
        } catch (err) {
          cleanup();
        }
      }
    };

    const completedHandler = (data: any) => {
      if (data.sessionId === sessionId && !res.writableEnded) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'completed', ...data })}\n\n`);
        } catch (err) {
          // Ignore errors on completed
        } finally {
          cleanup();
        }
      }
    };

    // Centralized cleanup function
    const cleanup = () => {
      agentOrchestrator.removeListener('thought:created', thoughtHandler);
      agentOrchestrator.removeListener('action:executed', actionHandler);
      agentOrchestrator.removeListener('phase:changed', phaseHandler);
      agentOrchestrator.removeListener('session:completed', completedHandler);
      if (!res.writableEnded) {
        res.end();
      }
    };

    // Register listeners
    agentOrchestrator.on('thought:created', thoughtHandler);
    agentOrchestrator.on('action:executed', actionHandler);
    agentOrchestrator.on('phase:changed', phaseHandler);
    agentOrchestrator.on('session:completed', completedHandler);

    // Clean up on client disconnect or server error
    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
  });

  const httpServer = createServer(app);
  return httpServer;
}
