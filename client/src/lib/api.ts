import type { Hcp, Nba, TerritoryPlan, SwitchingAnalytics } from "@shared/schema";

const API_BASE = "";

export interface NbaWithHcp extends Nba {
  hcp: Hcp;
}

export interface Stats {
  activeHcps: number;
  switchingRisks: number;
  actionsCompleted: number;
  totalActions: number;
  agentAccuracy: number;
}

export async function fetchNbas(): Promise<NbaWithHcp[]> {
  const response = await fetch(`${API_BASE}/api/nbas`);
  if (!response.ok) throw new Error("Failed to fetch NBAs");
  return response.json();
}

export async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE}/api/stats`);
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function fetchLatestAnalytics(): Promise<SwitchingAnalytics | null> {
  const response = await fetch(`${API_BASE}/api/analytics/latest`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}

export async function fetchTerritoryPlan(territory: string): Promise<TerritoryPlan | null> {
  const response = await fetch(`${API_BASE}/api/territory-plans/${encodeURIComponent(territory)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch territory plan");
  return response.json();
}

export async function updateNbaStatus(id: number, status: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/nbas/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update NBA status");
}
