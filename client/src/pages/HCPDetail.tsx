import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentReasoningPanel } from "@/components/AgentReasoningPanel";
import { EventTimeline } from "@/components/EventTimeline";
import {
  ArrowLeft,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  Brain,
  Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

interface NBAResults {
  hasResults: boolean;
  session?: any;
  thoughts?: any[];
  actions?: any[];
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

async function triggerNBAGeneration(hcpId: number) {
  const response = await fetch(`/api/ai/generate-nba/${hcpId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to generate NBA");
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
    return { label: "Critical Risk", className: "bg-red-500 text-white" };
  if (tier === "medium" || score >= 40)
    return { label: "Medium Risk", className: "bg-yellow-500 text-white" };
  return { label: "Low Risk", className: "bg-green-500 text-white" };
}

export default function HCPDetail() {
  const [, params] = useRoute("/hcp/:id");
  const hcpId = params?.id;
  const [showReasoningPanel, setShowReasoningPanel] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

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

  const { data: nbaResults, refetch: refetchResults } = useQuery({
    queryKey: ["nba-results", hcpId],
    queryFn: () => fetchNBAResults(hcpId!),
    enabled: !!hcpId,
    refetchInterval: (query) => {
      // Keep polling if session is in progress
      const data = query.state.data;
      if (data?.session?.status === "in_progress") {
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => triggerNBAGeneration(Number(hcpId)),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      toast.success("AI Analysis Started", {
        description: "Generating contextual insights...",
      });
      // Start refetching results
      refetchResults();
    },
  });

  // Auto-trigger generation if no results exist
  useEffect(() => {
    if (hcp && hcp.switchRiskScore > 0 && nbaResults && !nbaResults.hasResults && !generateMutation.isPending) {
      generateMutation.mutate();
    }
  }, [hcp, nbaResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-lg text-gray-600 font-medium">Loading insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="container mx-auto px-12 py-16">
          <p className="text-center text-gray-600">HCP not found</p>
        </div>
      </div>
    );
  }

  const risk = getRiskBadge(hcp.switchRiskTier, hcp.switchRiskScore);
  const isGenerating = generateMutation.isPending || nbaResults?.session?.status === "in_progress";

  // Extract narrative content from agent thoughts
  const getHCPContextSummary = () => {
    if (!nbaResults?.thoughts) return null;
    const plannerThoughts = nbaResults.thoughts.filter((t: any) => t.agentType === "planner");
    return plannerThoughts[0]?.content || null;
  };

  const getKeyInsights = () => {
    if (!nbaResults?.thoughts) return [];
    const analystThoughts = nbaResults.thoughts.filter((t: any) => t.agentType === "analyst");
    if (analystThoughts.length === 0) return [];

    // Try to parse the thought content as JSON to extract findings
    try {
      const content = analystThoughts[0]?.content;
      if (content && content.includes("{")) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return data.keyFindings || [];
        }
      }
    } catch (e) {
      console.log("Could not parse analyst findings");
    }
    return [];
  };

  const contextSummary = getHCPContextSummary();
  const keyInsights = getKeyInsights();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <main className="container mx-auto px-12 py-16 max-w-7xl">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-12 -ml-2 text-gray-500 hover:text-gray-900 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Territory
          </Button>
        </Link>

        {/* Hero Section - HCP Context */}
        <div className="mb-16 space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-8">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {hcp.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-4">
                <div>
                  <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
                    {hcp.name}
                  </h1>
                  <div className="flex items-center gap-4 text-lg text-gray-600">
                    <span className="font-medium">{hcp.specialty}</span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {hcp.hospital}
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {hcp.territory}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hcp.switchRiskScore > 0 && (
              <div className="text-right">
                <div className="text-7xl font-bold text-gray-900 mb-2">
                  {hcp.switchRiskScore}
                </div>
                <Badge className={`${risk.className} px-4 py-2 text-sm font-semibold uppercase tracking-wide`}>
                  {risk.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Context Summary - Phase 1 Enrichment */}
          {contextSummary && (
            <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 backdrop-blur-xl shadow-lg">
              <CardContent className="p-10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      AI Context Summary
                    </h3>
                    <p className="text-base leading-relaxed text-gray-700">
                      {contextSummary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isGenerating && !contextSummary && (
            <Card className="border-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 backdrop-blur-xl shadow-lg">
              <CardContent className="p-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Generating AI Insights
                    </h3>
                    <p className="text-base text-gray-600">
                      Our AI agents are analyzing prescription patterns, risk factors, and market context...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Investigation Hub CTA */}
        <div className="mb-16">
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-blue-50 to-white shadow-xl overflow-hidden">
            <CardContent className="p-12">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        Autonomous Causal Investigation
                      </h2>
                      <p className="text-base text-gray-600 mt-1">
                        Multi-agent AI system with hypothesis generation & evidence gathering
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed max-w-3xl">
                    Launch our autonomous investigation engine to discover <span className="font-semibold">root causes</span> of switching behavior.
                    The AI will generate multiple competing hypotheses, gather evidence from clinical data and external sources,
                    test each hypothesis objectively, and identify proven causal factors with confidence scores.
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <Link href={`/hcp/${hcpId}/investigate`}>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-base shadow-lg"
                        data-testid="button-launch-investigation"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Launch Investigation
                      </Button>
                    </Link>
                    <div className="text-sm text-gray-500">
                      <div className="font-medium">Key Features:</div>
                      <div className="text-xs">Multi-hypothesis reasoning • Evidence scoring • Autonomous pruning</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Timeline & Causal Analysis */}
        {(clinicalEvents.length > 0 || patients.length > 0) && (
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
              Causal Analysis Timeline
            </h2>
            <EventTimeline events={clinicalEvents} patients={patients} />
          </div>
        )}

        {/* Prescription Trends */}
        {prescriptionHistory.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
              Prescription Trends
            </h2>
            <div className="grid grid-cols-2 gap-8">
              {/* Our Product */}
              {prescriptionHistory.filter((p: any) => p.isOurProduct === 1).length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Our Product</h3>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        <span className="text-lg font-semibold text-red-600">
                          {hcp.switchRiskReasons?.find((r: string) => r.includes("decline"))?.match(/-?\d+%/)?.[0] || "Declining"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {prescriptionHistory
                        .filter((p: any) => p.isOurProduct === 1)
                        .sort((a: any, b: any) => a.month.localeCompare(b.month))
                        .map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                              {new Date(p.month + "-01").toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                              {p.prescriptionCount}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competitor Products */}
              {prescriptionHistory.filter((p: any) => p.isOurProduct === 0).length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Competitors</h3>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        <span className="text-lg font-semibold text-orange-600">
                          {hcp.switchRiskReasons?.find((r: string) => r.includes("competitor"))?.match(/\+?\d+%/)?.[0] || "Increasing"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {prescriptionHistory
                        .filter((p: any) => p.isOurProduct === 0)
                        .sort((a: any, b: any) => a.month.localeCompare(b.month))
                        .map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                              {new Date(p.month + "-01").toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-2xl font-bold text-orange-600">
                              {p.prescriptionCount}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {hcp.switchRiskReasons && hcp.switchRiskReasons.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
              Risk Factors
            </h2>
            <div className="space-y-4">
              {hcp.switchRiskReasons.map((reason: string, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-red-500 border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-base text-gray-700 leading-relaxed">{reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Next Best Action - Phase 1 Primary Output */}
        {nbaResults?.nba && (
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
              Recommended Next Best Action
            </h2>
            <Card className="border-0 bg-gradient-to-br from-indigo-50 to-purple-50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-12">
                <div className="space-y-8">
                  {/* Action Header */}
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl flex-shrink-0">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <Badge className="mb-4 bg-indigo-600 text-white px-4 py-1 text-sm font-semibold uppercase tracking-wide">
                        {nbaResults.nba.priority} Priority • {nbaResults.nba.actionType}
                      </Badge>
                      <h3 className="text-3xl font-semibold text-gray-900 mb-4 leading-tight">
                        {nbaResults.nba.action}
                      </h3>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {nbaResults.nba.reason}
                      </p>
                    </div>
                  </div>

                  {/* AI Insight */}
                  {nbaResults.nba.aiInsight && (
                    <div className="p-6 bg-white/60 rounded-2xl border border-indigo-100">
                      <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-3">
                        AI Insight
                      </h4>
                      <p className="text-base text-gray-700 leading-relaxed">
                        {nbaResults.nba.aiInsight}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Key Insights from Evidence Analysis */}
        {keyInsights.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
              Key Insights
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {keyInsights.map((insight: string, idx: number) => (
                <Card key={idx} className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-lg">💡</span>
                      </div>
                      <p className="text-base text-gray-700 leading-relaxed">{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Optional: View AI Reasoning Process */}
        {(nbaResults?.session || sessionId) && (
          <div className="mb-16">
            <Button
              variant="outline"
              onClick={() => setShowReasoningPanel(!showReasoningPanel)}
              className="w-full py-6 text-base font-medium bg-white/60 backdrop-blur-sm hover:bg-white/80 border-gray-200"
              data-testid="button-toggle-reasoning"
            >
              <Eye className="w-5 h-5 mr-3" />
              {showReasoningPanel ? "Hide" : "View"} AI Reasoning Process
              {showReasoningPanel ? (
                <ChevronUp className="w-5 h-5 ml-3" />
              ) : (
                <ChevronDown className="w-5 h-5 ml-3" />
              )}
            </Button>

            {showReasoningPanel && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <AgentReasoningPanel
                  sessionId={sessionId || nbaResults?.session?.id}
                  onClose={() => setShowReasoningPanel(false)}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
