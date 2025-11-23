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
  FileText
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <DialogTitle className="text-2xl font-semibold text-gray-900 mb-3">
            {headline}
          </DialogTitle>
          {/* Summary Metrics */}
          <div className="flex items-center gap-8">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{totalSignals}</span>
              <span className="text-sm text-gray-500">signals</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-blue-600">{avgSignalStrength}</span>
              <span className="text-sm text-gray-500">avg strength</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{insight.confidenceScore}%</span>
              <span className="text-sm text-gray-500">confidence</span>
            </div>
          </div>
          <DialogDescription className="sr-only">
            AI-generated risk insight
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-8">
          {/* Investigation Journey - 3 Steps */}
          <div className="space-y-6">
            {/* Step 1: Signal Detection */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Signal Detection</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Detected {totalSignals} correlated signals across prescription history, clinical events, and peer networks
                </p>
              </div>
            </div>

            {/* Step 2: Pattern Recognition */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Temporal Analysis</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Cross-referenced 12 patients over 6 months revealing dual switching clusters post-ASCO conference
                </p>
              </div>
            </div>

            {/* Step 3: Synthesis */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Multi-Hypothesis Investigation</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Identified dual independent drivers: efficacy concerns in young RCC cohort + safety mitigation in CV-risk patients
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Signal Timeline Chart */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Temporal Signal Correlation</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { month: "Jan", oncoPro: 98, nephroX: 42, label: "Jan" },
                    { month: "Feb", oncoPro: 102, nephroX: 41, label: "Feb" },
                    { month: "Mar", oncoPro: 100, nephroX: 43, label: "Mar" },
                    { month: "Apr", oncoPro: 99, nephroX: 42, label: "Apr" },
                    { month: "May", oncoPro: 101, nephroX: 44, label: "May" },
                    { month: "Jun", oncoPro: 92, nephroX: 50, label: "Jun", conference: true },
                    { month: "Jul", oncoPro: 80, nephroX: 60, label: "Jul" },
                    { month: "Aug", oncoPro: 68, nephroX: 72, label: "Aug", adverseEvents: true },
                    { month: "Sep", oncoPro: 56, nephroX: 80, label: "Sep" },
                    { month: "Oct", oncoPro: 48, nephroX: 86, label: "Oct" }
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
                    label={{ value: 'Rx Volume (Indexed)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#d1d5db' }}
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
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563eb' }}
                    name="Onco-Pro"
                  />
                  
                  {/* Nephro-X Rx Increase */}
                  <Line 
                    type="monotone" 
                    dataKey="nephroX" 
                    stroke="#9333ea" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#9333ea' }}
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
                      value="ASCO" 
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
              <div className="flex items-center justify-center gap-6 mt-4 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-600" />
                  <span className="text-gray-700">Onco-Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-purple-600" />
                  <span className="text-gray-700">Nephro-X</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-red-600" />
                  <span className="text-gray-700">ASCO Conference (Signal 2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-orange-600" />
                  <span className="text-gray-700">Adverse Events (Signal 3)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              <strong>Temporal Correlation:</strong> Steady volumes Jan-May, then Onco-Pro declines post-ASCO (Jun) while Nephro-X gains share. Decline continues post-adverse events (Aug) with inverse competitor growth — demonstrating competitive switching across patient cohorts.
            </p>
          </div>

          {/* Signal Evidence */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 py-3 border-t border-gray-100">
              <span>View Signal Evidence ({totalSignals})</span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="space-y-3 pt-3">
              <TooltipProvider>
                {signalData.signals.map((signal) => (
                  <div key={signal.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {signal.signalType.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-blue-600">
                            {signal.signalStrength}/100
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                <strong>Signal Strength:</strong> Autonomous agents evaluated this signal based on change magnitude, temporal consistency, statistical significance, and data quality. Higher scores indicate stronger evidence of switching behavior.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{signal.signalDescription}</p>
                    </div>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </details>
        </div>
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
        <div className="max-w-7xl mx-auto px-8 py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-7xl font-semibold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Territory Intelligence
            </h1>
            <p className="text-2xl text-gray-600 mb-12 leading-relaxed font-light">
              Autonomous agents detect signals, investigate causal drivers, and generate contextual Next Best Actions
            </p>
            
            {/* Agent Pipeline - Sleek Horizontal Flow */}
            <div className="relative max-w-6xl mx-auto mb-20">
              <div className="grid grid-cols-3 gap-6">
                {/* Stage 1: Detect */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="bg-white rounded-[28px] p-8 shadow-sm border border-gray-200/80 hover:shadow-md transition-all duration-300">
                    <div className="text-base font-semibold text-gray-900 mb-6 tracking-tight">Detect</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('observer')}
                        data-testid="agent-observer"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Observer</div>
                      </div>
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('correlator')}
                        data-testid="agent-correlator"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Correlator</div>
                      </div>
                    </div>
                  </div>
                  {/* Sleek Connector */}
                  <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </motion.div>

                {/* Stage 2: Investigate */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="bg-white rounded-[28px] p-8 shadow-sm border border-gray-200/80 hover:shadow-md transition-all duration-300">
                    <div className="text-base font-semibold text-gray-900 mb-6 tracking-tight">Investigate</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('planner')}
                        data-testid="agent-planner"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Planner</div>
                      </div>
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('gatherer')}
                        data-testid="agent-gatherer"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Gatherer</div>
                      </div>
                    </div>
                  </div>
                  {/* Sleek Connector */}
                  <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </motion.div>

                {/* Stage 3: Act */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="group"
                >
                  <div className="bg-white rounded-[28px] p-8 shadow-sm border border-gray-200/80 hover:shadow-md transition-all duration-300">
                    <div className="text-base font-semibold text-gray-900 mb-6 tracking-tight">Act</div>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('synthesizer')}
                        data-testid="agent-synthesizer"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Synthesizer</div>
                      </div>
                      <div 
                        className="flex items-center gap-3.5 group/item cursor-pointer"
                        onClick={() => setSelectedAgent('reflector')}
                        data-testid="agent-reflector"
                      >
                        <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Reflector</div>
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
