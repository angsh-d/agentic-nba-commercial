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
      lastVisitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      engagementLevel: "high",
    });

    const drWilson = await storage.createHcp({
      name: "Dr. James Wilson",
      specialty: "Hematologist",
      hospital: "Mount Sinai",
      territory: "North Manhattan",
      lastVisitDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      engagementLevel: "medium",
    });

    const drChen = await storage.createHcp({
      name: "Dr. Emily Chen",
      specialty: "Oncologist",
      hospital: "NY Presbyterian",
      territory: "North Manhattan",
      lastVisitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      engagementLevel: "high",
    });

    console.log("✅ HCPs seeded");

    // === DR. SARAH SMITH: LAYERED TWO-COHORT SWITCHING SCENARIO ===
    
    // COHORT A: Young RCC Patients (<55) - Switched Post-ASCO
    const p001 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P001",
      age: 48,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "young_rcc",
      switchedDate: new Date("2025-07-03"),
      switchedToDrug: "Onco-Rival",
    });

    const p002 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P002",
      age: 52,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "young_rcc",
      switchedDate: new Date("2025-07-10"),
      switchedToDrug: "Onco-Rival",
    });

    const p003 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P003",
      age: 46,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "young_rcc",
      switchedDate: new Date("2025-07-15"),
      switchedToDrug: "Onco-Rival",
    });

    const p004 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P004",
      age: 54,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage IV",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "young_rcc",
      switchedDate: new Date("2025-07-22"),
      switchedToDrug: "Onco-Rival",
    });

    const p005 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P005",
      age: 49,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "young_rcc",
      switchedDate: new Date("2025-08-01"),
      switchedToDrug: "Onco-Rival",
    });

    // COHORT B: CV-Risk Patients - Switched Post-Adverse Events
    const p006 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P006",
      age: 67,
      cancerType: "Non-Small Cell Lung Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["Prior MI", "Hypertension"],
      currentDrug: "Onco-Rival",
      cohort: "cv_risk",
      switchedDate: new Date("2025-09-05"),
      switchedToDrug: "Onco-Rival",
    });

    const p007 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P007",
      age: 72,
      cancerType: "Pancreatic Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["CHF", "Arrhythmia"],
      currentDrug: "Onco-Rival",
      cohort: "cv_risk",
      switchedDate: new Date("2025-09-08"),
      switchedToDrug: "Onco-Rival",
    });

    const p008 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P008",
      age: 59,
      cancerType: "Colorectal Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["Diabetes", "CAD"],
      currentDrug: "Onco-Rival",
      cohort: "cv_risk",
      switchedDate: new Date("2025-09-12"),
      switchedToDrug: "Onco-Rival",
    });

    const p009 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P009",
      age: 64,
      cancerType: "Breast Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["Prior Stroke", "Hypertension"],
      currentDrug: "Onco-Rival",
      cohort: "cv_risk",
      switchedDate: new Date("2025-09-20"),
      switchedToDrug: "Onco-Rival",
    });

    // COHORT C: Stable Patients - Remained on Onco-Pro
    const p010 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P010",
      age: 61,
      cancerType: "Prostate Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "stable",
      switchedDate: null,
      switchedToDrug: null,
    });

    const p011 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P011",
      age: 58,
      cancerType: "Ovarian Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "stable",
      switchedDate: null,
      switchedToDrug: null,
    });

    const p012 = await storage.createPatient({
      hcpId: drSmith.id,
      patientCode: "P012",
      age: 63,
      cancerType: "Bladder Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "stable",
      switchedDate: null,
      switchedToDrug: null,
    });

    console.log("✅ Patient cohorts created (12 patients across 3 cohorts)");

    // === CLINICAL EVENTS: The Causative Factors ===

    // Event 1: ASCO 2025 Conference Attendance
    await storage.createClinicalEvent({
      hcpId: drSmith.id,
      patientId: null,
      eventType: "conference",
      eventTitle: "ASCO 2025 - ORION-Y Trial Results",
      eventDescription: "Phase III trial presented showing 40% improvement in progression-free survival for RCC patients under 55 years (HR: 0.60, p<0.001). Dr. Smith attended plenary session virtually and downloaded presentation materials.",
      eventDate: new Date("2025-06-15"),
      impact: "high",
      relatedDrug: "Onco-Rival",
      metadata: {
        trialName: "ORION-Y Study",
        hazardRatio: 0.60,
        pValue: "<0.001",
        patientPopulation: "RCC <55 years",
        attendanceType: "Virtual",
        sessionType: "Plenary",
      },
    });

    // Event 2-4: Cardiac Adverse Events Cluster (August 2025)
    await storage.createClinicalEvent({
      hcpId: drSmith.id,
      patientId: p006.id,
      eventType: "adverse_event",
      eventTitle: "Grade 3 QT Prolongation",
      eventDescription: "Patient P006 (67-year-old with prior MI) developed Grade 3 QT prolongation while on Onco-Pro. Hospitalized for cardiac monitoring, treatment paused.",
      eventDate: new Date("2025-08-10"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        grade: 3,
        eventType: "QT Prolongation",
        outcome: "Hospitalization",
        patientAge: 67,
        priorConditions: ["Prior MI", "Hypertension"],
      },
    });

    await storage.createClinicalEvent({
      hcpId: drSmith.id,
      patientId: p007.id,
      eventType: "adverse_event",
      eventTitle: "Cardiac Arrhythmia",
      eventDescription: "Patient P007 (72-year-old with CHF history) developed arrhythmia on Onco-Pro. Required emergency intervention and drug discontinuation.",
      eventDate: new Date("2025-08-22"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        grade: 3,
        eventType: "Arrhythmia",
        outcome: "Emergency Intervention",
        patientAge: 72,
        priorConditions: ["CHF", "Arrhythmia"],
      },
    });

    await storage.createClinicalEvent({
      hcpId: drSmith.id,
      patientId: p008.id,
      eventType: "adverse_event",
      eventTitle: "Chest Pain Episode",
      eventDescription: "Patient P008 (59-year-old diabetic with CAD) experienced chest pain while on Onco-Pro. Cardiac workup showed stress-induced ischemia.",
      eventDate: new Date("2025-08-28"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        grade: 2,
        eventType: "Chest Pain / Ischemia",
        outcome: "Drug Re-evaluation",
        patientAge: 59,
        priorConditions: ["Diabetes", "CAD"],
      },
    });

    // Event 5: Safety Webinar Access
    await storage.createClinicalEvent({
      hcpId: drSmith.id,
      patientId: null,
      eventType: "webinar",
      eventTitle: "Managing Cardiac Risk in Oncology Therapy",
      eventDescription: "Dr. Smith attended webinar on cardiac safety in oncology. Onco-Rival positioned as having favorable cardiac safety profile with lower QT prolongation risk.",
      eventDate: new Date("2025-08-30"),
      impact: "medium",
      relatedDrug: "Onco-Rival",
      metadata: {
        topic: "Cardiac Safety",
        duration: "60 minutes",
        keyTakeaway: "Lower cardiac burden with Onco-Rival",
      },
    });

    console.log("✅ Clinical events created (ASCO + 3 cardiac AEs + safety webinar)");

    // === PRESCRIPTION HISTORY: Month-by-Month Timeline ===
    
    // May 2025 - Baseline (All patients on Onco-Pro)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 45,
      month: "2025-05",
      isOurProduct: 1,
      cohort: "all",
    });

    // June 2025 - Still stable (ASCO happens mid-month)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 43,
      month: "2025-06",
      isOurProduct: 1,
      cohort: "all",
    });

    // July 2025 - Cohort A starts switching (5 young RCC patients switch)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 38,
      month: "2025-07",
      isOurProduct: 1,
      cohort: "stable_cv_risk",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 5,
      month: "2025-07",
      isOurProduct: 0,
      cohort: "young_rcc",
    });

    // August 2025 - Cohort A fully switched, Cohort B still on Onco-Pro (AEs happening)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 36,
      month: "2025-08",
      isOurProduct: 1,
      cohort: "stable_cv_risk",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 7,
      month: "2025-08",
      isOurProduct: 0,
      cohort: "young_rcc",
    });

    // September 2025 - Cohort B switches (4 CV-risk patients switch post-AE cluster)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 28,
      month: "2025-09",
      isOurProduct: 1,
      cohort: "stable",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 13,
      month: "2025-09",
      isOurProduct: 0,
      cohort: "young_rcc_cv_risk",
    });

    // October 2025 - New equilibrium (only stable cohort remains)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 25,
      month: "2025-10",
      isOurProduct: 1,
      cohort: "stable",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 15,
      month: "2025-10",
      isOurProduct: 0,
      cohort: "young_rcc_cv_risk",
    });

    console.log("✅ Prescription history created (layered switching timeline)");

    // Seed NBAs
    await storage.createNba({
      hcpId: drSmith.id,
      action: "Schedule Clinical Review with Cardiac Safety Data",
      actionType: "meeting",
      priority: "High",
      reason: "Two-cohort switching pattern detected: young RCC patients post-ASCO and CV-risk patients post-adverse events.",
      aiInsight: "Dr. Smith's switching behavior is highly evidence-driven, responding to both clinical trial data and safety signals. Bring subgroup analysis for younger patients and cardiac monitoring protocols.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drWilson.id,
      action: "Send Email: Dosing Guidelines",
      actionType: "email",
      priority: "Medium",
      reason: "Recent drop in prescriptions for 2nd line therapy.",
      aiInsight: "Pattern analysis suggests potential confusion regarding the new dosing protocol.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drChen.id,
      action: "Invite to Symposium",
      actionType: "event",
      priority: "Low",
      reason: "High engagement with recent webinar content.",
      aiInsight: "Dr. Chen is showing high interest in immunotherapy combinations.",
      status: "pending",
    });

    // Seed Territory Plan
    await storage.createTerritoryPlan({
      territory: "North Manhattan",
      planDate: new Date(),
      agentReasoning: "Prioritized Dr. Smith visit due to critical two-cohort switching pattern requiring immediate intervention with tailored clinical evidence.",
      status: "active",
      steps: [
        {
          time: "09:00 AM",
          type: "visit",
          title: "Visit Dr. Sarah Smith",
          hcpId: drSmith.id,
          location: "Memorial Sloan Kettering",
          priority: "High",
          reasoning: "Two distinct switching cohorts identified: ASCO-driven (young RCC) and safety-driven (CV-risk). Critical intervention opportunity.",
          action: "Present Subgroup Analysis + Cardiac Safety Toolkit",
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

    // Other HCPs - simpler prescription patterns
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 25,
      month: "2025-08",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 22,
      month: "2025-09",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drWilson.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Targeted Therapy",
      prescriptionCount: 20,
      month: "2025-10",
      isOurProduct: 1,
    });

    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 35,
      month: "2025-08",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 38,
      month: "2025-09",
      isOurProduct: 1,
    });
    await storage.createPrescriptionHistory({
      hcpId: drChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 42,
      month: "2025-10",
      isOurProduct: 1,
    });

    console.log("✅ Database seeded with layered scenario data");

    // Run switching detection
    console.log("🔍 Running switching detection analysis...");
    await runSwitchingDetectionForAllHCPs();
    
    console.log("✅ Database seeded successfully with rich multi-cohort scenario");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
