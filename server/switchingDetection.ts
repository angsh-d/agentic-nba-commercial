import { db } from "../drizzle/db";
import { hcps, prescriptionHistory, switchingEvents } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface SwitchingDetectionResult {
  hcpId: number;
  riskScore: number;
  riskTier: "low" | "medium" | "high" | "critical";
  riskReasons: string[];
  switchDetected: boolean;
  switchDetails?: {
    fromProduct: string;
    toProduct: string;
    confidenceScore: number;
    switchType: "gradual" | "sudden" | "complete";
    impactLevel: "low" | "medium" | "high" | "critical";
  };
}

/**
 * Analyzes prescription patterns to detect switching behavior
 * Returns risk score (0-100) and detailed analysis
 */
export async function detectSwitchingPatterns(hcpId: number): Promise<SwitchingDetectionResult> {
  // Get prescription history for the past 6 months
  const history = await db
    .select()
    .from(prescriptionHistory)
    .where(eq(prescriptionHistory.hcpId, hcpId))
    .orderBy(desc(prescriptionHistory.month));

  if (history.length === 0) {
    return {
      hcpId,
      riskScore: 0,
      riskTier: "low",
      riskReasons: ["Insufficient data"],
      switchDetected: false,
    };
  }

  const riskFactors: string[] = [];
  let riskScore = 0;

  // Group by product and calculate trends
  const ourProductHistory = history.filter(h => h.isOurProduct === 1);
  const competitorHistory = history.filter(h => h.isOurProduct === 0);

  // Factor 1: Declining our product prescriptions (0-40 points)
  if (ourProductHistory.length >= 2) {
    const recent = ourProductHistory[0].prescriptionCount;
    const previous = ourProductHistory[1].prescriptionCount;
    const decline = ((previous - recent) / previous) * 100;

    if (decline > 50) {
      riskScore += 40;
      riskFactors.push(`Severe decline in prescriptions (-${decline.toFixed(0)}%)`);
    } else if (decline > 30) {
      riskScore += 30;
      riskFactors.push(`Significant decline in prescriptions (-${decline.toFixed(0)}%)`);
    } else if (decline > 15) {
      riskScore += 20;
      riskFactors.push(`Moderate decline in prescriptions (-${decline.toFixed(0)}%)`);
    }
  }

  // Factor 2: Rising competitor prescriptions (0-35 points)
  if (competitorHistory.length >= 2) {
    const recent = competitorHistory[0].prescriptionCount;
    const previous = competitorHistory[1].prescriptionCount;
    const increase = ((recent - previous) / previous) * 100;

    if (increase > 50) {
      riskScore += 35;
      riskFactors.push(`Sharp increase in competitor usage (+${increase.toFixed(0)}%)`);
    } else if (increase > 30) {
      riskScore += 25;
      riskFactors.push(`Growing competitor adoption (+${increase.toFixed(0)}%)`);
    } else if (increase > 15) {
      riskScore += 15;
      riskFactors.push(`Competitor gaining share (+${increase.toFixed(0)}%)`);
    }
  }

  // Factor 3: Market share shift (0-25 points)
  const totalRecent = ourProductHistory[0]?.prescriptionCount || 0;
  const competitorRecent = competitorHistory[0]?.prescriptionCount || 0;
  const ourShare = totalRecent / (totalRecent + competitorRecent);

  if (ourShare < 0.3) {
    riskScore += 25;
    riskFactors.push(`Low market share with HCP (${(ourShare * 100).toFixed(0)}%)`);
  } else if (ourShare < 0.5) {
    riskScore += 15;
    riskFactors.push(`Below parity market share (${(ourShare * 100).toFixed(0)}%)`);
  }

  // Determine risk tier
  let riskTier: "low" | "medium" | "high" | "critical";
  if (riskScore >= 75) riskTier = "critical";
  else if (riskScore >= 50) riskTier = "high";
  else if (riskScore >= 25) riskTier = "medium";
  else riskTier = "low";

  // Detect actual switching event
  let switchDetected = false;
  let switchDetails;

  if (riskScore >= 50 && ourProductHistory.length >= 2 && competitorHistory.length >= 1) {
    const recentDecline = ((ourProductHistory[1].prescriptionCount - ourProductHistory[0].prescriptionCount) / ourProductHistory[1].prescriptionCount) * 100;
    
    if (recentDecline > 40) {
      switchDetected = true;
      
      // Determine switch type
      let switchType: "gradual" | "sudden" | "complete";
      if (ourProductHistory[0].prescriptionCount === 0) switchType = "complete";
      else if (recentDecline > 70) switchType = "sudden";
      else switchType = "gradual";

      switchDetails = {
        fromProduct: ourProductHistory[0].productName,
        toProduct: competitorHistory[0]?.productName || "Competitor Product",
        confidenceScore: Math.min(95, riskScore + 10),
        switchType,
        impactLevel: riskTier as "low" | "medium" | "high" | "critical",
      };
    }
  }

  return {
    hcpId,
    riskScore,
    riskTier,
    riskReasons: riskFactors.length > 0 ? riskFactors : ["No significant risk factors detected"],
    switchDetected,
    switchDetails,
  };
}

