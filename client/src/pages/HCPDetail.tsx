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
  institution: string;
  location: string;
  riskScore: number;
  engagement: string;
  prescriptionTrend: string;
  accountAge: number;
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

function getRiskLevel(score: number) {
  if (score >= 70) return { label: "High Risk", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" };
  if (score >= 40) return { label: "Medium Risk", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" };
  return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" };
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

  const risk = getRiskLevel(hcp.riskScore);

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
                    {hcp.name.split(' ').map(n => n[0]).join('')}
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
                      {hcp.institution}, {hcp.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {hcp.riskScore}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">
                  Switch Risk Score
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  Engagement Level
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {hcp.engagement}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  Prescription Trend
                  {hcp.prescriptionTrend.includes("Decreasing") ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : hcp.prescriptionTrend.includes("Increasing") ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <Activity className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {hcp.prescriptionTrend}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  Account Age
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {hcp.accountAge} months
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate NBA Button - Only show for HCPs with risk */}
        {!activeSessionId && hcp.riskScore > 0 && (
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
        {!activeSessionId && hcp.riskScore === 0 && (
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
