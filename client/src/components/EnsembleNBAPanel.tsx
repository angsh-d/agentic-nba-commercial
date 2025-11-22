import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  Brain,
  CheckCircle2,
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

  const provenCauses = provenHypotheses
    .map(h => h.hypothesis?.title || "Unknown cause")
    .join(", ");

  const hasProvenHypotheses = provenHypotheses.length > 0;

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
        ? Math.min(95, nba.confidenceScore + 10)
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

  const getSourceBadge = (source: "RL" | "Rules" | "AI" | "Ensemble") => {
    const labels: Record<string, string> = { RL: "Data", Rules: "Rules", AI: "AI", Ensemble: "Ensemble" };
    return <Badge className="bg-gray-900 text-white text-xs px-2 py-0.5">{labels[source] || source}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">
          Strategy Recommendations
        </h2>
        <p className="text-sm text-gray-600">
          Ensemble combining data-driven patterns, business rules, and AI reasoning
        </p>
      </div>

      {/* Human-in-the-Loop Controls */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Human Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Urgency Priority
              </label>
              <Badge variant="outline" className="text-xs">
                {urgencyWeight[0]}%
              </Badge>
            </div>
            <Slider
              value={urgencyWeight}
              onValueChange={setUrgencyWeight}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Higher = Prioritize faster implementation
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Risk Tolerance
              </label>
              <Badge variant="outline" className="text-xs">
                {riskToleranceWeight[0]}%
              </Badge>
            </div>
            <Slider
              value={riskToleranceWeight}
              onValueChange={setRiskToleranceWeight}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Higher = Allow novel approaches
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-4">
        {ensembleStrategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedStrategy === strategy.id
                  ? "border-2 border-gray-900 shadow-md"
                  : "border border-gray-200 hover:border-gray-400"
              }`}
              onClick={() => setSelectedStrategy(strategy.id)}
              data-testid={`strategy-card-${strategy.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  {getSourceBadge(strategy.source)}
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-gray-900">
                      {strategy.confidenceScore}%
                    </div>
                    <div className="text-xs text-gray-500">
                      confidence
                    </div>
                  </div>
                </div>
                <CardTitle className="text-base font-semibold leading-snug">{strategy.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">
                  {strategy.description}
                </p>

                <div className="space-y-2">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-1">
                      Pros
                    </h5>
                    <ul className="space-y-0.5">
                      {strategy.pros.map((pro, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-start gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-1">
                      Cons
                    </h5>
                    <ul className="space-y-0.5">
                      {strategy.cons.map((con, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-start gap-1.5"
                        >
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {strategy.estimatedImpact}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
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

      {/* Selected Strategy Details */}
      {selectedStrategyData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border border-gray-900 bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selected: {selectedStrategyData.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Resources Required
                  </h4>
                  <p className="text-xs text-gray-800">
                    {selectedStrategyData.resourcesRequired}
                  </p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Expected Impact
                  </h4>
                  <p className="text-xs text-gray-800">
                    {selectedStrategyData.estimatedImpact}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                <Checkbox
                  id="sme-approval"
                  checked={humanFeedback.smeApproved || false}
                  onCheckedChange={(checked) =>
                    setHumanFeedback({ ...humanFeedback, smeApproved: !!checked })
                  }
                />
                <label htmlFor="sme-approval" className="text-xs text-gray-700 cursor-pointer">
                  SME Approval Required
                </label>
              </div>

              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm"
                data-testid="button-implement-strategy"
              >
                Implement Strategy
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
