import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CohortSwitchingChart } from "@/components/CohortSwitchingChart";
import { ComparativePrescriptionTrends } from "@/components/ComparativePrescriptionTrends";
import { HypothesisTreeView } from "@/components/HypothesisTreeView";
import { MultiSignalEvidencePanel } from "@/components/MultiSignalEvidencePanel";
import {
  ArrowLeft,
  Brain,
  MapPin,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  UserCheck,
  Eye,
  Activity,
  Sparkles,
  Search,
  Target,
  CheckCircle2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label as ChartLabel } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useEffect } from "react";

interface HCP {
  id: number;
  name: string;
  specialty: string;
  hospital: string;
  territory: string;
  switchRiskScore: number;
  switchRiskTier: string;
  switchRiskReasons?: string[];
  engagementLevel: string;
  lastVisitDate: string;
  createdAt: string;
}

interface InvestigationResults {
  hasInvestigation: boolean;
  session?: any;
  provenHypotheses?: any[];
  allHypotheses?: any[];
  confirmedHypotheses?: any[];
  isConfirmed?: boolean;
}

async function fetchHCP(id: string): Promise<HCP> {
  const response = await fetch(`/api/hcps/${id}`);
  if (!response.ok) throw new Error("Failed to fetch HCP");
  return response.json();
}

