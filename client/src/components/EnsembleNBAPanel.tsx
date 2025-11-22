import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  Sparkles,
  BookOpen,
  Brain,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface NBA {
  id: number;
  action: string;
  actionType: string;
  priority: string;
  reason: string;
  aiInsight: string;
  confidenceScore: number;
  expectedOutcome: string;
  timeframe: string;
}

interface EnsembleStrategy {
  id: string;
  title: string;
  source: "RL" | "Rules" | "AI" | "Ensemble";
  description: string;
  pros: string[];
  cons: string[];
  confidenceScore: number;
  estimatedImpact: string;
  resourcesRequired: string;
  timeToImplement: string;
}

interface EnsembleNBAPanelProps {
  nba: NBA;
  provenHypotheses?: any[];
}

export function EnsembleNBAPanel({ nba, provenHypotheses = [] }: EnsembleNBAPanelProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [humanFeedback, setHumanFeedback] = useState<Record<string, boolean>>({});
  const [urgencyWeight, setUrgencyWeight] = useState([50]);
  const [riskToleranceWeight, setRiskToleranceWeight] = useState([50]);

  // Extract proven hypothesis titles for strategy alignment
  const provenCauses = provenHypotheses
    .map(h => h.hypothesis?.title || "Unknown cause")
    .join(", ");

  const hasProvenHypotheses = provenHypotheses.length > 0;

  // Generate ensemble strategies
  const ensembleStrategies: EnsembleStrategy[] = [
    {
      id: "rl_strategy",
      title: "Data-Driven Engagement (RL-Based)",
      source: "RL",
      description:
        "Based on historical patterns from similar HCPs, schedule in-person visit with clinical trial data package focusing on RCC efficacy subgroup analysis.",
      pros: [
        "Highest historical success rate (73% retention improvement)",
        "Proven approach with similar HCPs",
        "Clear implementation playbook",
      ],
      cons: [
        "May not address underlying safety concerns",
        "Resource intensive (requires field team availability)",
      ],
      confidenceScore: 78,
      estimatedImpact: "Medium-High: 60-70% chance of preventing further switches",
      resourcesRequired: "1 field rep, clinical data package, 2 hours",
      timeToImplement: "1-2 weeks",
    },
    {
      id: "rules_strategy",
      title: "Compliance-Based Safety Response (Rule-Based)",
      source: "Rules",
      description:
        "Per company guidelines for cardiac AE clusters: Trigger Medical Affairs safety review, prepare REMS communication, schedule pharmacovigilance briefing with HCP.",
      pros: [
        "Ensures regulatory compliance",
        "Addresses safety signal proactively",
        "Demonstrates corporate responsibility",
      ],
      cons: [
        "May reinforce safety concerns",
        "Slower timeline (requires medical review)",
        "Doesn't address efficacy perception gap",
      ],
      confidenceScore: 85,
      estimatedImpact: "Low-Medium: Prevents litigation risk, but may not retain patients",
      resourcesRequired: "Medical Affairs team, safety data, compliance review",
      timeToImplement: "2-4 weeks (regulatory timeline)",
    },
    {
      id: "ai_strategy",
      title: `Causal-Driven Dual Intervention${hasProvenHypotheses ? " (Proven: " + provenCauses + ")" : ""} (AI-Generated)`,
      source: "AI",
      description: hasProvenHypotheses 
        ? `Based on proven causal factors (${provenCauses}): ${nba.action}`
        : nba.action,
      pros: hasProvenHypotheses
        ? [
            `Directly addresses proven causal factors: ${provenCauses}`,
            "Tailored to specific cohort vulnerabilities identified through multi-hypothesis testing",
            "Proactive intervention based on autonomous causal discovery",
            `Evidence confidence: ${provenHypotheses[0]?.evidence?.finalConfidence || 0}%`,
          ]
        : [
            "Addresses identified causal factors",
            "Tailored to specific cohort vulnerabilities",
            "Proactive rather than reactive",
            "Leverages recent timing",
          ],
      cons: [
        "Novel approach without historical precedent",
        "Requires cross-functional coordination (MSL + Safety)",
        "Higher resource commitment",
      ],
      confidenceScore: hasProvenHypotheses 
        ? Math.min(95, nba.confidenceScore + 10) // Boost confidence if backed by proven hypotheses
        : nba.confidenceScore,
      estimatedImpact: nba.expectedOutcome,
      resourcesRequired: "MSL, Medical Affairs, clinical data, safety documentation",
      timeToImplement: nba.timeframe,
    },
    {
      id: "ensemble_strategy",
      title: `Hybrid Multi-Channel Strategy${hasProvenHypotheses ? " (Validated by Causal AI)" : ""} (Ensemble Recommendation)`,
      source: "Ensemble",
      description: hasProvenHypotheses
        ? `Multi-pronged intervention targeting proven causes (${provenCauses}): PHASE 1 (Week 1): MSL immediate outreach addressing proven efficacy concerns. PHASE 2 (Week 2): Medical Affairs safety briefing for validated risk cohorts. PHASE 3 (Week 3-4): Follow-up field visit with integrated value proposition.`
        : "PHASE 1 (Week 1): MSL immediate outreach with ASCO post-conference analysis for RCC cohort. PHASE 2 (Week 2): Medical Affairs safety briefing for CV-risk patients with cardiac monitoring protocol. PHASE 3 (Week 3-4): Follow-up field visit with integrated efficacy + safety value proposition.",
      pros: hasProvenHypotheses
        ? [
            `Validated by autonomous causal discovery (${provenHypotheses.length} proven hypotheses)`,
            "Addresses multiple proven causal pathways simultaneously",
            "Phased approach aligned with causal evidence strength",
            `Highest confidence: ${Math.max(...provenHypotheses.map(h => h.evidence?.finalConfidence || 0))}% evidence backing`,
          ]
        : [
            "Combines strengths of all approaches",
            "Addresses multiple causal pathways simultaneously",
            "Phased approach reduces resource spike",
            "Highest theoretical impact",
          ],
      cons: [
        "Most complex to execute",
        "Requires exceptional coordination",
        "Highest resource commitment",
      ],
      confidenceScore: hasProvenHypotheses ? 92 : 89,
      estimatedImpact:
        "High: 75-85% chance of preventing further switches across all cohorts",
      resourcesRequired:
        "MSL, Medical Affairs, Field Rep, clinical + safety data packages",
      timeToImplement: "3-4 weeks (phased rollout)",
    },
  ];

  const selectedStrategyData = ensembleStrategies.find(
    (s) => s.id === selectedStrategy
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "RL":
        return <TrendingUp className="w-4 h-4" />;
      case "Rules":
        return <BookOpen className="w-4 h-4" />;
      case "AI":
        return <Brain className="w-4 h-4" />;
      case "Ensemble":
        return <Sparkles className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "RL":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Rules":
        return "bg-green-100 text-green-700 border-green-300";
      case "AI":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "Ensemble":
        return "bg-gradient-to-r from-purple-500 to-blue-600 text-white";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            Ensemble Strategy Recommendations
          </h2>
          <p className="text-gray-600">
            AI-powered ensemble combining RL-based patterns, business rules, and
            causal reasoning
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 text-base">
          <Sparkles className="w-5 h-5 mr-2" />
          4 Strategies Generated
        </Badge>
      </div>

      {/* Human-in-the-Loop Controls */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Human SME Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Urgency Priority
              </label>
              <Badge variant="outline" className="text-xs">
                {urgencyWeight[0]}% weight
              </Badge>
            </div>
            <Slider
              value={urgencyWeight}
              onValueChange={setUrgencyWeight}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Higher = Prioritize faster implementation over perfect solution
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Risk Tolerance
              </label>
              <Badge variant="outline" className="text-xs">
                {riskToleranceWeight[0]}% weight
              </Badge>
            </div>
            <Slider
              value={riskToleranceWeight}
              onValueChange={setRiskToleranceWeight}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Higher = Allow novel approaches vs. proven playbooks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-6">
        {ensembleStrategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedStrategy === strategy.id
                  ? "border-2 border-purple-500 shadow-xl scale-[1.02]"
                  : "border border-gray-200 hover:border-purple-300 hover:shadow-lg"
              }`}
              onClick={() => setSelectedStrategy(strategy.id)}
              data-testid={`strategy-card-${strategy.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    className={`${getSourceColor(strategy.source)} border`}
                  >
                    <div className="flex items-center gap-1">
                      {getSourceIcon(strategy.source)}
                      <span className="text-xs font-semibold">
                        {strategy.source}
                      </span>
                    </div>
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {strategy.confidenceScore}%
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Confidence
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{strategy.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {strategy.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      Pros
                    </h5>
                    <ul className="space-y-1">
                      {strategy.pros.map((pro, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-start gap-1"
                        >
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" />
                      Cons
                    </h5>
                    <ul className="space-y-1">
                      {strategy.cons.map((con, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-start gap-1"
                        >
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">
                        <span className="font-semibold">Impact:</span>{" "}
                        {strategy.estimatedImpact}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">
                        <span className="font-semibold">Timeline:</span>{" "}
                        {strategy.timeToImplement}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Strategy Comparison */}
      {selectedStrategyData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle>Selected: {selectedStrategyData.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Resources Required
                  </h4>
                  <p className="text-sm text-gray-800">
                    {selectedStrategyData.resourcesRequired}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Expected Impact
                  </h4>
                  <p className="text-sm text-gray-800">
                    {selectedStrategyData.estimatedImpact}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <Checkbox
                  id="sme-approval"
                  checked={humanFeedback.smeApproved || false}
                  onCheckedChange={(checked) =>
                    setHumanFeedback({ ...humanFeedback, smeApproved: !!checked })
                  }
                />
                <label
                  htmlFor="sme-approval"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  I approve this strategy as an SME
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  disabled={!humanFeedback.smeApproved}
                  data-testid="button-implement-strategy"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Implement Strategy
                </Button>
                <Button variant="outline" data-testid="button-request-revision">
                  Request Revision
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
