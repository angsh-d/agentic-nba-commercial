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
  Zap,
  Info,
  Eye,
  Activity,
  FileText,
  Brain
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label as ChartLabel } from "recharts";

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
        <DialogContent className="max-w-xl border-0 shadow-2xl">
        <DialogHeader className="space-y-6 pb-8">
          <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight leading-tight">
            {headline.replace('Multi-Signal Synthesis Active:', '').trim()}
          </DialogTitle>
          
          {/* Clean 2-Column Metrics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-5xl font-semibold text-gray-900 mb-2">{totalSignals}</div>
              <div className="text-sm text-gray-500 font-medium">Signals Detected</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-5xl font-semibold text-gray-900 mb-2">{insight.confidenceScore}%</div>
              <div className="text-sm text-gray-500 font-medium">Confidence</div>
            </div>
          </div>

          <DialogDescription className="text-base text-gray-700 leading-relaxed pt-2">
            Autonomous agents dynamically identified switching patterns across multiple patient groups, each requiring a different approach.
          </DialogDescription>
        </DialogHeader>
        
        {/* Dynamic Signal Bullets */}
        <div className="space-y-3 py-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Agent-Discovered Signals</p>
          {signalData.signals.slice(0, 3).map((signal, idx) => {
            // Format signal type as readable label
            const signalTypeLabels: Record<string, string> = {
              rx_decline: "Prescription decline",
              event_attendance: "Conference impact",
              adverse_event_cluster: "Safety events",
              peer_influence: "Peer influence",
              access_barrier: "Access barriers",
              cohort_switching: "Cohort switching"
            };
            const label = signalTypeLabels[signal.signalType] || signal.signalType.replace(/_/g, ' ');
            
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">{label}:</span> {signal.signalDescription}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Single Clear CTA */}
        <button
          onClick={() => {
            window.location.href = `/hcp/${hcpId}`;
          }}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-200 group shadow-sm hover:shadow-md"
          data-testid="view-full-investigation"
        >
          <span className="text-base font-semibold">View Full Investigation</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </DialogContent>
    </Dialog>
    </div>
  );
}

type AgentInfo = {
  name: string;
  icon: React.ReactNode;
  description: string;
  capabilities: string[];
};

const agentDetails: Record<string, AgentInfo> = {
  observer: {
    name: "Observer",
    icon: <Eye className="w-6 h-6 text-blue-600" />,
    description: "Detects individual signals across disconnected data sources",
    capabilities: [
      "Monitors prescription volume changes across drug categories",
      "Identifies adverse event clusters in patient populations",
      "Tracks clinical conference attendance and timing",
      "Flags sudden behavioral pattern shifts"
    ]
  },
  correlator: {
    name: "Correlator",
    icon: <Activity className="w-6 h-6 text-blue-600" />,
    description: "Discovers temporal patterns and relationships between signals",
    capabilities: [
      "Correlates events across different time windows",
      "Identifies statistical significance in pattern changes",
      "Measures temporal consistency of behavioral shifts",
      "Cross-references disconnected data points"
    ]
  },
  planner: {
    name: "Planner",
    icon: <Target className="w-6 h-6 text-blue-600" />,
    description: "Creates strategic investigation plans with defined goals",
    capabilities: [
      "Defines investigation hypotheses and success criteria",
      "Prioritizes evidence gathering based on signal strength",
      "Establishes causal investigation pathways",
      "Sets confidence thresholds for recommendations"
    ]
  },
  gatherer: {
    name: "Gatherer",
    icon: <Search className="w-6 h-6 text-blue-600" />,
    description: "Collects and analyzes evidence from prescription history and clinical events",
    capabilities: [
      "Extracts prescription trend data across patient cohorts",
      "Analyzes clinical event timing and impact",
      "Identifies confounding variables and alternative explanations",
      "Validates hypotheses against historical patterns"
    ]
  },
  synthesizer: {
    name: "Synthesizer",
    icon: <Sparkles className="w-6 h-6 text-blue-600" />,
    description: "Generates actionable Next Best Actions based on gathered evidence",
    capabilities: [
      "Synthesizes multi-signal findings into causal narratives",
      "Recommends specific, contextual actions for field reps",
      "Tailors messaging based on switching drivers",
      "Prioritizes actions by impact potential"
    ]
  },
  reflector: {
    name: "Reflector",
    icon: <CheckCircle2 className="w-6 h-6 text-blue-600" />,
    description: "Validates recommendations and assesses confidence levels",
    capabilities: [
      "Evaluates evidence quality and completeness",
      "Assigns confidence scores to recommendations",
      "Identifies gaps in causal reasoning",
      "Flags low-confidence hypotheses for review"
    ]
  }
};

export default function Home() {
  const [viewMode, setViewMode] = useState<"switch_risk" | "all">("switch_risk");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
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
        <div className="max-w-7xl mx-auto px-8 py-40">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-8xl font-semibold mb-10 tracking-tight leading-[1.05] -tracking-[0.02em]">
              <span className="text-gray-900">Smart Territory </span>
              <span className="text-gray-400">Intelligence</span>
            </h1>
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-normal max-w-3xl mx-auto">
              Detect switching signals. Investigate root causes. Generate targeted actions.
            </p>
            
            {/* Data Sources - Sleek Display */}
            <div className="flex items-center justify-center gap-3 mb-20">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Scanning</span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Prescription Data</span>
                <span className="text-gray-300">•</span>
                <span>Clinical Events</span>
                <span className="text-gray-300">•</span>
                <span>Payer Communications</span>
                <span className="text-gray-300">•</span>
                <span>Call Notes</span>
                <span className="text-gray-300">•</span>
                <span>Patient Cohorts</span>
              </div>
            </div>
            
            {/* Agent Pipeline - Apple Minimalist Style */}
            <div className="relative max-w-6xl mx-auto mb-20">
              <div className="grid grid-cols-3 gap-4">
                {/* Stage 1: Detect */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative"
                >
                  <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="text-lg font-semibold text-gray-900 mb-6">Detect</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('observer')}
                        data-testid="agent-observer"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Observer</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('correlator')}
                        data-testid="agent-correlator"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Correlator</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Stage 2: Investigate */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="relative"
                >
                  <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="text-lg font-semibold text-gray-900 mb-6">Investigate</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('planner')}
                        data-testid="agent-planner"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Planner</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('gatherer')}
                        data-testid="agent-gatherer"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Gatherer</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Stage 3: Act */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="text-lg font-semibold text-gray-900 mb-6">Act</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('synthesizer')}
                        data-testid="agent-synthesizer"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Synthesizer</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => setSelectedAgent('reflector')}
                        data-testid="agent-reflector"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-[15px] text-gray-900 font-medium group-hover/item:text-blue-600 transition-colors">Reflector</div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* View Toggle - Slider Switch */}
            <div className="flex items-center justify-center gap-4 bg-gray-100 rounded-full px-6 py-3 inline-flex">
              <Label 
                htmlFor="view-mode-switch" 
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  viewMode === "switch_risk" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Switch Risk ({isLoading ? "..." : atRiskCount})
              </Label>
              <Switch
                id="view-mode-switch"
                checked={viewMode === "all"}
                onCheckedChange={(checked) => setViewMode(checked ? "all" : "switch_risk")}
                disabled={isLoading}
                data-testid="view-mode-switch"
              />
              <Label 
                htmlFor="view-mode-switch"
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  viewMode === "all" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                All HCPs ({isLoading ? "..." : hcps.length})
              </Label>
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
                <Card 
                  className="border border-gray-200 bg-white hover:border-gray-900 hover:shadow-md transition-all duration-200 cursor-pointer"
                  data-testid={`hcp-card-${hcp.id}`}
                  onClick={() => setLocation(`/hcp/${hcp.id}`)}
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
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Agent Capability Modal */}
      <Dialog open={selectedAgent !== null} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-lg">
          {selectedAgent && agentDetails[selectedAgent] && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                    {agentDetails[selectedAgent].icon}
                  </div>
                  <DialogTitle className="text-xl font-semibold">
                    {agentDetails[selectedAgent].name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-base text-gray-700 leading-relaxed">
                  {agentDetails[selectedAgent].description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Capabilities</h4>
                <ul className="space-y-2.5">
                  {agentDetails[selectedAgent].capabilities.map((capability, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 leading-relaxed">{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
