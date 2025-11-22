import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHcpSchema, insertNbaSchema, insertTerritoryPlanSchema, insertSwitchingAnalyticsSchema } from "@shared/schema";
import { z } from "zod";

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
      
      const stats = {
        activeHcps: hcps.length,
        switchingRisks: nbas.filter(n => n.priority === "High" && n.status === "pending").length,
        actionsCompleted: nbas.filter(n => n.status === "completed").length,
        totalActions: nbas.length,
        agentAccuracy: 94.2, // Simulated metric
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
