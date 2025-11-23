import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CohortSwitchingChart } from "@/components/CohortSwitchingChart";
import { ComparativePrescriptionTrends } from "@/components/ComparativePrescriptionTrends";
import {
  ArrowLeft,
  Brain,
  MapPin,
  ChevronRight,
  Lightbulb,
  UserCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";

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

export default function HCPDetail() {
  const [, params] = useRoute("/hcp/:id");
  const hcpId = params?.id;

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

        {/* Comparative Prescription Trends */}
        {prescriptionTrends.length > 0 && (
          <div className="mb-24">
            <ComparativePrescriptionTrends 
              hcpName={hcp.name}
              prescriptionData={prescriptionTrends}
            />
          </div>
        )}

        {/* Traditional NBA Alert (Surface-Level View) */}
        {hcp.switchRiskScore > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Traditional NBA Alert
              </h2>
              <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                Rule-Based Approach
              </Badge>
              {hasInvestigation && isConfirmed && (
                <Badge className="bg-red-100 text-red-900 border-red-200 text-xs px-2.5 py-1">
                  Insufficient
                </Badge>
              )}
            </div>
            <Card className="border border-gray-300 bg-gray-50">
              <CardContent className="p-8">
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Risk Score</div>
                    <div className="text-2xl font-semibold text-gray-900">{hcp.switchRiskScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Engagement</div>
                    <div className="text-2xl font-semibold text-gray-900 capitalize">{hcp.engagementLevel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Institution</div>
                    <div className="text-2xl font-semibold text-gray-900">Tier-1</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Competitor Share</div>
                    <div className="text-2xl font-semibold text-gray-900">+15%</div>
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-6">
                  <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Generic Recommendation</div>
                  <p className="text-base text-gray-700 italic font-light">
                    "Schedule clinical lunch-and-learn to review latest product efficacy data. Priority: Medium."
                  </p>
                </div>
              </CardContent>
            </Card>
            {hasInvestigation && isConfirmed && (
              <div className="mt-6 p-6 bg-white border-l-4 border-red-600">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">What This One-Size-Fits-All Approach Missed</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Traditional rule-based NBA systems treat all switching as a monolithic "competitor threat" event. 
                      Autonomous causal investigation revealed <strong className="text-gray-900">two distinct, independent switching patterns</strong> across different patient cohorts, 
                      each driven by separate clinical triggers (efficacy signal vs. safety signal) requiring <strong>fundamentally different interventions</strong>. 
                      A generic "lunch-and-learn" would have failed to address either root cause effectively.
                    </p>
                  </div>
                </div>
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

        {/* Cohort Analysis */}
        {prescriptionHistory.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
              Cohort Analysis
            </h2>
            <CohortSwitchingChart
              prescriptionHistory={prescriptionHistory}
              patients={patients}
              clinicalEvents={clinicalEvents}
              productName="OncoDrug"
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
