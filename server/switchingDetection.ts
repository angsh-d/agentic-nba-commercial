import { db } from "../drizzle/db";
import { hcps, prescriptionHistory, switchingEvents } from "@shared/schema";
import type { RiskScoreFactor } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { analyzeSwitchingWithAI } from "./aiService";

export interface SwitchingDetectionResult {
  hcpId: number;
  riskScore: number;
  riskTier: "low" | "medium" | "high" | "critical";
  riskReasons: string[];
  riskScoreBreakdown: RiskScoreFactor[];
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
      riskScoreBreakdown: [],
      switchDetected: false,
    };
  }

  const riskFactors: string[] = [];
  const breakdown: RiskScoreFactor[] = [];
  let riskScore = 0;

  // Group by product and calculate trends
  const ourProductHistory = history.filter(h => h.isOurProduct === 1);
  const competitorHistory = history.filter(h => h.isOurProduct === 0);

  // Factor 1: Declining our product prescriptions (0-40 points)
  let factor1Points = 0;
  let factor1Evidence = "";
  if (ourProductHistory.length >= 2) {
    const recent = ourProductHistory[0].prescriptionCount;
    const previous = ourProductHistory[1].prescriptionCount;
    
    if (previous > 0) {
      const decline = ((previous - recent) / previous) * 100;

      if (decline > 50) {
        factor1Points = 40;
        factor1Evidence = `Severe decline (-${decline.toFixed(0)}%)`;
        riskFactors.push(`Severe decline in prescriptions (-${decline.toFixed(0)}%)`);
      } else if (decline > 30) {
        factor1Points = 30;
        factor1Evidence = `Significant decline (-${decline.toFixed(0)}%)`;
        riskFactors.push(`Significant decline in prescriptions (-${decline.toFixed(0)}%)`);
      } else if (decline > 15) {
        factor1Points = 20;
        factor1Evidence = `Moderate decline (-${decline.toFixed(0)}%)`;
        riskFactors.push(`Moderate decline in prescriptions (-${decline.toFixed(0)}%)`);
      }
    } else if (recent > 0) {
      // New prescriptions starting from zero
      factor1Evidence = `New prescribing activity (${recent} RX)`;
    } else {
      factor1Evidence = "No prescription activity";
    }
  }
  if (factor1Points > 0 || ourProductHistory.length >= 2) {
    breakdown.push({
      factorKey: "declining_prescriptions",
      label: "Declining Onco-Pro Prescriptions",
      points: factor1Points,
      evidence: factor1Evidence || "No significant decline",
      maxPoints: 40
    });
  }
  riskScore += factor1Points;

  // Factor 2: Rising competitor prescriptions (0-35 points)
  let factor2Points = 0;
  let factor2Evidence = "";
  if (competitorHistory.length >= 2) {
    const recent = competitorHistory[0].prescriptionCount;
    const previous = competitorHistory[1].prescriptionCount;
    
    if (previous > 0) {
      const increase = ((recent - previous) / previous) * 100;

      if (increase > 50) {
        factor2Points = 35;
        factor2Evidence = `Sharp increase (+${increase.toFixed(0)}%)`;
        riskFactors.push(`Sharp increase in competitor usage (+${increase.toFixed(0)}%)`);
      } else if (increase > 30) {
        factor2Points = 25;
        factor2Evidence = `Growing adoption (+${increase.toFixed(0)}%)`;
        riskFactors.push(`Growing competitor adoption (+${increase.toFixed(0)}%)`);
      } else if (increase > 15) {
        factor2Points = 15;
        factor2Evidence = `Gaining share (+${increase.toFixed(0)}%)`;
        riskFactors.push(`Competitor gaining share (+${increase.toFixed(0)}%)`);
      }
    } else if (recent > 0) {
      // New competitor adoption
      factor2Points = 30;
      factor2Evidence = `New competitor adoption (${recent} RX)`;
      riskFactors.push(`New competitor product adoption (${recent} RX)`);
    } else {
      factor2Evidence = "No competitor activity";
    }
  }
  if (factor2Points > 0 || competitorHistory.length >= 2) {
    breakdown.push({
      factorKey: "rising_competitor",
      label: "Rising Competitor Prescriptions",
      points: factor2Points,
      evidence: factor2Evidence || "No significant increase",
      maxPoints: 35
    });
  }
  riskScore += factor2Points;

  // Factor 3: Market share shift (0-25 points)
  const totalRecent = ourProductHistory[0]?.prescriptionCount || 0;
  const competitorRecent = competitorHistory[0]?.prescriptionCount || 0;
  const totalPrescriptions = totalRecent + competitorRecent;
  let factor3Points = 0;
  let factor3Evidence = "";

  if (totalPrescriptions > 0) {
    const ourShare = totalRecent / totalPrescriptions;

    if (ourShare < 0.3) {
      factor3Points = 25;
      factor3Evidence = `Low market share (${(ourShare * 100).toFixed(0)}%)`;
      riskFactors.push(`Low market share with HCP (${(ourShare * 100).toFixed(0)}%)`);
    } else if (ourShare < 0.5) {
      factor3Points = 15;
      factor3Evidence = `Below parity (${(ourShare * 100).toFixed(0)}%)`;
      riskFactors.push(`Below parity market share (${(ourShare * 100).toFixed(0)}%)`);
    } else {
      factor3Evidence = `Current share: ${(ourShare * 100).toFixed(0)}%`;
    }

    breakdown.push({
      factorKey: "market_share",
      label: "Market Share Position",
      points: factor3Points,
      evidence: factor3Evidence,
      maxPoints: 25
    });
  } else {
    // No prescription activity at all
    breakdown.push({
      factorKey: "market_share",
      label: "Market Share Position",
      points: 0,
      evidence: "No prescription activity to analyze",
      maxPoints: 25
    });
  }
  riskScore += factor3Points;

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
    const previousCount = ourProductHistory[1].prescriptionCount;
    
    if (previousCount > 0) {
      const recentDecline = ((previousCount - ourProductHistory[0].prescriptionCount) / previousCount) * 100;
      
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
  }

  return {
    hcpId,
    riskScore,
    riskTier,
    riskReasons: riskFactors.length > 0 ? riskFactors : ["No significant risk factors detected"],
    riskScoreBreakdown: breakdown,
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
        riskScoreBreakdown: detection.riskScoreBreakdown,
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
        // Get AI-powered analysis
        const history = await db
          .select()
          .from(prescriptionHistory)
          .where(eq(prescriptionHistory.hcpId, hcp.id))
          .orderBy(desc(prescriptionHistory.month));

        let aiAnalysisText = generateAIAnalysis(hcp.name, detection);
        let aiRootCauses = detection.riskReasons;

        try {
          const aiAnalysis = await analyzeSwitchingWithAI(
            hcp,
            detection.switchDetails.fromProduct,
            detection.switchDetails.toProduct,
            history
          );
          aiAnalysisText = aiAnalysis.analysis;
          aiRootCauses = aiAnalysis.rootCauses;
        } catch (error) {
          console.error("AI analysis failed, using fallback:", error);
        }

        await db.insert(switchingEvents).values({
          hcpId: hcp.id,
          fromProduct: detection.switchDetails.fromProduct,
          toProduct: detection.switchDetails.toProduct,
          confidenceScore: detection.switchDetails.confidenceScore,
          switchType: detection.switchDetails.switchType,
          impactLevel: detection.switchDetails.impactLevel,
          rootCauses: aiRootCauses,
          aiAnalysis: aiAnalysisText,
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
