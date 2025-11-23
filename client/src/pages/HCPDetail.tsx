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
import { useState } from "react";

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

  const { data: hcp, isLoading } = useQuery({
    queryKey: ["hcp", hcpId],
    queryFn: () => fetchHCP(hcpId!),
    enabled: !!hcpId,
  });

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

  const { data: investigationResults } = useQuery({
    queryKey: ["investigation-results", hcpId],
    queryFn: () => fetchInvestigationResults(hcpId!),
    enabled: !!hcpId,
  });

  const { data: prescriptionTrends = [] } = useQuery({
    queryKey: ["prescription-trends", hcpId],
    queryFn: async () => {
      const response = await fetch(`/api/hcps/${hcpId}/prescription-trends`);
      if (!response.ok) return [];
      return response.json();
    },
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

        {/* Header */}
        <div className="mb-20">
          <div className="flex items-start justify-between mb-8">
            <div>
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

            {hcp.switchRiskScore > 0 && (
              <div className="text-right">
                <div className="text-6xl font-semibold text-gray-900 mb-3 tracking-tight">
                  {hcp.switchRiskScore}
                </div>
                {getRiskBadge(hcp.switchRiskTier, hcp.switchRiskScore)}
              </div>
            )}
          </div>
        </div>

        {/* PROGRESSIVE WIZARD - Multi-Agent Investigation */}
        {hcp.switchRiskScore > 0 && hcpId && (
          <div className="mb-24">
            {/* Wizard Header with Progress */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                    Agentic Investigation
                  </h2>
                  <p className="text-base text-gray-600 font-light">
                    Progressive multi-agent analysis with human oversight
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white px-4 py-2">
                  Stage {wizardStage} of 3
                </Badge>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1 rounded-full transition-all ${wizardStage >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-all ${wizardStage >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-all ${wizardStage >= 3 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span className={wizardStage >= 1 ? 'text-blue-600 font-medium' : ''}>Observe</span>
                    <span className={wizardStage >= 2 ? 'text-purple-600 font-medium' : ''}>Investigate</span>
                    <span className={wizardStage >= 3 ? 'text-emerald-600 font-medium' : ''}>Synthesize</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 1: Observe & Correlate Signals */}
            {wizardStage === 1 && (
              <Card className="border-2 border-blue-600 shadow-lg mb-8">
                <CardContent className="p-10">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Observe & Correlate Signals</h3>
                        <Badge className="bg-blue-600 text-white">Family 1</Badge>
                      </div>
                      <p className="text-base text-gray-600 leading-relaxed">
                        AI agents are analyzing multiple data signals to detect switching patterns and anomalies impossible to find with traditional BI tools.
                      </p>
                    </div>
                  </div>

                  {/* Live Signal Processing */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Prescription Data Analysis</p>
                        <p className="text-xs text-gray-600">Detected 44% Rx decline (45→25) with temporal correlation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Call Notes Analysis</p>
                        <p className="text-xs text-gray-600">Processed {callNotes.length} field notes, identified {hcpId === "1" ? "safety concerns" : "access frustration"} pattern</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payer Communications</p>
                        <p className="text-xs text-gray-600">Analyzed {payerCommunications.length} payer docs, {hcpId === "1" ? "no formulary changes" : "found Tier 3 policy change Aug 1"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Patient Cohort Tracking</p>
                        <p className="text-xs text-gray-600">Identified {patients.filter(p => p.switchedToCompetitor === 1).length} patient switches across {hcpId === "1" ? "2 cohorts" : "4 access-barrier cohorts"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Finding */}
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="text-sm font-semibold">Key Anomaly Detected</h4>
                    </div>
                    <p className="text-base leading-relaxed">
                      {hcpId === "1" 
                        ? "Agents detected a 75% patient switch rate with dual causality: cardiac safety events correlating with switches in CV-risk patients + temporal proximity to ASCO conference affecting young RCC patients."
                        : "Agents detected 75% patient abandonment rate correlating precisely with Aug 1st multi-payer policy changes introducing Tier 3 step-edits and $450 copays across 4 patient cohorts."}
                    </p>
                  </div>

                  {/* Human Approval */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Signal correlation complete. Approve to proceed with causal investigation.
                    </p>
                    <Button
                      onClick={() => {
                        setStage1Complete(true);
                        setWizardStage(2);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-approve-stage1"
                    >
                      Approve & Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STAGE 2: Plan & Investigate Causality */}
            {wizardStage === 2 && (
              <Card className="border-2 border-purple-600 shadow-lg mb-8">
                <CardContent className="p-10">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Plan & Investigate Causality</h3>
                        <Badge className="bg-purple-600 text-white">Family 2</Badge>
                      </div>
                      <p className="text-base text-gray-600 leading-relaxed">
                        Agents decompose causal investigation into competing hypotheses, gather multi-signal evidence, and test each hypothesis systematically to eliminate confirmation bias.
                      </p>
                    </div>
                  </div>

                  {/* Hypothesis Summary */}
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
                  <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5" />
                      <h4 className="text-sm font-semibold">Root Causes Validated</h4>
                    </div>
                    <p className="text-base leading-relaxed">
                      {getHypothesesForHcp(hcpId).filter(h => h.status === "proven").length} proven hypotheses with {getHypothesesForHcp(hcpId).filter(h => h.status === "proven")[0]?.confidence || 90}% confidence: {getHypothesesForHcp(hcpId).filter(h => h.status === "proven").map(h => h.text.split(' - ')[0]).join(", ")}
                    </p>
                  </div>

                  {/* Human Approval */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Causal investigation complete. Approve to synthesize recommendations.
                    </p>
                    <Button
                      onClick={() => {
                        setStage2Complete(true);
                        setWizardStage(3);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      data-testid="button-approve-stage2"
                    >
                      Approve & Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STAGE 3: Synthesize & Reflect */}
            {wizardStage === 3 && (
              <Card className="border-2 border-emerald-600 shadow-lg mb-8">
                <CardContent className="p-10">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Synthesize & Reflect</h3>
                        <Badge className="bg-emerald-600 text-white">Family 3</Badge>
                      </div>
                      <p className="text-base text-gray-600 leading-relaxed">
                        Agents synthesize recommendations from three independent sources (RL-based NBA Engine, business rules, LLM reasoning), then reflect and critique the ensemble before final recommendation.
                      </p>
                    </div>
                  </div>

                  {/* Ensemble Synthesis */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Ensemble Recommendation Synthesis</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                        <Brain className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">RL-based NBA Engine</p>
                          <p className="text-xs text-gray-600">Suggests {hcpId === "1" ? "efficacy repositioning + safety protocol" : "PA fast-track + copay foundation enrollment"} based on historical outcomes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                        <Activity className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">Business Rules Engine</p>
                          <p className="text-xs text-gray-600">Validates {hcpId === "1" ? "REMS compliance + formulary approval" : "payer coverage requirements + reimbursement pathways"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">LLM Contextual Reasoning</p>
                          <p className="text-xs text-gray-600">Synthesizes {hcpId === "1" ? "clinical evidence + KOL positioning" : "payer negotiation strategy + MSL deployment timing"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Self-Reflection */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Self-Reflection & Critique</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>All three recommendation sources aligned on primary intervention strategy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Evidence-to-action mapping validated with {getHypothesesForHcp(hcpId).filter(h => h.status === "proven")[0]?.confidence || 90}% confidence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Temporal urgency: immediate intervention required within {hcpId === "1" ? "14" : "7"} days</span>
                      </li>
                    </ul>
                  </div>

                  {/* Final Recommendation */}
                  <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="text-sm font-semibold">Ensemble Recommendation</h4>
                    </div>
                    <p className="text-base leading-relaxed">
                      {hcpId === "1" 
                        ? "Deploy 3-pronged strategy: (1) MSL-led safety protocol education, (2) Efficacy repositioning based on ORION-Y data, (3) KOL collaboration for clinical best practices. Traditional tools would miss the dual-causality pattern requiring coordinated safety + efficacy response."
                        : "Deploy urgent access intervention: (1) PA escalation SWAT team with 48hr SLA, (2) Auto-enroll eligible patients in $0 copay foundation, (3) Specialty pharmacy fast-track with 3-day fulfillment, (4) Deploy reimbursement specialist. Traditional tools would flag Rx decline but miss the multi-payer policy causality requiring coordinated access strategy."}
                    </p>
                  </div>

                  {/* Human Final Approval */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Review complete ensemble recommendation and approve to unlock deep dive analysis.
                    </p>
                    <Button
                      onClick={() => {
                        setStage3Complete(true);
                        setHypothesisConfirmed(true);
                        setWizardStage('complete');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid="button-approve-stage3"
                    >
                      Approve Recommendation
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

        {/* Investigation CTA */}
        <div className="mb-20">
          <Card className="border border-gray-200 bg-gray-50 hover:border-gray-900 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-gray-900" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Autonomous Causal Investigation
                    </h2>
                    {hasInvestigation && !isConfirmed && (
                      <Badge className="bg-gray-600 text-white text-xs px-2.5 py-0.5">
                        Awaiting Confirmation
                      </Badge>
                    )}
                    {isConfirmed && (
                      <Badge className="bg-gray-900 text-white text-xs px-2.5 py-0.5">
                        Confirmed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    {!hasInvestigation && "AI-powered multi-hypothesis testing with evidence gathering to discover root causes of switching behavior"}
                    {hasInvestigation && !isConfirmed && `Investigation found ${provenHypotheses.length} proven ${provenHypotheses.length === 1 ? 'hypothesis' : 'hypotheses'} - review and confirm to generate strategies`}
                    {isConfirmed && `${confirmedHypotheses.length} root ${confirmedHypotheses.length === 1 ? 'cause' : 'causes'} confirmed by SME`}
                  </p>
                </div>
                <Link href={`/hcp/${hcpId}/investigate`}>
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    data-testid="button-launch-investigation"
                  >
                    {!hasInvestigation && "Launch Investigation"}
                    {hasInvestigation && !isConfirmed && "Review & Confirm"}
                    {isConfirmed && "View Investigation"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Placeholder - Investigation or confirmation needed for strategies */}
        {!canShowStrategies && hcp.switchRiskScore > 0 && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12">
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Lightbulb className="w-8 h-8 text-gray-400" />
                </div>
                {!hasInvestigation && (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Complete Causal Investigation First
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      AI-generated strategy recommendations will appear after you complete the investigation and confirm root causes.
                    </p>
                    <Link href={`/hcp/${hcpId}/investigate`}>
                      <Button 
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                        data-testid="button-start-investigation-cta"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Start Investigation
                      </Button>
                    </Link>
                  </>
                )}
                {hasInvestigation && !isConfirmed && (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Confirm Root Causes
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Investigation identified {provenHypotheses.length} proven {provenHypotheses.length === 1 ? 'hypothesis' : 'hypotheses'}. Review and confirm findings to generate AI strategies.
                    </p>
                    <Link href={`/hcp/${hcpId}/investigate`}>
                      <Button 
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                        data-testid="button-confirm-investigation-cta"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Review & Confirm
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
