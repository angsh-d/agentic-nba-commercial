import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentReasoningPanel } from "@/components/AgentReasoningPanel";
import { 
  ArrowLeft,
  Activity,
  MapPin,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
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

async function fetchHCP(id: string): Promise<HCP> {
  const response = await fetch(`/api/hcps/${id}`);
  if (!response.ok) throw new Error("Failed to fetch HCP");
  return response.json();
}

async function generateNBA(hcpId: number) {
  const response = await fetch("/api/ai/auto-generate-nbas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hcpIds: [hcpId] }),
  });
  if (!response.ok) throw new Error("Failed to generate NBA");
  return response.json();
}

function getRiskLevel(tier: string, score: number) {
  if (tier === "critical" || score >= 70) return { label: "High Risk", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" };
  if (tier === "medium" || score >= 40) return { label: "Medium Risk", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" };
  return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" };
}

function getEngagementLabel(level: string) {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  if (level === "low") return "Low";
  return "Not Set";
}

function calculateAccountAge(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
}

async function fetchPrescriptionHistory(hcpId: string) {
  const response = await fetch(`/api/prescription-history/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch prescription history");
  return response.json();
}

export default function HCPDetail() {
  const [, params] = useRoute("/hcp/:id");
  const hcpId = params?.id;
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
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

  const generateMutation = useMutation({
    mutationFn: () => generateNBA(Number(hcpId)),
    onSuccess: (data) => {
      if (data.sessions && data.sessions.length > 0) {
        const sessionId = data.sessions[0].sessionId;
        setActiveSessionId(sessionId);
        toast.success("AI Analysis Started", {
          description: "Watch live agent reasoning below",
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to start analysis", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading HCP details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-gray-600">HCP not found</p>
        </div>
      </div>
    );
  }

  const risk = getRiskLevel(hcp.switchRiskTier, hcp.switchRiskScore);
  const accountAge = calculateAccountAge(hcp.createdAt);
  const hasSwitchRisk = hcp.switchRiskScore > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Back Button */}
        <Link href="/">
          <Button 
            variant="ghost" 
            className="mb-8 -ml-2 text-gray-600 hover:text-gray-900"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Territory
          </Button>
        </Link>

        {/* HCP Header */}
        <Card className="mb-8 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-gray-200">
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {hcp.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <CardTitle className="text-3xl text-gray-900">
                      {hcp.name}
                    </CardTitle>
                    <Badge 
                      className={`${risk.bgColor} ${risk.textColor} border-0 px-4 py-1.5 text-sm`}
                      data-testid="badge-risk"
                    >
                      {risk.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-base text-gray-600">
                    <span className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      {hcp.specialty}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {hcp.hospital}, {hcp.territory}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {hcp.switchRiskScore}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">
                  Switch Risk Score
                </div>
              </div>
            </div>
          </CardHeader>

          {hasSwitchRisk && (
            <CardContent className="border-t border-gray-200">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Risk Factors</h4>
                <div className="space-y-3">
                  {hcp.switchRiskReasons?.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <p className="text-base text-gray-700 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
          
          <CardContent className="border-t border-gray-200">
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                  Engagement
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getEngagementLabel(hcp.engagementLevel)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                  Account Age
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {accountAge}m
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                  Last Contact
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor((Date.now() - new Date(hcp.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))}d
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                  Territory
                </div>
                <div className="text-base font-bold text-gray-900">
                  {hcp.territory.split(' ')[0]}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescription History Trends */}
        {prescriptionHistory.length > 0 && (
          <Card className="mb-8 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Prescription Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Our Product */}
                {prescriptionHistory.filter((p: any) => p.isOurProduct === 1).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Our Product (Onco-Pro)</h4>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          {hcp.switchRiskReasons?.find((r: string) => r.includes('decline'))?.match(/-?\d+%/)?.[0] || 'Declining'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {prescriptionHistory
                        .filter((p: any) => p.isOurProduct === 1)
                        .sort((a: any, b: any) => a.month.localeCompare(b.month))
                        .map((p: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              {new Date(p.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-3xl font-bold text-blue-600">{p.prescriptionCount}</div>
                            <div className="text-xs text-gray-500 mt-1">prescriptions</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Competitor Products */}
                {prescriptionHistory.filter((p: any) => p.isOurProduct === 0).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Competitor Products</h4>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">
                          {hcp.switchRiskReasons?.find((r: string) => r.includes('competitor'))?.match(/\+?\d+%/)?.[0] || 'Increasing'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {prescriptionHistory
                        .filter((p: any) => p.isOurProduct === 0)
                        .sort((a: any, b: any) => a.month.localeCompare(b.month))
                        .map((p: any, idx: number) => (
                          <div key={idx} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              {new Date(p.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-3xl font-bold text-orange-600">{p.prescriptionCount}</div>
                            <div className="text-xs text-gray-500 mt-1">prescriptions</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate NBA Button - Only show for HCPs with risk */}
        {!activeSessionId && hcp.switchRiskScore > 0 && (
          <div className="mb-8 flex justify-center">
            <Button
              size="lg"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg rounded-2xl"
              data-testid="button-generate-nba"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3" />
                  Generate AI-Powered Next Best Action
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Low Risk Message */}
        {!activeSessionId && hcp.switchRiskScore === 0 && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Action Required</h3>
                <p className="text-base text-gray-600">
                  This provider has stable prescription patterns with no switching risk detected.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Reasoning Panel */}
        {activeSessionId && (
          <div className="mb-8">
            <AgentReasoningPanel 
              sessionId={activeSessionId}
              onClose={() => setActiveSessionId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