async function fetchPrescriptionHistory(hcpId: string) {
  const response = await fetch(`/api/prescription-history/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch prescription history");
  return response.json();
}

async function fetchInvestigationResults(hcpId: string): Promise<InvestigationResults> {
  const response = await fetch(`/api/ai/investigation-results/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch investigation results");
  return response.json();
}

async function fetchPatients(hcpId: string) {
  const response = await fetch(`/api/hcps/${hcpId}/patients`);
  if (!response.ok) throw new Error("Failed to fetch patients");
  return response.json();
}

async function fetchPrescriptionTrends(hcpId: string) {
  const response = await fetch(`/api/hcps/${hcpId}/prescription-trends`);
  if (!response.ok) throw new Error("Failed to fetch prescription trends");
  return response.json();
}

async function fetchClinicalEvents(hcpId: string) {
  const response = await fetch(`/api/hcps/${hcpId}/events`);
  if (!response.ok) throw new Error("Failed to fetch clinical events");
  return response.json();
}

function getRiskBadge(tier: string, score: number) {
  if (tier === "critical" || score >= 70)
    return <Badge className="bg-gray-900 text-white text-xs px-2.5 py-0.5">High Risk</Badge>;
  if (tier === "medium" || score >= 40)
    return <Badge className="bg-gray-600 text-white text-xs px-2.5 py-0.5">Medium Risk</Badge>;
  return <Badge className="bg-gray-300 text-gray-700 text-xs px-2.5 py-0.5">Low Risk</Badge>;
}

// Hypothesis data for each HCP
const getHypothesesForHcp = (hcpId: string) => {
  if (hcpId === "1") {
    // Dr. Sarah Smith - Safety/Efficacy hypotheses
    return [
      {
        id: "safety_concerns",
        text: "Safety Concerns - Adverse events driving switches in high-risk patients",
        status: "proven" as const,
        confidence: 90,
        evidence: ["4 cardiac AEs in CV-risk patients (Aug-Sep)", "Proactive switches to mitigate risk", "Correlated with patient safety profile"]
      },
      {
        id: "efficacy_data",
        text: "New Efficacy Data - ASCO ORION-Y trial influenced young RCC patient switches",
        status: "proven" as const,
        confidence: 85,
        evidence: ["5 young RCC patients switched within 3 weeks post-ASCO", "Superior PFS data for Onco-Rival", "Temporal correlation with June 15 conference"]
      },
      {
        id: "access_barriers",
        text: "Access Barriers - Payer or formulary changes limiting product availability",
        status: "rejected" as const,
        confidence: 15,
        evidence: ["No formulary changes detected", "Stable payer mix", "No PA denials reported"]
      },
      {
        id: "peer_influence",
        text: "Peer Influence - KOL network driving prescribing changes",
        status: "rejected" as const,
        confidence: 20,
        evidence: ["Pattern unique to Dr. Smith", "No territory-wide trend", "Independent clinical decision"]
      },
      {
        id: "pricing",
        text: "Pricing Pressure - Cost considerations affecting prescriptions",
        status: "rejected" as const,
        confidence: 10,
        evidence: ["No patient copay complaints", "Insurance coverage stable", "No financial access issues"]
      }
    ];
  } else if (hcpId === "2") {
    // Dr. Michael Chen - Access Barrier hypotheses
    return [
      {
        id: "access_barriers",
        text: "Access Barriers - Multi-payer formulary changes blocking patient access",
        status: "proven" as const,
        confidence: 92,
        evidence: ["Aug 1 tier changes across UHC/Aetna/Cigna", "9/12 patients hit access barriers", "Copay $35→$450, new PA requirements"]
      },
      {
        id: "safety_concerns",
        text: "Safety Concerns - Adverse events driving switches",
        status: "rejected" as const,
        confidence: 10,
        evidence: ["No AE clusters detected", "Call notes show clinical confidence", "No safety-related switches"]
      },
      {
        id: "efficacy_data",
        text: "New Efficacy Data - Clinical trial results changing prescribing",
        status: "rejected" as const,
        confidence: 12,
        evidence: ["No conference attendance in timeline", "No efficacy concerns in notes", "Switches isolated to access-blocked patients"]
      },
      {
        id: "pricing",
        text: "Pricing Pressure - Patient financial burden driving abandonment",
        status: "proven" as const,
        confidence: 88,
        evidence: ["4/4 high copay patients switched (100%)", "$450/month copay shock", "Financial toxicity explicit in notes"]
      },
      {
        id: "fulfillment",
        text: "Fulfillment Delays - Specialty pharmacy lags causing switches",
        status: "proven" as const,
        confidence: 75,
        evidence: ["2/2 delay patients switched (100%)", "14-day lags vs competitor 3-day", "Patient frustration documented"]
      }
    ];
  }
  return [];
};

export default function HCPDetail() {
  const [, params] = useRoute("/hcp/:id");
  const hcpId = params?.id;
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState(false);
  
  // Wizard state management
  const [wizardStage, setWizardStage] = useState<1 | 2 | 3 | 'complete'>(1);
  const [stage1Complete, setStage1Complete] = useState(false);
  const [stage2Complete, setStage2Complete] = useState(false);
  const [stage3Complete, setStage3Complete] = useState(false);
  
  // Human SME input
  const [stage1Input, setStage1Input] = useState("");
  const [stage2Input, setStage2Input] = useState("");
  const [stage3Input, setStage3Input] = useState("");
  
  // Stage 1 live agent activity
  const [stage1Activities, setStage1Activities] = useState<Array<{
    id: number;
    timestamp: number;
    agent: string;
    activity: string;
    status: "in_progress" | "completed";
  }>>([]);
  const [activityStartTime, setActivityStartTime] = useState<number | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Stage 2 live agent activity
  const [stage2Activities, setStage2Activities] = useState<Array<{
    id: number;
    timestamp: number;
    agent: string;
    activity: string;
    status: "in_progress" | "completed";
  }>>([]);
  const [stage2StartTime, setStage2StartTime] = useState<number | null>(null);
  const [stage2Progress, setStage2Progress] = useState(0);

  // Stage 3 live agent activity
  const [stage3Activities, setStage3Activities] = useState<Array<{
    id: number;
    timestamp: number;
    agent: string;
    activity: string;
    status: "in_progress" | "completed";
  }>>([]);
  const [stage3StartTime, setStage3StartTime] = useState<number | null>(null);
  const [stage3Progress, setStage3Progress] = useState(0);

  const { data: hcp, isLoading } = useQuery({
    queryKey: ["hcp", hcpId],
    queryFn: () => fetchHCP(hcpId!),
    enabled: !!hcpId,
  });

  // Fetch Stage 1 agent activities
  const { data: allActivities } = useQuery({
    queryKey: ["stage1-activity", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/stage1-activity`);
      if (!response.ok) throw new Error("Failed to fetch agent activity");
      return response.json();
    },
    enabled: !!hcpId && wizardStage === 1,
  });

  // Fetch Stage 2 agent activities
  const { data: allStage2Activities } = useQuery({
    queryKey: ["stage2-activity", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/stage2-activity`);
      if (!response.ok) throw new Error("Failed to fetch agent activity");
      return response.json();
    },
    enabled: !!hcpId && wizardStage === 2,
  });

  // Fetch Stage 3 agent activities
  const { data: allStage3Activities } = useQuery({
    queryKey: ["stage3-activity", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/stage3-activity`);
      if (!response.ok) throw new Error("Failed to fetch agent activity");
      return response.json();
    },
    enabled: !!hcpId && wizardStage === 3,
  });

  // Simulate real-time activity feed by gradually revealing activities
  useEffect(() => {
    if (!allActivities || wizardStage !== 1) {
      setStage1Activities([]);
      setActivityStartTime(null);
      return;
    }

    // Start the timer on first load
    if (!activityStartTime) {
      setActivityStartTime(Date.now());
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - activityStartTime;
      const visibleActivities = allActivities.filter((activity: any) => {
        const relativeTime = activity.timestamp - allActivities[0].timestamp;
        return relativeTime <= elapsed;
      });
      setStage1Activities(visibleActivities);

      // Calculate overall progress (0-100%)
      const totalDuration = 30000; // 30 seconds
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProcessingProgress(progress);

      // Stop polling once all activities are visible
      if (visibleActivities.length === allActivities.length) {
        clearInterval(interval);
        setProcessingProgress(100);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [wizardStage, allActivities, activityStartTime]);

  // Stage 2 progressive reveal
  useEffect(() => {
    if (!allStage2Activities || wizardStage !== 2) {
      setStage2Activities([]);
      setStage2StartTime(null);
      return;
    }

    if (!stage2StartTime) {
      setStage2StartTime(Date.now());
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - stage2StartTime;
      const visibleActivities = allStage2Activities.filter((activity: any) => {
        const relativeTime = activity.timestamp - allStage2Activities[0].timestamp;
        return relativeTime <= elapsed;
      });
      setStage2Activities(visibleActivities);

      const totalDuration = 35000; // 35 seconds
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setStage2Progress(progress);

      if (visibleActivities.length === allStage2Activities.length) {
        clearInterval(interval);
        setStage2Progress(100);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [wizardStage, allStage2Activities, stage2StartTime]);

  // Stage 3 progressive reveal
  useEffect(() => {
    if (!allStage3Activities || wizardStage !== 3) {
      setStage3Activities([]);
      setStage3StartTime(null);
      return;
    }

    if (!stage3StartTime) {
      setStage3StartTime(Date.now());
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - stage3StartTime;
      const visibleActivities = allStage3Activities.filter((activity: any) => {
        const relativeTime = activity.timestamp - allStage3Activities[0].timestamp;
        return relativeTime <= elapsed;
      });
      setStage3Activities(visibleActivities);

      const totalDuration = 40000; // 40 seconds
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setStage3Progress(progress);

      if (visibleActivities.length === allStage3Activities.length) {
        clearInterval(interval);
        setStage3Progress(100);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [wizardStage, allStage3Activities, stage3StartTime]);

  const { data: prescriptionHistory = [] } = useQuery({
    queryKey: ["prescription-history", hcpId],
    queryFn: () => fetchPrescriptionHistory(hcpId!),
    enabled: !!hcpId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients", hcpId],
    queryFn: () => fetchPatients(hcpId!),
    enabled: !!hcpId,
  });

  const { data: clinicalEvents = [] } = useQuery({
    queryKey: ["clinical-events", hcpId],
    queryFn: () => fetchClinicalEvents(hcpId!),
    enabled: !!hcpId,
  });

  const { data: callNotes = [] } = useQuery({
    queryKey: ["call-notes", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/call-notes`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!hcpId,
  });

  const { data: payerCommunications = [] } = useQuery({
    queryKey: ["payer-communications", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/payer-communications`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!hcpId,
  });

  const { data: prescriptionTrends = [] } = useQuery({
    queryKey: ["prescription-trends", hcpId],
    queryFn: () => fetchPrescriptionTrends(hcpId!),
    enabled: !!hcpId,
  });

  const { data: investigationResults } = useQuery({
    queryKey: ["investigation-results", hcpId],
    queryFn: () => fetchInvestigationResults(hcpId!),
    enabled: !!hcpId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-base text-gray-500 font-light">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-8 py-20">
          <p className="text-center text-gray-500 font-light text-lg">Provider not found</p>
        </div>
      </div>
    );
  }

  const hasInvestigation = investigationResults?.hasInvestigation || false;
  const provenHypotheses = investigationResults?.provenHypotheses || [];
  const confirmedHypotheses = investigationResults?.confirmedHypotheses || [];
  const isConfirmed = investigationResults?.isConfirmed || false;
  
  // Only show strategies if investigation is confirmed by human AND has confirmed hypotheses
  // Guard against undefined arrays and ensure at least one hypothesis is confirmed
  const canShowStrategies = hasInvestigation && 
                           isConfirmed && 
                           Array.isArray(confirmedHypotheses) && 
                           confirmedHypotheses.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-20">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-12 -ml-3 text-gray-500 hover:text-gray-900 transition-colors text-sm font-light"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* PROGRESSIVE WIZARD - Multi-Agent Investigation */}
        {hcp.switchRiskScore > 0 && hcpId && (
          <div className="mb-24">
            {/* Unified Hero Header - Apple Style */}
            <div className="mb-16">
              <div className="flex items-start justify-between mb-12">
                <div className="flex-1">
                  <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
                    {hcp.name}
                  </h1>
                  <div className="flex items-center gap-4 text-base text-gray-600 font-light">
                    <span>{hcp.specialty}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {hcp.hospital}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-6xl font-semibold text-gray-900 mb-3 tracking-tight">
                    {hcp.switchRiskScore}
                  </div>
                  {getRiskBadge(hcp.switchRiskTier, hcp.switchRiskScore)}
                  <div className="mt-4 text-sm text-gray-600 font-light">
                    Multi-agent analysis
                  </div>
                </div>
              </div>

              {/* Progress Stepper - Apple Style */}
              <div className="flex items-center justify-between max-w-2xl">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    wizardStage >= 1 ? 'bg-blue-600' : 'bg-gray-200'
                  } transition-colors`}>
                    <span className={`text-sm font-semibold ${wizardStage >= 1 ? 'text-white' : 'text-gray-500'}`}>1</span>
                  </div>
                  <span className={`text-xs mt-2 ${wizardStage >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Observe</span>
                </div>
                <div className={`flex-1 h-0.5 mx-3 ${wizardStage >= 2 ? 'bg-blue-600' : 'bg-gray-200'} transition-colors`} />
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    wizardStage >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                  } transition-colors`}>
                    <span className={`text-sm font-semibold ${wizardStage >= 2 ? 'text-white' : 'text-gray-500'}`}>2</span>
                  </div>
                  <span className={`text-xs mt-2 ${wizardStage >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Investigate</span>
                </div>
                <div className={`flex-1 h-0.5 mx-3 ${wizardStage >= 3 ? 'bg-blue-600' : 'bg-gray-200'} transition-colors`} />
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    wizardStage >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                  } transition-colors`}>
                    <span className={`text-sm font-semibold ${wizardStage >= 3 ? 'text-white' : 'text-gray-500'}`}>3</span>
                  </div>
                  <span className={`text-xs mt-2 ${wizardStage >= 3 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Synthesize</span>
                </div>
              </div>
            </div>

            {/* STAGE 1: Observe & Correlate Signals - Apple Style */}
            {wizardStage === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 mb-8">
                <div className="flex items-start gap-8 mb-12">
                  <div className="w-20 h-20 rounded-full bg-gray-50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                    <Eye className="w-9 h-9 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                      Observe & Correlate Signals
                    </h2>
                    <p className="text-base text-gray-600 font-light leading-relaxed max-w-3xl">
                      AI agents analyze multiple data signals to detect switching patterns and anomalies impossible to find with traditional BI tools.
                    </p>
                  </div>
                </div>

                {/* Agent Processing Status - Compact */}
                {stage1Activities.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Multi-Agent Analysis</h3>
                      <span className="text-xs font-medium text-gray-600">{processingProgress}% complete</span>
                    </div>
                    
                    {/* Subtle progress bar */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mb-3 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>

                    {/* Show only the current/last activity */}
                    {stage1Activities.length > 0 && (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="w-3 h-3 flex-shrink-0">
                          {processingProgress < 100 ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-gray-900" />
                          )}
                        </div>
                        <span className="font-light">
                          {processingProgress < 100 
                            ? `${stage1Activities[stage1Activities.length - 1].agent}: ${stage1Activities[stage1Activities.length - 1].activity}`
                            : "All agents completed analysis"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Finding - Moved Up */}
                {processingProgress === 100 && (
                  <div className="bg-gray-50 rounded-2xl p-8 mb-12">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Discovery</h3>
                    <p className="text-base text-gray-900 leading-relaxed">
                      {hcpId === "1" 
                        ? "Agents detected a 75% patient switch rate with dual causality: cardiac safety events correlating with switches in CV-risk patients + temporal proximity to ASCO conference affecting young RCC patients."
                        : "Agents detected 83% patient abandonment rate (10 of 12 patients) correlating precisely with Aug 1st multi-payer policy changes introducing Tier 3 step-edits and $450 copays across 3 access-barrier cohorts."}
                    </p>
                  </div>
                )}

                {/* Temporal Correlation Visualization */}
                {processingProgress === 100 && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-200 p-10 mb-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-base font-semibold text-gray-900">Temporal Correlation Analysis</h3>
                      <p className="text-xs text-gray-500">All signals aligned to August 1st inflection point</p>
                    </div>
                    
                    <div className="relative">
                      {/* Timeline with elegant design */}
                      <div className="relative mb-12">
                        <div className="flex items-center justify-between px-8">
                          {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, idx) => (
                            <div key={month} className="flex flex-col items-center relative z-10">
                              <div className={`transition-all ${
                                idx === 3 
                                  ? 'w-4 h-4 bg-gray-700 rounded-full shadow-md shadow-gray-300' 
                                  : 'w-2 h-2 bg-gray-300 rounded-full'
                              }`}></div>
                              <span className={`text-xs mt-3 ${
                                idx === 3 ? 'font-semibold text-gray-900' : 'text-gray-500'
                              }`}>{month}</span>
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-[7px] left-8 right-8 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
                      </div>
                      
                      {/* Signal Visualizations */}
                      <div className="space-y-8">
                        {/* Prescription Volume - Line Chart Style */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">Prescription Volume</span>
                            </div>
                            <span className="text-xs text-gray-500">45 → 25 (-44%)</span>
                          </div>
                          <div className="relative h-32 flex items-end gap-3 px-8">
                            {prescriptionTrends.map((record: any, idx: number) => {
                              const height = (record.ownDrug / 45) * 100;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
                                  <div className="relative w-full">
                                    <div 
                                      className={`w-full rounded-t-lg transition-all ${
                                        idx >= 3 ? 'bg-gradient-to-t from-gray-400 to-gray-500' : 'bg-gradient-to-t from-gray-500 to-gray-600'
                                      }`}
                                      style={{ height: `${height}px` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600 mt-2 font-medium">{record.ownDrug}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payer Policy Event Marker */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">Payer Policy Changes</span>
                            </div>
                            <span className="text-xs text-gray-500">4 restrictions enacted</span>
                          </div>
                          <div className="relative flex items-center h-20 px-8">
                            <div className="flex-1"></div>
                            <div className="flex-1"></div>
                            <div className="flex-1"></div>
                            <div className="flex-1 flex justify-center">
                              <div className="relative">
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-400"></div>
                                <div className="bg-gray-700 text-white text-xs px-4 py-2 rounded-full font-medium shadow-md whitespace-nowrap">
                                  Aug 1: Tier 3 + Step-Edits + $450 Copay
                                </div>
                              </div>
                            </div>
                            <div className="flex-1"></div>
                            <div className="flex-1"></div>
                          </div>
                        </div>

                        {/* Call Notes Friction - Gradient Intensity */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">Access Barrier Friction</span>
                            </div>
                            <span className="text-xs text-gray-500">Escalating intensity post-Aug 1st</span>
                          </div>
                          <div className="flex items-center h-16 gap-2 px-8">
                            {[
                              { label: 'Low', color: 'from-gray-200 to-gray-300', text: 'text-gray-700', height: 'h-6' },
                              { label: 'Low', color: 'from-gray-200 to-gray-300', text: 'text-gray-700', height: 'h-6' },
                              { label: 'Med', color: 'from-gray-300 to-gray-400', text: 'text-gray-800', height: 'h-8' },
                              { label: 'High', color: 'from-gray-400 to-gray-500', text: 'text-gray-900', height: 'h-12' },
                              { label: 'Critical', color: 'from-gray-600 to-gray-700', text: 'text-white', height: 'h-16' },
                              { label: 'Critical', color: 'from-gray-600 to-gray-700', text: 'text-white', height: 'h-16' }
                            ].map((item, idx) => (
                              <div key={idx} className={`flex-1 flex items-center justify-center ${item.height} bg-gradient-to-t ${item.color} rounded-lg ${item.text} text-xs font-medium shadow-sm`}>
                                {item.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Patient Switches - Elegant Dot Matrix */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">Patient Abandonment</span>
                            </div>
                            <span className="text-xs text-gray-500">10 patients switched to competitor</span>
                          </div>
                          <div className="flex items-center h-16 gap-2 px-8">
                            {[0, 0, 0, 2, 4, 4].map((count, idx) => (
                              <div key={idx} className="flex-1 flex items-center justify-center">
                                {count === 0 ? (
                                  <span className="text-xs text-gray-300">—</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[40px]">
                                    {Array.from({ length: count }).map((_, i) => (
                                      <div key={i} className="w-2.5 h-2.5 bg-gray-600 rounded-full shadow-sm"></div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Insight Summary */}
                      <div className="mt-10 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-semibold text-gray-900">Causal Evidence:</span> All four independent data signals demonstrate synchronized inflection at August 1st, 2025 — the precise date when four major payers (UHC, Aetna, Cigna, BCBS) implemented formulary restrictions. This temporal alignment establishes clear causal relationship between policy changes and prescription decline.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Insights - Grid Layout with Clickable Cards */}
                {processingProgress === 100 && (
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    {/* Prescription Data Card */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-white rounded-xl border border-gray-100 p-6 text-left hover:border-gray-900 hover:shadow-sm transition-all cursor-pointer w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-900" />
                            <p className="text-sm font-semibold text-gray-900">Prescription Data</p>
                          </div>
                          <p className="text-sm text-gray-600 font-light leading-relaxed">
                            Detected 44% Rx decline (45→25) with temporal correlation
                          </p>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Prescription Data Analysis - Temporal Correlation with Policy Changes</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          {/* Summary Stats */}
                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-semibold text-blue-900">
                                {prescriptionTrends.length > 0 ? prescriptionTrends[0].ownDrug : 0}
                              </p>
                              <p className="text-xs text-blue-700 mt-1">May Baseline</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-semibold text-red-900">
                                {prescriptionTrends.length > 0 ? prescriptionTrends[prescriptionTrends.length - 1].ownDrug : 0}
                              </p>
                              <p className="text-xs text-red-700 mt-1">Oct Current</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-semibold text-amber-900">44%</p>
                              <p className="text-xs text-amber-700 mt-1">Total Decline</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-semibold text-gray-900">Aug 1st</p>
                              <p className="text-xs text-gray-700 mt-1">Inflection Point</p>
                            </div>
                          </div>

                          {/* Timeline View */}
                          <div className="space-y-3">
                            {prescriptionTrends.map((record: any, idx: number) => {
                              const isPolicyChangeMonth = record.month === '08';
                              const isPostPolicyChange = parseInt(record.month) >= 8;
                              const prevRecord = idx > 0 ? prescriptionTrends[idx - 1] : null;
                              const monthChange = prevRecord ? record.ownDrug - prevRecord.ownDrug : 0;
                              const competitorChange = prevRecord ? record.competitorDrug - prevRecord.competitorDrug : 0;
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`border rounded-lg p-4 ${isPolicyChangeMonth ? 'border-red-400 bg-red-50' : isPostPolicyChange ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-900">2025-{record.month}</span>
                                      {isPolicyChangeMonth && (
                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-900 rounded font-medium">
                                          ⚠️ Policy Change Date
                                        </span>
                                      )}
                                      {isPostPolicyChange && !isPolicyChangeMonth && (
                                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-900 rounded">
                                          Post-Policy Impact
                                        </span>
                                      )}
                                    </div>
                                    {monthChange !== 0 && (
                                      <span className={`text-xs font-medium ${monthChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {monthChange > 0 ? '+' : ''}{monthChange} from prev month
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Own Drug */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-600">Onco-Pro</span>
                                        <span className="text-sm font-semibold text-gray-900">{record.ownDrug}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all"
                                          style={{ width: `${(record.ownDrug / 45) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Competitor */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-600">Competitor</span>
                                        <span className="text-sm font-semibold text-gray-900">{record.competitorDrug}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-red-600 h-2 rounded-full transition-all"
                                          style={{ width: `${(record.competitorDrug / 15) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Call Notes Card */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-white rounded-xl border border-gray-100 p-6 text-left hover:border-gray-900 hover:shadow-sm transition-all cursor-pointer w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-900" />
                            <p className="text-sm font-semibold text-gray-900">Call Notes</p>
                          </div>
                          <p className="text-sm text-gray-600 font-light leading-relaxed">
                            Processed {callNotes.filter((n: any) => new Date(n.visitDate) < new Date("2025-10-11")).length} field notes, identified {hcpId === "1" ? "safety concerns" : "access frustration"} pattern
                          </p>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Call Notes Analysis ({callNotes.filter((n: any) => new Date(n.visitDate) < new Date("2025-10-11")).length} notes)</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="flex items-center gap-3 mb-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                              <span className="text-gray-600">High Friction</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                              <span className="text-gray-600">Moderate Friction</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                              <span className="text-gray-600">Positive/Solution</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {callNotes.filter((note: any) => {
                              // Exclude solution-focused notes from Oct 11th onwards (save for NBA stage)
                              const noteDate = new Date(note.visitDate);
                              const cutoffDate = new Date("2025-10-11");
                              return noteDate < cutoffDate;
                            }).map((note: any) => {
                              const noteDate = new Date(note.visitDate);
                              const policyChangeDate = new Date("2025-08-01");
                              const isPostPolicyChange = noteDate >= policyChangeDate;
                              
                              // Detect friction keywords
                              const noteTextLower = note.noteText?.toLowerCase() || '';
                              const hasHighFriction = noteTextLower.includes('frustrated') || 
                                                      noteTextLower.includes('angry') || 
                                                      noteTextLower.includes('abandoning') ||
                                                      noteTextLower.includes('losing patients') ||
                                                      noteTextLower.includes('emergency meeting');
                              const hasModerateFriction = noteTextLower.includes('concerned') || 
                                                          noteTextLower.includes('barrier') || 
                                                          noteTextLower.includes('delay') ||
                                                          noteTextLower.includes('denied') ||
                                                          noteTextLower.includes('copay');
                              const isPositive = noteTextLower.includes('positive') || 
                                                 noteTextLower.includes('optimistic') || 
                                                 noteTextLower.includes('solution');
                              
                              let borderColor = 'border-blue-600';
                              let bgColor = 'bg-white';
                              let badge = null;
                              
                              if (isPositive) {
                                borderColor = 'border-green-500';
                                bgColor = 'bg-green-50';
                                badge = <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">Solution Discussed</span>;
                              } else if (hasHighFriction && isPostPolicyChange) {
                                borderColor = 'border-red-500';
                                bgColor = 'bg-red-50';
                                badge = <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">High Friction - Post Aug 1st</span>;
                              } else if (hasModerateFriction && isPostPolicyChange) {
                                borderColor = 'border-yellow-500';
                                bgColor = 'bg-yellow-50';
                                badge = <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">Access Barrier - Post Aug 1st</span>;
                              }
                              
                              return (
                                <div key={note.id} className={`border-l-2 ${borderColor} ${bgColor} rounded-r-lg pl-4 pr-3 py-3`}>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs font-medium text-gray-900">{noteDate.toLocaleDateString()}</span>
                                    <span className="text-xs text-gray-500">by {note.repName}</span>
                                    {badge}
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{note.noteText}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Payer Communications Card */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-white rounded-xl border border-gray-100 p-6 text-left hover:border-gray-900 hover:shadow-sm transition-all cursor-pointer w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-900" />
                            <p className="text-sm font-semibold text-gray-900">Payer Communications</p>
                          </div>
                          <p className="text-sm text-gray-600 font-light leading-relaxed">
                            Analyzed {payerCommunications.length} payer docs
                            {payerCommunications.length > 0 && (
                              <span>, found {payerCommunications.filter(pc => pc.documentType === 'tier_change' || pc.documentType === 'policy_change').length} policy changes</span>
                            )}
                          </p>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Payer Communications Analysis ({payerCommunications.length} documents)</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          {payerCommunications.map((doc: any) => {
                            // Highlight documents that introduced reimbursement restrictions
                            const hasReimbursementRestriction = 
                              doc.documentType === 'tier_change' || 
                              doc.documentType === 'pa_requirement' ||
                              doc.documentType === 'policy_change';
                            
                            const titleLower = doc.documentTitle?.toLowerCase() || '';
                            const textLower = doc.documentText?.toLowerCase() || '';
                            const hasStepEdit = titleLower.includes('step-edit') || textLower.includes('step-edit') || textLower.includes('step edit');
                            const hasTierChange = titleLower.includes('tier') || textLower.includes('tier 3') || textLower.includes('tier change');
                            const hasPARequirement = titleLower.includes('prior authorization') || titleLower.includes('pa requirement');
                            
                            const isHighlighted = hasReimbursementRestriction && (hasStepEdit || hasTierChange || hasPARequirement);
                            
                            return (
                              <div 
                                key={doc.id} 
                                className={`rounded-lg p-4 ${isHighlighted ? 'bg-amber-50 border-2 border-amber-400' : 'bg-gray-50'}`}
                              >
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-xs font-medium text-gray-900">{doc.payerName}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${isHighlighted ? 'bg-amber-200 text-amber-900 font-medium' : 'bg-gray-200'}`}>
                                    {doc.documentType.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-gray-500">{new Date(doc.effectiveDate).toLocaleDateString()}</span>
                                  {isHighlighted && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-900 rounded font-medium">
                                      ⚠️ Reimbursement Restriction
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mb-2">{doc.documentTitle}</p>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{doc.documentText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Patient Cohorts Card */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-white rounded-xl border border-gray-100 p-6 text-left hover:border-gray-900 hover:shadow-sm transition-all cursor-pointer w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-900" />
                            <p className="text-sm font-semibold text-gray-900">Patient Cohorts</p>
                          </div>
                          <p className="text-sm text-gray-600 font-light leading-relaxed">
                            Identified {patients.filter(p => p.switchedDate !== null).length} patient switches across {hcpId === "1" ? "2 cohorts" : "3 access-barrier cohorts"}
                          </p>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Patient Cohort Analysis - Access Barrier Breakdown</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          {/* Summary Stats */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-semibold text-gray-900">{patients.filter(p => p.switchedDate !== null).length}</p>
                                <p className="text-xs text-gray-600 mt-1">Patients Switched</p>
                              </div>
                              <div>
                                <p className="text-2xl font-semibold text-gray-900">
                                  {Math.round((patients.filter(p => p.switchedDate !== null).length / patients.length) * 100)}%
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Abandonment Rate</p>
                              </div>
                              <div>
                                <p className="text-2xl font-semibold text-gray-900">3</p>
                                <p className="text-xs text-gray-600 mt-1">Access Barrier Types</p>
                              </div>
                            </div>
                          </div>

                          {/* Cohort Groups */}
                          <div className="space-y-6">
                            {['high_copay', 'pa_denied', 'fulfillment_delay'].map((cohortName) => {
                              const cohortPatients = patients.filter(p => p.cohort === cohortName && p.switchedDate !== null);
                              if (cohortPatients.length === 0) return null;
                              
                              const cohortConfig = {
                                high_copay: { 
                                  title: 'High Copay Shock', 
                                  icon: '💰',
                                  color: 'red',
                                  description: '$35 → $450 copay increase (UHC Tier 3 change)'
                                },
                                pa_denied: { 
                                  title: 'Prior Authorization Denied', 
                                  icon: '🚫',
                                  color: 'orange',
                                  description: 'Step-edit requirement: must fail on competitor first'
                                },
                                fulfillment_delay: { 
                                  title: 'Fulfillment Delays', 
                                  icon: '⏱️',
                                  color: 'yellow',
                                  description: 'Specialty pharmacy network changes: 3 days → 10-14 days'
                                }
                              }[cohortName];
                              
                              return (
                                <div key={cohortName} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className={`bg-${cohortConfig.color}-50 border-b border-${cohortConfig.color}-200 p-4`}>
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-2xl">{cohortConfig.icon}</span>
                                      <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900">{cohortConfig.title}</h3>
                                        <p className="text-xs text-gray-600 mt-0.5">{cohortConfig.description}</p>
                                      </div>
                                      <span className={`text-xs px-3 py-1 bg-${cohortConfig.color}-100 text-${cohortConfig.color}-900 rounded-full font-medium`}>
                                        {cohortPatients.length} patients
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-white">
                                    <div className="space-y-3">
                                      {cohortPatients.map((patient: any) => (
                                        <div key={patient.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{patient.patientCode}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{patient.payer}</p>
                                          </div>
                                          <div className="flex items-center gap-4 text-xs text-gray-600">
                                            <span>${patient.copayAmount} copay</span>
                                            <span className="text-gray-400">•</span>
                                            <span>Switched {new Date(patient.switchedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Human SME Input */}
                <div className="mb-8">
                  <label htmlFor="stage1-input" className="block text-sm font-medium text-gray-900 mb-3">
                    Your Input (Optional)
                  </label>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    Validate findings, provide additional context, or suggest other hypotheses for agents to explore
                  </p>
                  <textarea
                    id="stage1-input"
                    value={stage1Input}
                    onChange={(e) => setStage1Input(e.target.value)}
                    placeholder="Example: 'I've noticed increased PA denials from UnitedHealthcare specifically' or 'Confirm the Aug 1st policy change timing aligns with my field observations'"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm font-light transition-all"
                    rows={4}
                    data-testid="input-stage1-sme"
                  />
                  {stage1Input && (
                    <p className="text-xs text-gray-500 mt-2">
                      ✓ Your input will be considered in the causal investigation
                    </p>
                  )}
                </div>

                {/* Human Approval */}
                <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setStage1Complete(true);
                      setWizardStage(2);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm font-medium"
                    data-testid="button-approve-stage1"
                  >
                    Continue to Investigation
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STAGE 2: Plan & Investigate Causality - Apple Style */}
            {wizardStage === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 mb-8">
                <div className="flex items-start gap-8 mb-12">
                  <div className="w-20 h-20 rounded-full bg-gray-50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                    <Search className="w-9 h-9 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                      Plan & Investigate Causality
                    </h2>
                    <p className="text-base text-gray-600 font-light leading-relaxed max-w-3xl">
                      Agents decompose causal investigation into competing hypotheses, gather multi-signal evidence, and test each systematically to eliminate confirmation bias.
                    </p>
                  </div>
                </div>

                {/* Agent Reasoning Activity Feed */}
                {stage2Activities.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Agentic Reasoning & Investigation</h3>
                      <span className="text-xs font-medium text-gray-600">{stage2Progress}% complete</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mb-3 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${stage2Progress}%` }}
                      />
                    </div>

                    {/* Current activity */}
                    {stage2Activities.length > 0 && (
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-6">
                        <div className="w-3 h-3 flex-shrink-0">
                          {stage2Progress < 100 ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-gray-900" />
                          )}
                        </div>
                        <span className="font-light">
                          {stage2Progress < 100 
                            ? `${stage2Activities[stage2Activities.length - 1].agent}: ${stage2Activities[stage2Activities.length - 1].activity}`
                            : "Causal investigation complete"}
                        </span>
                      </div>
                    )}

                    {/* Detailed activity log - collapsible */}
                    <details className="bg-gray-50 rounded-xl overflow-hidden">
                      <summary className="px-6 py-4 cursor-pointer text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                        View Detailed Reasoning Log ({stage2Activities.length} steps)
                      </summary>
                      <div className="px-6 py-4 space-y-2 max-h-64 overflow-y-auto">
                        {stage2Activities.map((activity, index) => {
                          const isComplete = activity.status === "completed" || 
                                           index < stage2Activities.length - 1 || 
                                           stage2Progress === 100;
                          
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                            >
                              {!isComplete ? (
                                <div className="w-3 h-3 mt-0.5 flex-shrink-0">
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-gray-900 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900">{activity.agent}</p>
                                <p className="text-xs text-gray-600 font-light">{activity.activity}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                )}

                {/* Hypothesis Summary - Only show after investigation completes */}
                {stage2Progress === 100 && (
                  <>
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Generated {getHypothesesForHcp(hcpId).length} Competing Hypotheses</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {getHypothesesForHcp(hcpId).map((hyp) => (
                          <div key={hyp.id} className={`p-4 rounded-lg border-2 ${hyp.status === "proven" ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {hyp.status === "proven" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                              )}
                              <p className="text-xs font-semibold text-gray-900">{hyp.text.split(' - ')[0]}</p>
                            </div>
                            <p className="text-xs text-gray-600">{hyp.confidence}% confidence</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence Review */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Evidence Gathered Across Signals</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Agents systematically gathered and cross-validated evidence from {callNotes.length + payerCommunications.length + patients.length} data points to test each hypothesis.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Review full hypothesis tree & evidence
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Causal Investigation Results</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Hypothesis Tree</h4>
                            <HypothesisTreeView hypotheses={getHypothesesForHcp(hcpId)} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Multi-Signal Evidence</h4>
                            <MultiSignalEvidencePanel 
                              callNotes={callNotes} 
                              payerCommunications={payerCommunications}
                              patients={patients}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                    {/* Root Cause Finding */}
                    <div className="bg-gray-50 rounded-2xl p-8 mb-12">
                      <p className="text-base text-gray-900 leading-relaxed">
                        {getHypothesesForHcp(hcpId).filter(h => h.status === "proven").length} proven hypotheses with {getHypothesesForHcp(hcpId).filter(h => h.status === "proven")[0]?.confidence || 90}% confidence: {getHypothesesForHcp(hcpId).filter(h => h.status === "proven").map(h => h.text.split(' - ')[0]).join(", ")}
                      </p>
                    </div>
                  </>
                )}

                {/* Human SME Input */}
                <div className="mb-8">
                  <label htmlFor="stage2-input" className="block text-sm font-medium text-gray-900 mb-3">
                    Your Input (Optional)
                  </label>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    Validate root causes, challenge findings, or suggest additional causal factors
                  </p>
                  <textarea
                    id="stage2-input"
                    value={stage2Input}
                    onChange={(e) => setStage2Input(e.target.value)}
                    placeholder="Example: 'Agree on access barriers as primary cause' or 'Also consider recent MSL territory changes as contributing factor'"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm font-light transition-all"
                    rows={4}
                    data-testid="input-stage2-sme"
                  />
                  {stage2Input && (
                    <p className="text-xs text-gray-500 mt-2">
                      ✓ Your input will influence the recommendation synthesis
                    </p>
                  )}
                </div>

                {/* Human Approval */}
                <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setStage2Complete(true);
                      setWizardStage(3);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm font-medium"
                    data-testid="button-approve-stage2"
                  >
                    Continue to Synthesis
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STAGE 3: Synthesize & Reflect - Apple Style */}
            {wizardStage === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 mb-8">
                <div className="flex items-start gap-8 mb-12">
                  <div className="w-20 h-20 rounded-full bg-gray-50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                    <Sparkles className="w-9 h-9 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                      Synthesize & Reflect
                    </h2>
                    <p className="text-base text-gray-600 font-light leading-relaxed max-w-3xl">
                      Agents synthesize recommendations from three independent sources (RL Engine, business rules, LLM reasoning), then reflect and critique the ensemble.
                    </p>
                  </div>
                </div>

                {/* Agent Ensemble Synthesis Feed */}
                {stage3Activities.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Ensemble Synthesis & Reflection</h3>
                      <span className="text-xs font-medium text-gray-600">{stage3Progress}% complete</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mb-3 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${stage3Progress}%` }}
                      />
                    </div>

                    {/* Current activity */}
                    {stage3Activities.length > 0 && (
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-6">
                        <div className="w-3 h-3 flex-shrink-0">
                          {stage3Progress < 100 ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-gray-900" />
                          )}
                        </div>
                        <span className="font-light">
                          {stage3Progress < 100 
                            ? `${stage3Activities[stage3Activities.length - 1].agent}: ${stage3Activities[stage3Activities.length - 1].activity}`
                            : "Ensemble synthesis complete"}
                        </span>
                      </div>
                    )}

                    {/* Detailed activity log - collapsible */}
                    <details className="bg-gray-50 rounded-xl overflow-hidden">
                      <summary className="px-6 py-4 cursor-pointer text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                        View Ensemble Synthesis Log ({stage3Activities.length} steps)
                      </summary>
                      <div className="px-6 py-4 space-y-2 max-h-64 overflow-y-auto">
                        {stage3Activities.map((activity, index) => {
                          const isComplete = activity.status === "completed" || 
                                           index < stage3Activities.length - 1 || 
                                           stage3Progress === 100;
                          
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                            >
                              {!isComplete ? (
                                <div className="w-3 h-3 mt-0.5 flex-shrink-0">
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-gray-900 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900">{activity.agent}</p>
                                <p className="text-xs text-gray-600 font-light">{activity.activity}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                )}

                {/* Ensemble Synthesis - Only show after synthesis completes */}
                {stage3Progress === 100 && (
                <>
                  <div className="mb-12">
                    <h3 className="text-base font-semibold text-gray-900 mb-6">Ensemble Recommendation Synthesis</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 py-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">RL-based NBA Engine</p>
                          <p className="text-sm text-gray-600 font-light">Suggests {hcpId === "1" ? "efficacy repositioning + safety protocol" : "PA fast-track + copay foundation enrollment"} based on historical outcomes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 py-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">Business Rules Engine</p>
                          <p className="text-sm text-gray-600 font-light">Validates {hcpId === "1" ? "REMS compliance + formulary approval" : "payer coverage requirements + reimbursement pathways"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 py-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">LLM Contextual Reasoning</p>
                          <p className="text-sm text-gray-600 font-light">Synthesizes {hcpId === "1" ? "clinical evidence + KOL positioning" : "payer negotiation strategy + MSL deployment timing"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Recommendation */}
                  <div className="bg-gray-50 rounded-2xl p-8 mb-12">
                    <p className="text-base text-gray-900 leading-relaxed">
                      {hcpId === "1" 
                        ? "Deploy 3-pronged strategy: (1) MSL-led safety protocol education, (2) Efficacy repositioning based on ORION-Y data, (3) KOL collaboration for clinical best practices. Traditional tools would miss the dual-causality pattern requiring coordinated safety + efficacy response."
                        : "Deploy urgent access intervention: (1) PA escalation SWAT team with 48hr SLA, (2) Auto-enroll eligible patients in $0 copay foundation, (3) Specialty pharmacy fast-track with 3-day fulfillment, (4) Deploy reimbursement specialist. Traditional tools would flag Rx decline but miss the multi-payer policy causality requiring coordinated access strategy."}
                    </p>
                  </div>
                </>
                )}

                {/* Human SME Input */}
                <div className="mb-8">
                  <label htmlFor="stage3-input" className="block text-sm font-medium text-gray-900 mb-3">
                    Your Input (Optional)
                  </label>
                  <p className="text-sm text-gray-600 font-light mb-4">
                    Refine recommendations, add constraints, or prioritize specific actions
                  </p>
                  <textarea
                    id="stage3-input"
                    value={stage3Input}
                    onChange={(e) => setStage3Input(e.target.value)}
                    placeholder="Example: 'Prioritize copay assistance first - fastest ROI' or 'Add HCP preference for digital-first engagement in recommendations'"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm font-light transition-all"
                    rows={4}
                    data-testid="input-stage3-sme"
                  />
                  {stage3Input && (
                    <p className="text-xs text-gray-500 mt-2">
                      ✓ Your guidance will be incorporated into final action plan
                    </p>
                  )}
                </div>

                {/* Human Final Approval */}
                <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setStage3Complete(true);
                      setHypothesisConfirmed(true);
                      setWizardStage('complete');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm font-medium"
                    data-testid="button-approve-stage3"
                  >
                    Approve & Execute Plan
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* DEEP DIVE: Timeline Chart - Only after confirmation */}
            {hypothesisConfirmed && (
              <div className="mb-16">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Deep Dive Analysis</h3>
                <Card className="border border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Temporal Signal Correlation</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={[
                        { month: "Jan", oncoPro: 12, nephroX: 0, label: "Jan" },
                        { month: "Feb", oncoPro: 12, nephroX: 0, label: "Feb" },
                        { month: "Mar", oncoPro: 12, nephroX: 0, label: "Mar" },
                        { month: "Apr", oncoPro: 12, nephroX: 0, label: "Apr" },
                        { month: "May", oncoPro: 12, nephroX: 0, label: "May" },
                        { month: "Jun", oncoPro: 11, nephroX: 1, label: "Jun", conference: true },
                        { month: "Jul", oncoPro: 7, nephroX: 5, label: "Jul" },
                        { month: "Aug", oncoPro: 5, nephroX: 7, label: "Aug", adverseEvents: true },
                        { month: "Sep", oncoPro: 3, nephroX: 9, label: "Sep" },
                        { month: "Oct", oncoPro: 3, nephroX: 9, label: "Oct" }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        label={{ value: 'Patient Count', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                        domain={[0, 12]}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      
                      {/* Onco-Pro Rx Decline */}
                      <Line 
                        type="monotone" 
                        dataKey="oncoPro" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#2563eb' }}
                        name="Onco-Pro"
                      />
                      
                      {/* Nephro-X Rx Increase */}
                      <Line 
                        type="monotone" 
                        dataKey="nephroX" 
                        stroke="#9333ea" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#9333ea' }}
                        name="Nephro-X"
                      />
                      
                      {/* Signal 2: ASCO Conference (Jun) */}
                      <ReferenceLine 
                        x="Jun" 
                        stroke="#dc2626" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      >
                        <ChartLabel 
                          value="ASCO Conference" 
                          position="top" 
                          style={{ fill: '#dc2626', fontSize: 11, fontWeight: 600 }}
                          offset={10}
                        />
                      </ReferenceLine>
                      
                      {/* Signal 3: Adverse Events Cluster (Aug) */}
                      <ReferenceLine 
                        x="Aug" 
                        stroke="#ea580c" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      >
                        <ChartLabel 
                          value="Adverse Events" 
                          position="top" 
                          style={{ fill: '#ea580c', fontSize: 11, fontWeight: 600 }}
                          offset={10}
                        />
                      </ReferenceLine>
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-6 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-blue-600" />
                      <span className="text-gray-700">Onco-Pro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-purple-600" />
                      <span className="text-gray-700">Nephro-X (Competitor)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 border-t-2 border-dashed border-red-600" />
                      <span className="text-gray-700">ASCO Conference</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 border-t-2 border-dashed border-orange-600" />
                      <span className="text-gray-700">Adverse Events</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-6 leading-relaxed">
                  <strong className="text-gray-900">Temporal Correlation:</strong> All 12 patients on Onco-Pro Jan-May, then switching begins post-ASCO (Jun). By October, 9 patients switched to Nephro-X while 3 remained on Onco-Pro — demonstrating 75% switching rate across dual patient cohorts.
                </p>
              </CardContent>
            </Card>
              </div>
            )}
          </div>
        )}

        {/* Cohort Analysis - Only after hypothesis confirmation */}
        {prescriptionHistory.length > 0 && hypothesisConfirmed && (
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Patient Cohort Analysis
              </h2>
              <Badge className="bg-blue-600 text-white text-xs px-3 py-1">
                Deep Dive
              </Badge>
            </div>
            <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
              {hcpId === "1" 
                ? "Agents identified two distinct patient cohorts with different switching drivers—young RCC patients responding to efficacy signals, and CV-risk patients responding to safety concerns."
                : "Agents identified distinct patient cohorts with different access barrier patterns—copay shock, PA denials, and fulfillment delays driving switches, while smooth-access patients remained stable."}
            </p>
            <CohortSwitchingChart
              prescriptionHistory={prescriptionHistory}
              patients={patients}
              clinicalEvents={clinicalEvents}
              productName="Onco-Pro"
            />
          </div>
        )}

        {/* Strategy Recommendations CTA */}
        {canShowStrategies && (
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-12">
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                  AI Strategies Ready
                </h3>
                <p className="text-base text-gray-600 mb-8 font-light leading-relaxed">
                  View your personalized ensemble strategy recommendations generated from proven root causes
                </p>
                <Link href={`/hcp/${hcpId}/strategies`}>
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    data-testid="button-view-strategies"
                  >
                    View Strategy Recommendations
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
