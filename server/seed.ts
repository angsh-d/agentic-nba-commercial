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

    const drMichaelChen = await storage.createHcp({
      name: "Dr. Michael Chen",
      specialty: "Oncologist",
      hospital: "Dana-Farber Cancer Institute",
      territory: "Boston Metro",
      lastVisitDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
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
      prescriptionCount: 35,
      month: "2025-09",
      isOurProduct: 1,
      cohort: "stable",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 8,
      month: "2025-09",
      isOurProduct: 0,
      cohort: "young_rcc_cv_risk",
    });

    // October 2025 - CRITICAL: Severe switching event (71% decline, 275% competitor increase, 25% market share)
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 10,
      month: "2025-10",
      isOurProduct: 1,
      cohort: "stable",
    });
    await storage.createPrescriptionHistory({
      hcpId: drSmith.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 30,
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

    console.log("✅ Database seeded with layered scenario data");

    // Run switching detection
    console.log("🔍 Running switching detection analysis...");
    await runSwitchingDetectionForAllHCPs();

    // Seed Signal Detection Data
    console.log("🤖 Seeding AI signal detection data...");
    
    // Dr. Sarah Smith - Dual causal switching with high risk
    await storage.createDetectedSignal({
      hcpId: drSmith.id,
      signalType: "rx_decline",
      signalStrength: 85,
      signalSource: "prescription_history",
      signalDescription: "Onco-Pro prescriptions declined 70% over 3 months",
      contextData: {
        metric: "Onco-Pro prescriptions declined 70% (Aug: 28 → Oct: 8)",
        timeframe: "3 months",
        baseline: 28,
        current: 8
      }
    });

    await storage.createDetectedSignal({
      hcpId: drSmith.id,
      signalType: "event_attendance",
      signalStrength: 75,
      signalSource: "clinical_events",
      signalDescription: "ASCO ORION-Y trial attendance correlated with patient switches",
      contextData: {
        event: "ASCO 2025 - ORION-Y Trial Presentation",
        date: "2025-06-15",
        correlation: "5 patients switched to Onco-Rival within 3 weeks post-event"
      }
    });

    await storage.createDetectedSignal({
      hcpId: drSmith.id,
      signalType: "adverse_event_cluster",
      signalStrength: 90,
      signalSource: "clinical_events",
      signalDescription: "Cluster of cardiac adverse events in CV risk patients",
      contextData: {
        aeType: "Cardiac adverse events",
        count: 4,
        timeframe: "Aug-Sep 2025",
        patients: ["P004", "P005", "P006", "P007"]
      }
    });

    await storage.createAiInsight({
      hcpId: drSmith.id,
      insightType: "risk_narrative",
      confidenceScore: 92,
      narrative: `Dual Switching Drivers Detected\n\nDr. Smith's prescribing behavior shows two distinct causal pathways:\n\n**Efficacy Concerns (Young RCC Cohort)**: Following the ASCO ORION-Y trial presentation (June 15), 5 young RCC patients (<55 years) switched from Onco-Pro to Onco-Rival within 3 weeks. The trial showed superior progression-free survival for Onco-Rival in this demographic.\n\n**Safety Concerns (CV Risk Cohort)**: Between August-September, 4 patients with cardiovascular risk factors experienced cardiac adverse events while on Onco-Pro. Dr. Smith proactively switched these patients to alternatives to mitigate safety risks.\n\n**Impact**: Onco-Pro prescriptions declined 70% (Aug: 28 → Oct: 8) while Onco-Rival prescriptions increased 180% (Aug: 10 → Oct: 28).`,
      expiresAt: new Date("2025-10-22")
    });

    // Dr. Wilson - Moderate risk with peer influence
    await storage.createDetectedSignal({
      hcpId: drWilson.id,
      signalType: "rx_decline",
      signalStrength: 60,
      signalSource: "prescription_history",
      signalDescription: "Onco-Pro prescriptions declined 35% over 3 months",
      contextData: {
        metric: "Onco-Pro prescriptions declined 35% (Jul: 20 → Oct: 13)",
        timeframe: "3 months",
        baseline: 20,
        current: 13
      }
    });

    await storage.createDetectedSignal({
      hcpId: drWilson.id,
      signalType: "peer_influence",
      signalStrength: 55,
      signalSource: "peer_network",
      signalDescription: "Territory-wide KOL switching pattern detected",
      contextData: {
        peers: ["Dr. Sarah Smith", "Dr. Robert Chang"],
        territory: "North Manhattan",
        observation: "Multiple KOLs in territory showing similar switching patterns"
      }
    });

    await storage.createAiInsight({
      hcpId: drWilson.id,
      insightType: "risk_narrative",
      confidenceScore: 78,
      narrative: `Peer Influence Pattern\n\nDr. Wilson's prescribing changes appear influenced by peer behavior in the North Manhattan territory. Multiple key opinion leaders (KOLs) including Dr. Sarah Smith have reduced Onco-Pro prescriptions following recent clinical data.\n\n**Observation**: 35% decline in Onco-Pro prescriptions over 3 months, coinciding with territory-wide discussions about ORION-Y trial results.\n\n**Recommendation**: Schedule educational detailing session focusing on Onco-Pro's differentiated value proposition for his specific patient mix.`,
      expiresAt: new Date("2025-10-22")
    });

    console.log("✅ Signal detection data seeded");

    // === HCP 2: DR. MICHAEL CHEN - PATIENT ACCESS BARRIER SCENARIO ===
    console.log("🏥 Seeding HCP 2: Dr. Michael Chen (Access Barrier Scenario)...");
    console.log("✅ HCP 2 created");

    // COHORT 1: High Copay Shock Patients (4 patients) - $35 → $450 copay shock
    const hcp2_p001 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P001",
      age: 62,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "high_copay",
      payer: "United Healthcare",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 450,
      fulfillmentLagDays: 3,
      switchedDate: new Date("2025-08-20"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p002 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P002",
      age: 58,
      cancerType: "Non-Small Cell Lung Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "high_copay",
      payer: "United Healthcare",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 450,
      fulfillmentLagDays: 2,
      switchedDate: new Date("2025-08-25"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p003 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P003",
      age: 65,
      cancerType: "Pancreatic Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "high_copay",
      payer: "United Healthcare",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 450,
      fulfillmentLagDays: 4,
      switchedDate: new Date("2025-09-05"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p004 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P004",
      age: 71,
      cancerType: "Colorectal Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["Hypertension"],
      currentDrug: "Onco-Rival",
      cohort: "high_copay",
      payer: "United Healthcare",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 450,
      fulfillmentLagDays: 3,
      switchedDate: new Date("2025-09-10"),
      switchedToDrug: "Onco-Rival",
    });

    // COHORT 2: PA Denied/Step-Edit Patients (3 patients) - Prior Auth rejections
    const hcp2_p005 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P005",
      age: 54,
      cancerType: "Ovarian Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "pa_denied",
      payer: "Aetna",
      priorAuthStatus: "denied",
      denialCode: "step_edit_required",
      copayAmount: 35,
      fulfillmentLagDays: 14,
      switchedDate: new Date("2025-08-18"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p006 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P006",
      age: 60,
      cancerType: "Breast Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "pa_denied",
      payer: "Cigna",
      priorAuthStatus: "denied",
      denialCode: "step_edit_required",
      copayAmount: 35,
      fulfillmentLagDays: 12,
      switchedDate: new Date("2025-08-28"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p007 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P007",
      age: 67,
      cancerType: "Prostate Cancer",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 1,
      cardiovascularConditions: ["Diabetes"],
      currentDrug: "Onco-Rival",
      cohort: "pa_denied",
      payer: "United Healthcare",
      priorAuthStatus: "denied",
      denialCode: "step_edit_required",
      copayAmount: 35,
      fulfillmentLagDays: 11,
      switchedDate: new Date("2025-09-02"),
      switchedToDrug: "Onco-Rival",
    });

    // COHORT 3: Specialty Pharmacy Fulfillment Delays (2 patients) - Long lag times
    const hcp2_p008 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P008",
      age: 56,
      cancerType: "Bladder Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "fulfillment_delay",
      payer: "Humana",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 35,
      fulfillmentLagDays: 14,
      switchedDate: new Date("2025-09-12"),
      switchedToDrug: "Onco-Rival",
    });

    const hcp2_p009 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P009",
      age: 69,
      cancerType: "Renal Cell Carcinoma",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Rival",
      cohort: "fulfillment_delay",
      payer: "Blue Cross Blue Shield",
      priorAuthStatus: "approved",
      denialCode: null,
      copayAmount: 35,
      fulfillmentLagDays: 13,
      switchedDate: new Date("2025-09-18"),
      switchedToDrug: "Onco-Rival",
    });

    // COHORT 4: Smooth Access Patients (3 patients) - No access issues, stayed on Onco-Pro
    const hcp2_p010 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P010",
      age: 63,
      cancerType: "Melanoma",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "smooth_access",
      payer: "Medicare",
      priorAuthStatus: "not_required",
      denialCode: null,
      copayAmount: 35,
      fulfillmentLagDays: 2,
      switchedDate: null,
      switchedToDrug: null,
    });

    const hcp2_p011 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P011",
      age: 61,
      cancerType: "Lymphoma",
      cancerStage: "Stage III",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "smooth_access",
      payer: "Medicare",
      priorAuthStatus: "not_required",
      denialCode: null,
      copayAmount: 35,
      fulfillmentLagDays: 3,
      switchedDate: null,
      switchedToDrug: null,
    });

    const hcp2_p012 = await storage.createPatient({
      hcpId: drMichaelChen.id,
      patientCode: "MC-P012",
      age: 59,
      cancerType: "Gastric Cancer",
      cancerStage: "Stage II",
      hasCardiovascularRisk: 0,
      cardiovascularConditions: [],
      currentDrug: "Onco-Pro",
      cohort: "smooth_access",
      payer: "Kaiser Permanente",
      priorAuthStatus: "not_required",
      denialCode: null,
      copayAmount: 35,
      fulfillmentLagDays: 2,
      switchedDate: null,
      switchedToDrug: null,
    });

    console.log("✅ HCP 2 patient cohorts created (12 patients: 4 copay shock, 3 PA denied, 2 fulfillment delay, 3 smooth access)");

    // === CALL NOTES: Temporal progression from normal → frustration → switching ===
    // Early notes (June-July): Normal engagement, no access issues mentioned
    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-06-05"),
      noteText: "Great visit with Dr. Chen. Discussed Onco-Pro's latest efficacy data for RCC patients. He's very satisfied with patient outcomes and mentioned planning to expand use in first-line setting. Strong advocate for the product.",
      noteType: "routine_visit",
      keyTopics: ["efficacy_data", "patient_outcomes", "product_expansion"],
      sentiment: "positive",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-06-20"),
      noteText: "Follow-up on recent starts. Dr. Chen reported excellent tolerability across his RCC cohort. No major concerns raised. He appreciated the patient education materials we provided last visit.",
      noteType: "follow_up",
      keyTopics: ["tolerability", "patient_education"],
      sentiment: "positive",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-07-10"),
      noteText: "Routine check-in. Census shows 45 active Onco-Pro patients this month. Dr. Chen mentioned upcoming vacation but will be back mid-August. Asked for updated dosing guidelines for elderly patients.",
      noteType: "routine_visit",
      keyTopics: ["census_update", "dosing_guidelines"],
      sentiment: "neutral",
    });

    // Mid-August: First signs of access frustration post-policy change
    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-08-15"),
      noteText: "Dr. Chen seemed unusually frustrated today. Mentioned that United Healthcare patients are suddenly facing high copays ($400-500 range) for Onco-Pro. Said two patients called him directly complaining about cost shock. He's concerned about treatment adherence.",
      noteType: "routine_visit",
      keyTopics: ["copay_issues", "patient_complaints", "adherence_concerns"],
      sentiment: "frustrated",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-08-22"),
      noteText: "URGENT: Dr. Chen very upset. Said he's getting prior auth denials left and right for Onco-Pro. Aetna and Cigna now requiring step-edit (must fail on older therapies first). He said this is 'completely backwards clinically' and patients are suffering delays. Asked why we didn't warn him about formulary changes.",
      noteType: "urgent",
      keyTopics: ["prior_auth_denials", "step_edit", "formulary_changes"],
      sentiment: "negative",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-08-25"),
      noteText: "Dr. Chen brought up case of MC-P001 who abandoned therapy due to $450 copay. Patient couldn't afford it and went without treatment for 3 weeks until we helped navigate copay assistance. Chen said he's never seen anything like this before with our product.",
      noteType: "follow_up",
      keyTopics: ["treatment_abandonment", "copay_assistance", "patient_case"],
      sentiment: "negative",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-08-28"),
      noteText: "Virtual call. Dr. Chen shared that specialty pharmacy is taking 10-14 days to fill Onco-Pro prescriptions now (used to be 2-3 days). Patients calling his office confused and angry. He mentioned network changes might be the cause but isn't sure. Expressed concern about losing patients to competitors with smoother access.",
      noteType: "virtual",
      keyTopics: ["specialty_pharmacy", "fulfillment_delays", "network_changes", "competitor_threat"],
      sentiment: "frustrated",
    });

    // Early September: Switches starting to happen
    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-09-03"),
      noteText: "Dr. Chen disclosed he's started switching some patients to Onco-Rival due to access barriers. Said Onco-Rival has better formulary positioning with United, Aetna, and Cigna right now. Very apologetic but said he has to prioritize patient access over brand loyalty. This is a critical situation.",
      noteType: "urgent",
      keyTopics: ["switching_to_competitor", "formulary_positioning", "access_barriers"],
      sentiment: "negative",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-09-10"),
      noteText: "Follow-up on switching trend. Confirmed 6 patients switched to Onco-Rival so far (MC-P001, MC-P002, MC-P003, MC-P005, MC-P006, MC-P007). All cited access/cost reasons. Dr. Chen emphasized this is NOT about clinical efficacy - purely administrative burden. Asked what we can do to fix payer relationships.",
      noteType: "follow_up",
      keyTopics: ["switch_count", "access_reasons", "payer_relationships"],
      sentiment: "frustrated",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-09-15"),
      noteText: "Discussion about PA escalation support. Dr. Chen mentioned his clinic staff is overwhelmed with prior auth paperwork for Onco-Pro patients. Asked if we have a dedicated team that can help expedite approvals. He's considering switching more patients if this doesn't improve soon.",
      noteType: "routine_visit",
      keyTopics: ["prior_auth_support", "clinic_burden", "escalation_request"],
      sentiment: "frustrated",
    });

    // Late September: Continued switching
    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-09-18"),
      noteText: "Confirmed 2 more switches: MC-P008 and MC-P009. Both had 14-day fulfillment delays through specialty pharmacy. Patients lost confidence and asked to switch. Dr. Chen said Onco-Rival fills in 3-5 days. This is becoming a pattern.",
      noteType: "follow_up",
      keyTopics: ["additional_switches", "fulfillment_comparison", "patient_confidence"],
      sentiment: "negative",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-09-22"),
      noteText: "Dr. Chen shared that MC-P004 just switched after copay shock ($450). Patient is on fixed income and simply can't afford it despite copay assistance programs. Chen visibly frustrated that clinical decisions are being driven by access barriers rather than medical evidence.",
      noteType: "follow_up",
      keyTopics: ["copay_shock", "fixed_income", "clinical_decisions"],
      sentiment: "negative",
    });

    // October: Aftermath and assessment
    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-10-05"),
      noteText: "Debrief on September's switches. 9 of 12 patients switched to competitor - 75% attrition rate. Dr. Chen said this has NEVER happened before with any product. Only 3 patients remained (MC-P010, MC-P011, MC-P012) - all Medicare with no access issues. He wants emergency meeting with our access/reimbursement team.",
      noteType: "urgent",
      keyTopics: ["attrition_rate", "medicare_advantage", "emergency_meeting"],
      sentiment: "negative",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-10-12"),
      noteText: "Strategy session. Dr. Chen laid out three conditions for re-engaging with Onco-Pro: (1) Fix UHC formulary tier, (2) Deploy PA escalation SWAT team for his patients, (3) Guarantee 3-day specialty pharmacy SLA. Said if we can't deliver on these, he'll keep prescribing Onco-Rival. This is salvageable but requires urgent action.",
      noteType: "urgent",
      keyTopics: ["re_engagement_conditions", "formulary_fix", "specialty_pharmacy_sla"],
      sentiment: "neutral",
    });

    await storage.createCallNote({
      hcpId: drMichaelChen.id,
      repName: "Sarah Martinez",
      visitDate: new Date("2025-10-18"),
      noteText: "Positive development: Connected Dr. Chen with our Market Access Director. They discussed copay foundation program ($0 copay for eligible patients) and dedicated reimbursement specialist for his clinic. Chen cautiously optimistic but wants to see execution before switching patients back.",
      noteType: "follow_up",
      keyTopics: ["copay_foundation", "reimbursement_specialist", "cautious_optimism"],
      sentiment: "neutral",
    });

    console.log("✅ HCP 2 call notes created (15 notes showing temporal access barrier progression)");

    // === PAYER COMMUNICATIONS: Policy changes that created access barriers ===
    await storage.createPayerCommunication({
      payerName: "United Healthcare",
      documentType: "formulary_update",
      documentTitle: "Q3 2025 Formulary Changes - Oncology Specialty Tier",
      documentText: `UNITED HEALTHCARE COMMERCIAL FORMULARY UPDATE
Effective Date: August 1, 2025
Distribution: All Network Providers

ONCOLOGY TIER CHANGES:

The following oncology products will transition from Tier 2 (Preferred Specialty) to Tier 3 (Non-Preferred Specialty) effective August 1, 2025:

• Onco-Pro (pembrolizumab) - ALL INDICATIONS
  - Previous copay: $35
  - New copay: $450 per 30-day supply
  - Prior authorization: REQUIRED for all new starts
  - Step-edit protocol: Patients must document failure on Onco-Rival or generic alternatives

RATIONALE: Clinical equivalency established through recent comparative effectiveness research. Cost containment initiative to align with value-based care objectives.

SPECIALTY PHARMACY NETWORK CHANGE:
Effective August 1, Onco-Pro prescriptions must be filled through:
• CarePath Specialty (exclusive network partner)
• Average fulfillment time: 7-10 business days
• Previous network (RxConnect): 2-3 business days

Provider Action Required:
1. Update EMR formulary preferences
2. Counsel patients on new cost-sharing structure
3. Submit prior authorization requests through UHC Provider Portal

Questions: Contact Provider Relations at 1-800-UHC-PROV

This is an official communication. Failure to comply may result in claim denials.`,
      effectiveDate: new Date("2025-08-01"),
      products: ["Onco-Pro"],
      keyChanges: ["Tier 2 → Tier 3", "Copay $35 → $450", "PA required", "Step-edit protocol", "Specialty pharmacy network change"],
      source: "email",
      receivedDate: new Date("2025-07-28"),
    });

    await storage.createPayerCommunication({
      payerName: "Aetna",
      documentType: "pa_requirement",
      documentTitle: "New Step-Edit Protocol: Oncology Immunotherapy Products",
      documentText: `AETNA MEDICAL POLICY UPDATE
Policy Number: MED-ONCO-2025-08
Effective: August 15, 2025

STEP-EDIT REQUIREMENT: Oncology Immunotherapy

PRODUCTS AFFECTED:
• Onco-Pro (pembrolizumab)
• Immuno-Advance (nivolumab)

PRIOR AUTHORIZATION CRITERIA:
Members must demonstrate ONE of the following before Onco-Pro approval:

1. Trial and failure of Onco-Rival (minimum 8 weeks)
2. Medical contraindication to Onco-Rival (documented allergy/intolerance)
3. Clinical trial enrollment requiring specific agent

DOCUMENTATION REQUIRED:
- Previous therapy history with dates
- Clinical rationale for agent selection
- Most recent imaging/tumor markers
- Expected treatment duration

APPROVAL TIMEFRAME: 10-14 business days from complete submission
EXPEDITED REVIEW: Available for urgent cases (requires clinical justification)

Denials may be appealed through standard Aetna grievance process (30-day window).

Contact Clinical Review Team: 1-888-AETNA-PA`,
      effectiveDate: new Date("2025-08-15"),
      products: ["Onco-Pro", "Immuno-Advance"],
      keyChanges: ["Step-edit required", "Trial and failure documentation", "10-14 day approval timeframe"],
      source: "pdf",
      receivedDate: new Date("2025-08-10"),
    });

    await storage.createPayerCommunication({
      payerName: "Cigna",
      documentType: "policy_change",
      documentTitle: "Prior Authorization Update - Specialty Oncology Class",
      documentText: `CIGNA PHARMACY MANAGEMENT
Bulletin: RX-2025-Q3-014
Date: July 25, 2025

SUBJECT: Enhanced Prior Authorization Requirements for Specialty Oncology

Effective August 1, 2025, Cigna is implementing enhanced utilization management for high-cost specialty oncology agents to ensure appropriate use and cost-effectiveness.

ONCO-PRO (pembrolizumab):
Status: Non-Preferred Agent (Requires PA)
Step-Edit: YES
  → First-line requirement: Onco-Rival OR physician attestation of medical necessity

APPROVAL CRITERIA:
✓ Diagnosis confirmation with ICD-10 code
✓ Stage documentation
✓ Previous treatment history (if applicable)
✓ Physician narrative justifying agent selection
✓ Expected # of cycles

DENIAL REASONS (common):
- Incomplete documentation
- Lack of step-edit compliance
- Off-label use without compendia support
- Alternative agent available at lower cost

Processing Time: Up to 14 calendar days
Expedited requests: 72 hours (clinical urgency required)

Provider Portal: cigna.com/provider-auth

For questions, contact Cigna PharmaCare Solutions at 1-800-CIGNA-RX`,
      effectiveDate: new Date("2025-08-01"),
      products: ["Onco-Pro"],
      keyChanges: ["Non-preferred status", "PA required", "Step-edit protocol", "14-day processing time"],
      source: "portal",
      receivedDate: new Date("2025-07-25"),
    });

    await storage.createPayerCommunication({
      payerName: "Blue Cross Blue Shield",
      documentType: "tier_change",
      documentTitle: "Specialty Pharmacy Network Optimization",
      documentText: `BLUE CROSS BLUE SHIELD - MASSACHUSETTS
Network Update Notice
Effective: August 1, 2025

SPECIALTY PHARMACY NETWORK CHANGES

As part of our ongoing commitment to value-based care, BCBS-MA is optimizing our specialty pharmacy network to improve quality and reduce costs.

NETWORK CHANGES:
Previous Preferred Pharmacies (discontinued):
• RxConnect Specialty - Boston
• Specialty Solutions Inc
• CareMark Oncology Division

New Exclusive Network:
• MedPath Specialty Services (sole provider for oncology)

IMPACT ON ONCOLOGY PRODUCTS:
Onco-Pro prescriptions MUST be filled through MedPath Specialty
- Order-to-delivery time: 10-14 business days (includes PA processing + fulfillment)
- Previous network average: 3-5 days

TRANSITION PERIOD:
August 1-15: Dual network accepted
August 16+: MedPath ONLY (claims denied if filled elsewhere)

Provider Action:
1. Update prescription routing to MedPath
2. Inform patients of longer fulfillment times
3. Plan ahead for treatment continuity

Questions: BCBS Provider Services 1-800-BCBS-PROV`,
      effectiveDate: new Date("2025-08-01"),
      products: ["Onco-Pro", "All Specialty Oncology"],
      keyChanges: ["Exclusive network", "MedPath Specialty only", "10-14 day fulfillment", "Previous pharmacy network discontinued"],
      source: "fax",
      receivedDate: new Date("2025-07-22"),
    });

    console.log("✅ HCP 2 payer communications created (4 policy documents triggering access barriers)");

    // === PRESCRIPTION HISTORY: Decline from 45 → 25, correlating with Aug 1 policy change ===
    // May 2025 - Baseline (all patients on Onco-Pro, pre-policy change)
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 45,
      month: "2025-05",
      isOurProduct: 1,
      cohort: "all",
    });

    // June 2025 - Still stable
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 44,
      month: "2025-06",
      isOurProduct: 1,
      cohort: "all",
    });

    // July 2025 - Last month pre-policy change
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 43,
      month: "2025-07",
      isOurProduct: 1,
      cohort: "all",
    });

    // August 2025 - Policy change hits (Aug 1), early switching begins
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 38,
      month: "2025-08",
      isOurProduct: 1,
      cohort: "smooth_access",
    });
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 4,
      month: "2025-08",
      isOurProduct: 0,
      cohort: "high_copay_pa_denied",
    });

    // September 2025 - CRITICAL switching month (most patients switch)
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 28,
      month: "2025-09",
      isOurProduct: 1,
      cohort: "smooth_access",
    });
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 12,
      month: "2025-09",
      isOurProduct: 0,
      cohort: "high_copay_pa_denied_fulfillment_delay",
    });

    // October 2025 - Stabilized at low level (only 3 Medicare patients remain)
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Pro",
      productCategory: "Immunotherapy",
      prescriptionCount: 25,
      month: "2025-10",
      isOurProduct: 1,
      cohort: "smooth_access",
    });
    await storage.createPrescriptionHistory({
      hcpId: drMichaelChen.id,
      patientId: null,
      productName: "Onco-Rival",
      productCategory: "Immunotherapy",
      prescriptionCount: 15,
      month: "2025-10",
      isOurProduct: 0,
      cohort: "high_copay_pa_denied_fulfillment_delay",
    });

    console.log("✅ HCP 2 prescription history created (May-Oct timeline showing access barrier impact)");

    // === CLINICAL EVENTS: Access barrier events correlating with patient switches ===
    // Event 1: Copay Shock Notification
    await storage.createClinicalEvent({
      hcpId: drMichaelChen.id,
      patientId: hcp2_p001.id,
      eventType: "adverse_event",
      eventTitle: "Copay Shock: $450 Out-of-Pocket Cost",
      eventDescription: "Patient MC-P001 contacted clinic distressed about unexpected $450 copay for Onco-Pro (was previously $35). Patient on fixed income, threatened to discontinue therapy. Financial toxicity event.",
      eventDate: new Date("2025-08-16"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        previousCopay: 35,
        newCopay: 450,
        patientIncome: "Fixed Income",
        outcome: "Switched to Onco-Rival",
      },
    });

    // Event 2: Prior Auth Denial
    await storage.createClinicalEvent({
      hcpId: drMichaelChen.id,
      patientId: hcp2_p005.id,
      eventType: "adverse_event",
      eventTitle: "Prior Authorization Denied - Step-Edit Required",
      eventDescription: "Aetna denied PA for Onco-Pro for patient MC-P005. Reason: Step-edit protocol requires trial of Onco-Rival first. Patient delayed treatment initiation by 14 days.",
      eventDate: new Date("2025-08-18"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        payer: "Aetna",
        denialCode: "step_edit_required",
        delayDays: 14,
        outcome: "Switched to Onco-Rival to expedite treatment",
      },
    });

    // Event 3: Specialty Pharmacy Fulfillment Delay
    await storage.createClinicalEvent({
      hcpId: drMichaelChen.id,
      patientId: hcp2_p008.id,
      eventType: "adverse_event",
      eventTitle: "14-Day Specialty Pharmacy Fulfillment Delay",
      eventDescription: "Patient MC-P008's Onco-Pro prescription delayed 14 days due to new MedPath Specialty network. Patient anxious about treatment gap. Requested switch to competitor with faster fulfillment.",
      eventDate: new Date("2025-09-08"),
      impact: "medium",
      relatedDrug: "Onco-Pro",
      metadata: {
        specialtyPharmacy: "MedPath Specialty",
        delayDays: 14,
        patientAnxiety: "High",
        outcome: "Switched to Onco-Rival (3-day fill time)",
      },
    });

    // Event 4: Payer Policy Change Notification
    await storage.createClinicalEvent({
      hcpId: drMichaelChen.id,
      patientId: null,
      eventType: "publication",
      eventTitle: "United Healthcare Formulary Change - Tier 3 Reclassification",
      eventDescription: "Dr. Chen received UHC notification that Onco-Pro moved to Tier 3 (non-preferred) effective Aug 1. Copay increased from $35 to $450 for all UHC commercial patients. Clinic overwhelmed with patient complaints.",
      eventDate: new Date("2025-07-28"),
      impact: "high",
      relatedDrug: "Onco-Pro",
      metadata: {
        payer: "United Healthcare",
        previousTier: 2,
        newTier: 3,
        affectedPatients: 7,
      },
    });

    console.log("✅ HCP 2 clinical events created (4 access barrier events)");

    // === NEXT BEST ACTIONS: Access-focused strategies ===
    await storage.createNba({
      hcpId: drMichaelChen.id,
      action: "Deploy PA Escalation SWAT Team for Immediate Prior Auth Support",
      actionType: "meeting",
      priority: "High",
      reason: "75% patient attrition due to prior authorization delays and denials. Dr. Chen's clinic staff overwhelmed with PA paperwork.",
      aiInsight: "Root cause analysis reveals systematic access barriers across 3 payers (UHC, Aetna, Cigna). Deploy dedicated reimbursement specialists to handle all PA submissions for Dr. Chen's patients, targeting <72 hour turnaround. This removes administrative burden from clinic and demonstrates commitment to access solutions.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drMichaelChen.id,
      action: "Auto-Enroll Eligible Patients in $0 Copay Foundation Program",
      actionType: "email",
      priority: "High",
      reason: "4 patients switched due to copay shock ($35 → $450). Financial toxicity is primary driver of switches.",
      aiInsight: "Proactively screen all Dr. Chen's Onco-Pro patients for copay foundation eligibility. Patients with household income <400% FPL qualify for $0 copay. Automatic enrollment removes financial barrier and prevents future switches. Send clinic coordinator foundation enrollment kit.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drMichaelChen.id,
      action: "Establish 3-Day Specialty Pharmacy SLA with Preferred Partner",
      actionType: "call",
      priority: "High",
      reason: "2 patients switched due to 14-day specialty pharmacy delays. Competitor offers 3-5 day fulfillment.",
      aiInsight: "Negotiate expedited fulfillment agreement with RxConnect Specialty (Dr. Chen's preferred pharmacy). Guarantee 3-day fill time for all Onco-Pro scripts. This matches competitor speed and eliminates fulfillment advantage. Alert Dr. Chen once SLA is active.",
      status: "pending",
    });

    await storage.createNba({
      hcpId: drMichaelChen.id,
      action: "Schedule Payer Relations Summit with UHC/Aetna/Cigna Reps",
      actionType: "meeting",
      priority: "Medium",
      reason: "Formulary position deteriorated across 3 major payers simultaneously. Tier changes and step-edits created perfect storm.",
      aiInsight: "Coordinate tripartite meeting with UHC, Aetna, and Cigna account teams to address formulary positioning. Present real-world evidence from Dr. Chen's patients showing clinical impact of access delays. Negotiate tier reconsideration or expedited PA pathways. Include Dr. Chen in meeting to provide physician perspective.",
      status: "pending",
    });

    console.log("✅ HCP 2 NBAs created (4 access-focused interventions)");
    
    console.log("✅ Database seeded successfully with rich multi-cohort scenario");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
