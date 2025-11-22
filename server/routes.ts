import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHcpSchema, insertNbaSchema, insertTerritoryPlanSchema, insertSwitchingAnalyticsSchema, insertPrescriptionHistorySchema } from "@shared/schema";
import { z } from "zod";
import { detectSwitchingPatterns, runSwitchingDetectionForAllHCPs } from "./switchingDetection";
import { generateIntelligentNBA, generateTerritoryPlanWithAI, processCopilotQuery } from "./aiService";

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

  // AI-Powered endpoints
  app.post("/api/ai/generate-nba/:hcpId", async (req, res) => {
    try {
      const hcpId = parseInt(req.params.hcpId);
      const hcp = await storage.getHcp(hcpId);
      if (!hcp) {
        return res.status(404).json({ error: "HCP not found" });
      }

      const history = await storage.getPrescriptionHistory(hcpId);
      const events = await storage.getSwitchingEventsByStatus("active");
      const switchingEvent = events.find(e => e.hcpId === hcpId);

      const aiNba = await generateIntelligentNBA(hcp, history, switchingEvent);

      // Optionally auto-create the NBA
      const createdNba = await storage.createNba({
        hcpId,
        action: aiNba.action,
        actionType: aiNba.actionType,
        priority: aiNba.priority,
        reason: aiNba.reason,
        aiInsight: aiNba.aiInsight,
        status: "pending",
      });

      res.json({ nba: createdNba, aiDetails: aiNba });
    } catch (error) {
      console.error("AI NBA generation error:", error);
      res.status(500).json({ error: "Failed to generate AI-powered NBA" });
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

  // Autonomous Agent - Generate NBAs for all high-risk HCPs
  app.post("/api/ai/auto-generate-nbas", async (_req, res) => {
    try {
      const highRiskHcps = await storage.getHighRiskHcps(50);
      const generated = [];

      for (const hcp of highRiskHcps.slice(0, 10)) {  // Limit to top 10 for performance
        const history = await storage.getPrescriptionHistory(hcp.id);
        const events = await storage.getSwitchingEventsByStatus("active");
        const switchingEvent = events.find(e => e.hcpId === hcp.id);

        try {
          const aiNba = await generateIntelligentNBA(hcp, history, switchingEvent);
          
          // Check if NBA already exists
          const existingNbas = await storage.getNbasByTerritory(hcp.territory);
          const hasRecentNba = existingNbas.some(n => 
            n.hcpId === hcp.id && 
            n.status === "pending" &&
            new Date(n.generatedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
          );

          if (!hasRecentNba) {
            const createdNba = await storage.createNba({
              hcpId: hcp.id,
              action: aiNba.action,
              actionType: aiNba.actionType,
              priority: aiNba.priority,
              reason: aiNba.reason,
              aiInsight: aiNba.aiInsight,
              status: "pending",
            });
            generated.push(createdNba);
          }
        } catch (error) {
          console.error(`Failed to generate NBA for HCP ${hcp.id}:`, error);
        }
      }

      res.json({ 
        success: true, 
        generated: generated.length,
        message: `Generated ${generated.length} AI-powered NBAs for high-risk HCPs` 
      });
    } catch (error) {
      console.error("Auto NBA generation error:", error);
      res.status(500).json({ error: "Failed to auto-generate NBAs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
