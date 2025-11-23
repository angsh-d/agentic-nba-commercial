import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CohortSwitchingChart } from "@/components/CohortSwitchingChart";
import { EnsembleNBAPanel } from "@/components/EnsembleNBAPanel";
import {
  ArrowLeft,
  Brain,
  MapPin,
  ChevronRight,
  Lightbulb
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
}

interface NBAResults {
  hasResults: boolean;
  session?: any;
  nba?: any;
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

async function fetchNBAResults(hcpId: string): Promise<NBAResults> {
  const response = await fetch(`/api/ai/nba-results/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch NBA results");
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

  const { data: nbaResults } = useQuery({
    queryKey: ["nba-results", hcpId],
    queryFn: () => fetchNBAResults(hcpId!),
    enabled: !!hcpId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-center text-gray-500">Provider not found</p>
        </div>
      </div>
    );
  }

  const hasInvestigation = investigationResults?.hasInvestigation;
  const provenHypotheses = investigationResults?.provenHypotheses || [];
  
  // Only show strategies if investigation is complete AND has proven hypotheses
  const canShowStrategies = hasInvestigation && provenHypotheses.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-8 -ml-3 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">
                {hcp.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{hcp.specialty}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hcp.hospital}
                </span>
              </div>
            </div>

            {hcp.switchRiskScore > 0 && (
              <div className="text-right">
                <div className="text-5xl font-semibold text-gray-900 mb-2">
                  {hcp.switchRiskScore}
                </div>
                {getRiskBadge(hcp.switchRiskTier, hcp.switchRiskScore)}
              </div>
            )}
          </div>
        </div>

        {/* Investigation CTA */}
        <div className="mb-12">
          <Card className="border border-gray-200 bg-white hover:border-gray-900 hover:shadow-md transition-all duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-gray-900" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Autonomous Causal Investigation
                    </h2>
                    {hasInvestigation && (
                      <Badge className="bg-gray-900 text-white text-xs px-2.5 py-0.5">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    {hasInvestigation 
                      ? `Investigation complete with ${provenHypotheses.length} proven ${provenHypotheses.length === 1 ? 'hypothesis' : 'hypotheses'}`
                      : "AI-powered multi-hypothesis testing with evidence gathering to discover root causes of switching behavior"
                    }
                  </p>
                </div>
                <Link href={`/hcp/${hcpId}/investigate`}>
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    data-testid="button-launch-investigation"
                  >
                    {hasInvestigation ? "View Investigation" : "Launch Investigation"}
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

        {/* Strategy Recommendations - Only show if investigation is complete with proven hypotheses */}
        {canShowStrategies && nbaResults?.nba && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
              AI-Generated Strategy Recommendations
            </h2>
            <EnsembleNBAPanel 
              nba={nbaResults.nba} 
              provenHypotheses={provenHypotheses}
            />
          </div>
        )}

        {/* Placeholder - Investigation needed for strategies */}
        {!hasInvestigation && hcp.switchRiskScore > 0 && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12">
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Lightbulb className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Complete Causal Investigation First
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  AI-generated strategy recommendations will appear here after you complete the autonomous causal investigation to identify proven root causes of switching behavior.
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
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