/**
 * Analyzes all HCPs and updates their risk scores
 */
export async function runSwitchingDetectionForAllHCPs(): Promise<void> {
  const allHcps = await db.select().from(hcps);

  for (const hcp of allHcps) {
    const detection = await detectSwitchingPatterns(hcp.id);

    // Update HCP risk score
    await db
      .update(hcps)
      .set({
        switchRiskScore: detection.riskScore,
        switchRiskTier: detection.riskTier,
        switchRiskReasons: detection.riskReasons,
        lastRiskUpdate: new Date(),
      })
      .where(eq(hcps.id, hcp.id));

    // Create switching event if detected
    if (detection.switchDetected && detection.switchDetails) {
      const existingEvent = await db
        .select()
        .from(switchingEvents)
        .where(
          and(
            eq(switchingEvents.hcpId, hcp.id),
            eq(switchingEvents.status, "active")
          )
        )
        .limit(1);

      if (existingEvent.length === 0) {
        await db.insert(switchingEvents).values({
          hcpId: hcp.id,
          fromProduct: detection.switchDetails.fromProduct,
          toProduct: detection.switchDetails.toProduct,
          confidenceScore: detection.switchDetails.confidenceScore,
          switchType: detection.switchDetails.switchType,
          impactLevel: detection.switchDetails.impactLevel,
          rootCauses: detection.riskReasons,
          aiAnalysis: generateAIAnalysis(hcp.name, detection),
          status: "active",
        });
      }
    }
  }

  console.log(`✅ Switching detection completed for ${allHcps.length} HCPs`);
}

/**
 * Generates AI-powered analysis for switching events
 */
function generateAIAnalysis(hcpName: string, detection: SwitchingDetectionResult): string {
  const { riskScore, riskReasons, switchDetails } = detection;

  if (!switchDetails) {
    return `Analysis for ${hcpName}: Risk score of ${riskScore}/100. ${riskReasons.join(". ")}. Recommend proactive engagement to prevent potential switching.`;
  }

  const urgency = riskScore >= 75 ? "URGENT" : riskScore >= 50 ? "HIGH PRIORITY" : "MODERATE";
  
  return `${urgency}: ${hcpName} has switched from ${switchDetails.fromProduct} to ${switchDetails.toProduct} (${switchDetails.switchType} switch, ${switchDetails.confidenceScore}% confidence). Root causes: ${riskReasons.join("; ")}. Immediate action recommended to understand switch drivers and present counter-evidence.`;
}

/**
 * Gets high-risk HCPs requiring immediate attention
 */
export async function getHighRiskHCPs(territory?: string) {
  let query = db
    .select()
    .from(hcps)
    .where(
      sql`${hcps.switchRiskScore} >= 50`
    )
    .orderBy(desc(hcps.switchRiskScore));

  if (territory) {
    query = query.where(eq(hcps.territory, territory)) as any;
  }

  return await query;
}
