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
  UserCheck,
  Eye,
  Activity,
  Sparkles,
  Search,
  Target
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label as ChartLabel } from 'recharts';
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

        {/* Multi-Signal Investigation */}
        {hcpId === "1" && (
          <div className="mb-24">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                  Multi-Signal Investigation
                </h2>
                <Badge className="bg-blue-600 text-white text-xs px-3 py-1">
                  Agent-Discovered
                </Badge>
              </div>
            </div>

            {/* Investigation Context */}
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">How Agents Discovered This Pattern</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Observer detected a 75% switching rate across 12 patients between June-October. 
                    Correlator identified two distinct temporal clusters: 5 young RCC patients switching post-ASCO conference (June 15) and 4 CV-risk patients switching after cardiac adverse events (August). 
                    Planner determined these represent independent causal pathways—one efficacy-driven, one safety-driven—rather than a single switching cause.
                  </p>
                </div>
              </div>
            </div>

            {/* Investigation Journey Steps */}
            <Card className="border border-gray-200 mb-8">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Investigation Journey</h3>
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Eye className="w-5.5 h-5.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1.5">Signal Detection</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <strong>Observer Agent:</strong> Detected 3 correlated signals across prescription history, clinical events, and peer networks
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Activity className="w-5.5 h-5.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1.5">Temporal Correlation</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <strong>Correlator Agent:</strong> Cross-referenced 12 patients over 6 months revealing dual switching clusters post-ASCO conference
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Target className="w-5.5 h-5.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1.5">Multi-Hypothesis Investigation</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <strong>Planner & Gatherer Agents:</strong> Identified dual independent drivers: efficacy concerns in young RCC cohort + safety mitigation in CV-risk patients
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Chart */}
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
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Patient Cohort Analysis
              </h2>
              <Badge className="bg-blue-600 text-white text-xs px-3 py-1">
                Agent-Discovered
              </Badge>
            </div>
            <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
              Agents identified two distinct patient cohorts with different switching drivers—young RCC patients responding to efficacy signals, and CV-risk patients responding to safety concerns.
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
