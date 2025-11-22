import { storage } from "./storage";
import { runSwitchingDetectionForAllHCPs } from "./switchingDetection";

export async function seedDatabase() {
  try {
    // Seed HCPs
    const drSmith = await storage.createHcp({
      name: "Dr. Sarah Smith",
      specialty: "Oncologist",
      hospital: "Memorial Sloan Kettering",
      territory: "North Manhattan",
      lastVisitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      engagementLevel: "high",
    });

    const drWilson = await storage.createHcp({
      name: "Dr. James Wilson",
      specialty: "Hematologist",
      hospital: "Mount Sinai",
      territory: "North Manhattan",
      lastVisitDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
      engagementLevel: "medium",
    });

    const drChen = await storage.createHcp({
      name: "Dr. Emily Chen",
      specialty: "Oncologist",
      hospital: "NY Presbyterian",
      territory: "North Manhattan",
      lastVisitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      engagementLevel: "high",
    });

    // Seed Next Best Actions
    await storage.createNba({
      hcpId: drSmith.id,
      action: "Schedule Clinical Review",
      actionType: "meeting",
      priority: "High",
      reason: "Increased use of Competitor X in renal cell carcinoma since Q2.",
      aiInsight: "Dr. Smith's switch likely correlates with new efficacy data for younger patients released last month. Suggest highlighting our Phase 3 long-term survival data.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drWilson.id,
      action: "Send Email: Dosing Guidelines",
      actionType: "email",
      priority: "Medium",
      reason: "Recent drop in prescriptions for 2nd line therapy.",
      aiInsight: "Pattern analysis suggests potential confusion regarding the new dosing protocol. A clarification email with the simplified dosing chart has a 85% predicted success rate.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drChen.id,
      action: "Invite to Symposium",
      actionType: "event",
      priority: "Low",
      reason: "High engagement with recent webinar content.",
      aiInsight: "Dr. Chen is showing high interest in immunotherapy combinations. The upcoming symposium aligns perfectly with her recent research publications.",
      status: "pending",
    });

    // Seed Territory Plan
    await storage.createTerritoryPlan({
      territory: "North Manhattan",
      planDate: new Date(),
      agentReasoning: "Analyzed 1,248 HCP profiles. Prioritized 3 interactions to maximize territory coverage and address immediate switch risks in North Manhattan.",
      status: "active",
      steps: [
        {
          time: "09:00 AM",
          type: "visit",
          title: "Visit Dr. Sarah Smith",
          hcpId: drSmith.id,
          location: "Memorial Sloan Kettering",
          priority: "High",
          reasoning: "Switch risk detected. Competitor X gaining share in RCC.",
          action: "Review Phase 3 Survival Data",
          status: "pending",
        },
        {
          time: "11:30 AM",
          type: "email",
          title: "Outreach to Dr. James Wilson",
          hcpId: drWilson.id,
          location: "Digital / Remote",
          priority: "Medium",
          reasoning: "Low engagement with recent dosing update.",
          action: "Send 'Simplified Dosing' Draft",
          status: "ready",
        },
        {
          time: "01:00 PM",
          type: "meeting",
          title: "Lunch: Dr. Emily Chen",
          hcpId: drChen.id,
          location: "The Modern, NYC",
          priority: "High",
          reasoning: "Key Opinion Leader (KOL) development.",
          action: "Discuss Immunotherapy Symposium",
          status: "confirmed",
        },
      ],
    });

    // Seed Analytics
    await storage.createAnalytics({
      period: "Q3 2024",
      clinicalEfficacy: 45,
      patientAccess: 30,
      sideEffects: 15,
      competitorPricing: 10,
    });

    // Seed Prescription History for switching detection
    // Dr. Smith - showing declining pattern (high risk)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 45,
      month: "2024-07",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 32,
      month: "2024-08",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 18,
      month: "2024-09",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      productName: "Competitor-X",
      productCategory: "Immunotherapy",
      prescriptionCount: 12,
      month: "2024-08",
      isOurProduct: 0,
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      productName: "Competitor-X",
      productCategory: "Immunotherapy",
      prescriptionCount: 28,
      month: "2024-09",
      isOurProduct: 0,
    });

    // Dr. Wilson - stable pattern (medium risk)
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 25,
      month: "2024-07",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 22,
      month: "2024-08",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 20,
      month: "2024-09",
      isOurProduct: 1,
    });

    // Dr. Chen - growing pattern (low risk)
    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 30,
      month: "2024-07",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 35,
      month: "2024-08",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 42,
      month: "2024-09",
      isOurProduct: 1,
    });

    console.log("✅ Database seeded with HCPs, NBAs, plans, and prescription history");

    // Run switching detection
    console.log("🔍 Running switching detection analysis...");
    await runSwitchingDetectionForAllHCPs();
    
    console.log("✅ Database seeded successfully with switching detection complete");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
