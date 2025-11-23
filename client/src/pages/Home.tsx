import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertTriangle,
  MapPin,
  ChevronRight,
  Target,
  Search,
  Sparkles,
  CheckCircle2,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
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

interface AiInsight {
  id: number;
  hcpId: number;
  insightType: string;
  narrative: string;
  keySignals: string[];
  confidenceScore: number;
  generatedAt: string;
  expiresAt: string | null;
}

interface SignalData {
  signals: Array<{
    id: number;
    signalType: string;
    signalStrength: number;
    signalSource: string;
    signalDescription: string;
    contextData: Record<string, any>;
    detectedAt: string;
    status: string;
  }>;
  latestInsight: AiInsight | null;
}

async function fetchHCPs(): Promise<HCP[]> {
  const response = await fetch("/api/hcps");
  if (!response.ok) throw new Error("Failed to fetch HCPs");
  return response.json();
}

async function fetchSignalData(hcpId: number): Promise<SignalData> {
  const response = await fetch(`/api/signals/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch signal data");
  return response.json();
}

function getRiskBadge(tier: string, score: number) {
  if (tier === "high" || score >= 70) 
    return <Badge className="bg-gray-900 text-white text-xs px-2.5 py-0.5">High Risk</Badge>;
  if (tier === "medium" || score >= 40) 
    return <Badge className="bg-gray-600 text-white text-xs px-2.5 py-0.5">Medium Risk</Badge>;
  return <Badge className="bg-gray-300 text-gray-700 text-xs px-2.5 py-0.5">Low Risk</Badge>;
}

function AIInsightBadge({ hcpId, riskScore }: { hcpId: number; riskScore: number }) {
  // Only fetch signal data for HCPs with risk score > 0
  const { data: signalData } = useQuery({
    queryKey: ["signals", hcpId],
    queryFn: () => fetchSignalData(hcpId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: riskScore > 0, // Only fetch if HCP has risk
  });

  if (!signalData?.latestInsight || !signalData?.signals?.length) return null;

  const insight = signalData.latestInsight;
  const totalSignals = signalData.signals.length;
  const avgSignalStrength = signalData.signals.length > 0
    ? Math.round(signalData.signals.reduce((sum, s) => sum + s.signalStrength, 0) / signalData.signals.length)
    : 0;

  // Extract headline from narrative (first line if separated by double newline)
  const narrativeLines = insight.narrative.split('\n\n').filter(line => line.trim());
  const headline = narrativeLines.length > 1 
    ? narrativeLines[0] 
    : insight.narrative.substring(0, 80) + (insight.narrative.length > 80 ? '...' : '');
  const fullNarrative = narrativeLines.length > 1 
    ? narrativeLines.slice(1).join('\n\n') 
    : insight.narrative;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors text-xs font-medium border border-blue-200 hover:border-blue-300"
            data-testid={`ai-insight-badge-${hcpId}`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{totalSignals} Signal{totalSignals !== 1 ? 's' : ''}</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {headline}
          </DialogTitle>
          <DialogDescription className="sr-only">
            AI-generated risk insight
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Metrics */}
          <div className="flex items-center gap-6 pb-4 border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{totalSignals}</div>
              <div className="text-xs text-gray-500 mt-0.5">Signals Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">{avgSignalStrength}/100</div>
              <div className="text-xs text-gray-500 mt-0.5">Avg Strength</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{insight.confidenceScore}%</div>
              <div className="text-xs text-gray-500 mt-0.5">Confidence</div>
            </div>
          </div>

          {/* Narrative */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Analysis</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {fullNarrative}
            </p>
          </div>

          {/* Signal Types */}
          {signalData.signals.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Signals</h4>
              <div className="space-y-2">
                {signalData.signals.map((signal) => (
                  <div key={signal.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {signal.signalType.replace(/_/g, ' ')}
                      </span>
                      <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                        {signal.signalStrength}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{signal.signalDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<"switch_risk" | "all">("switch_risk");
  
  const { data: hcps = [], isLoading } = useQuery({
    queryKey: ["hcps"],
    queryFn: fetchHCPs,
  });

  // Filter based on view mode
  const displayedHcps = viewMode === "switch_risk" 
    ? hcps.filter(hcp => hcp.switchRiskScore > 0)
    : hcps;

  const atRiskCount = hcps.filter(hcp => hcp.switchRiskScore > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-7xl font-semibold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Territory Intelligence
            </h1>
            <p className="text-2xl text-gray-600 mb-12 leading-relaxed font-light">
              Autonomous AI agents discover why HCPs switch prescriptions and recommend the right action at the right time
            </p>
            
            {/* Agent Icons */}
            <div className="flex items-center justify-center gap-6 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-2 shadow-lg ring-1 ring-blue-500/20 overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent" />
                  <Target className="w-7 h-7 text-blue-600 relative z-10" />
                </div>
                <div className="text-[10px] text-gray-600 font-medium tracking-wide">Planner</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-2 shadow-lg ring-1 ring-blue-500/20 overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent" />
                  <Search className="w-7 h-7 text-blue-600 relative z-10" />
                </div>
                <div className="text-[10px] text-gray-600 font-medium tracking-wide">Gatherer</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-2 shadow-lg ring-1 ring-blue-500/20 overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent" />
                  <Sparkles className="w-7 h-7 text-blue-600 relative z-10" />
                </div>
                <div className="text-[10px] text-gray-600 font-medium tracking-wide">Synthesizer</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-2 shadow-lg ring-1 ring-blue-500/20 overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent" />
                  <CheckCircle2 className="w-7 h-7 text-blue-600 relative z-10" />
                </div>
                <div className="text-[10px] text-gray-600 font-medium tracking-wide">Reflector</div>
              </motion.div>
            </div>
            
            {/* View Toggle */}
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode("switch_risk")}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  viewMode === "switch_risk"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                data-testid="toggle-switch-risk"
              >
                Switch Risk ({isLoading ? "..." : atRiskCount})
              </button>
              <button
                onClick={() => setViewMode("all")}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  viewMode === "all"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                data-testid="toggle-all-hcps"
              >
                All HCPs ({isLoading ? "..." : hcps.length})
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* HCP List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        ) : displayedHcps.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">No providers found</p>
              <p className="text-sm text-gray-500">
                {viewMode === "switch_risk" 
                  ? "All prescription patterns are stable" 
                  : "No healthcare providers in database"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedHcps.map((hcp, index) => (
              <motion.div
                key={hcp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <Link href={`/hcp/${hcp.id}`}>
                  <Card 
                    className="border border-gray-200 bg-white hover:border-gray-900 hover:shadow-md transition-all duration-200 cursor-pointer"
                    data-testid={`hcp-card-${hcp.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        {/* Left: HCP Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-11 w-11 bg-gray-100">
                            <AvatarFallback className="text-gray-700 text-sm font-medium bg-gray-100">
                              {hcp.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5" data-testid={`hcp-name-${hcp.id}`}>
                              {hcp.name}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{hcp.specialty}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {hcp.hospital}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Risk & Action */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                              {hcp.switchRiskScore}
                            </div>
                            <div className="text-xs text-gray-500 mb-1.5">risk score</div>
                            <div className="flex items-center gap-2 justify-end">
                              {hcp.switchRiskScore === 0 ? (
                                <Badge className="bg-gray-200 text-gray-700 text-xs px-2.5 py-0.5">Stable</Badge>
                              ) : (
                                getRiskBadge(hcp.switchRiskTier, hcp.switchRiskScore)
                              )}
                              <AIInsightBadge hcpId={hcp.id} riskScore={hcp.switchRiskScore} />
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
