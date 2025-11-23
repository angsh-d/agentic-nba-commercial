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
  ChevronRight,
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
      title: "Risk Stratification & Appropriate Use (RL-Based)",
      source: "RL",
      description:
        "Based on patterns from similar post-AE situations: Deploy cardiac risk stratification tool to identify patients who can SAFELY continue Onco-Pro. Focus on the stable cohort (25% of panel) who lack CV risk factors and fall outside the young RCC subgroup where competitor showed superiority.",
      pros: [
        "Clinically appropriate - respects evidence-based switches",
        "Prevents unnecessary switches in stable patients",
        "Demonstrates commitment to patient safety over market share",
      ],
      cons: [
        "Accepts loss of young RCC and CV-risk cohorts",
        "Requires medical review for remaining patients",
      ],
      confidenceScore: 82,
      estimatedImpact: "Medium: 70-80% retention of clinically appropriate patients (stable cohort)",
      resourcesRequired: "Risk stratification tool, cardiac screening protocol, 1 field rep",
      timeToImplement: "1-2 weeks",
    },
    {
      id: "rules_strategy",
      title: "Safety Monitoring & Value-Add Services (Rule-Based)",
      source: "Rules",
      description:
        "Per company guidelines: Offer comprehensive cardiac monitoring support for patients who remain on Onco-Pro (baseline ECG, QTc tracking, cardiology co-management pathway). Provide patient support services at no cost: nurse navigator for side effect management, adherence program, 24/7 clinical support hotline.",
      pros: [
        "Provides tangible clinical value beyond the drug itself",
        "Demonstrates genuine commitment to patient safety",
        "Supports HCP in managing appropriate patients confidently",
        "Builds long-term collaborative relationship",
      ],
      cons: [
        "Resource intensive (ongoing monitoring and support costs)",
        "Focused solely on retention of appropriate patients, not market expansion",
      ],
      confidenceScore: 88,
      estimatedImpact: "Medium-High: Safely retains appropriate patients, prevents future AEs through monitoring",
      resourcesRequired: "Cardiology consultation network, nurse navigator team, patient support infrastructure",
      timeToImplement: "2-3 weeks (protocol development and team training)",
    },
    {
      id: "ai_strategy",
      title: `Evidence-Informed Appropriate Use Strategy${hasProvenHypotheses ? " (Proven: " + provenCauses + ")" : ""} (AI-Generated)`,
      source: "AI",
      description: hasProvenHypotheses 
        ? `Causal analysis shows switches were evidence-based (ASCO efficacy data for young RCC, cardiac AEs for CV-risk). Strategy: ACCEPT these clinically appropriate switches. FOCUS on stable cohort (3 patients, 25% of panel) with targeted education on appropriate patient selection, cardiac risk screening, and monitoring protocols. POSITION for future: discuss next-generation products, combination therapy trials, and expanded indications where our portfolio has advantages.`
        : `Accept evidence-based switches in young RCC and CV-risk cohorts. Focus retention efforts on stable patients through risk stratification and safety monitoring. Position for future opportunities in combination therapy and next-gen products.`,
      pros: hasProvenHypotheses
        ? [
            `Clinically defensible - respects proven causal factors: ${provenCauses}`,
            "Builds trust by acknowledging legitimate clinical concerns rather than fighting evidence",
            "Focuses resources on winnable opportunities (stable cohort)",
            `Evidence-based approach with ${provenHypotheses[0]?.evidence?.finalConfidence || 0}% confidence`,
            "Positions for long-term relationship vs. short-term market share defense",
          ]
        : [
            "Clinically appropriate and ethical",
            "Builds long-term HCP trust",
            "Focuses on appropriate patient selection",
            "Forward-looking strategy",
          ],
      cons: [
        "Accepts permanent loss of young RCC and CV-risk cohorts to competitor",
        "Requires difficult internal conversation about product limitations",
        "Lower immediate market share impact",
      ],
      confidenceScore: hasProvenHypotheses ? 91 : 85,
      estimatedImpact: "Medium: Retains 70-80% of appropriate patients, preserves HCP relationship for future products",
      resourcesRequired: "MSL for future positioning, cardiac screening tools, patient selection guidelines",
      timeToImplement: "2-3 weeks (educational materials development)",
    },
    {
      id: "ensemble_strategy",
      title: `Integrated Appropriate Use & Future Positioning${hasProvenHypotheses ? " (Validated by Causal AI)" : ""} (Ensemble Recommendation)`,
      source: "Ensemble",
      description: hasProvenHypotheses
        ? `Evidence-based phased approach respecting proven causes (${provenCauses}): PHASE 1 (Week 1): Offer comprehensive support package - deploy cardiac risk stratification tool and monitoring protocol for stable cohort (3 patients), provide patient selection guidelines and support services at no cost. PHASE 2 (Week 2-3): Ensure smooth implementation - field rep check-in to confirm tools are useful, gather feedback, address any barriers to optimal patient care. PHASE 3 (Week 4): MSL visit to discuss future collaboration opportunities - next-gen products, combination therapy trials (Onco-Pro + immunotherapy), expanded indications, investigator-initiated research. Build long-term scientific partnership.`
        : "PHASE 1 (Week 1): Offer cardiac risk tools and monitoring protocols for appropriate patients. PHASE 2 (Week 2-3): Field rep support for implementation. PHASE 3 (Week 4): MSL future portfolio discussion on next-gen products and combination therapies.",
      pros: hasProvenHypotheses
        ? [
            `Clinically and ethically sound - validated by ${provenHypotheses.length} proven causal hypotheses`,
            "Provides genuine clinical value through risk tools and support services",
            "Supports HCP in managing stable cohort appropriately and safely",
            `Evidence confidence: ${Math.max(...provenHypotheses.map(h => h.evidence?.finalConfidence || 0))}%`,
            "Positions for long-term scientific collaboration and future product adoption",
            "Respects physician autonomy and evidence-based decision making",
          ]
        : [
            "Clinically appropriate and genuinely supportive",
            "Combines practical tools with future opportunities",
            "Phased approach allows HCP to adopt at own pace",
            "Long-term strategic partnership focus",
          ],
      cons: [
        "Accepts immediate market share loss in two cohorts (young RCC, CV-risk)",
        "Requires organizational commitment to value-based relationships over transactional sales",
        "Return on investment measured over longer timeframe (6-12 months)",
      ],
      confidenceScore: hasProvenHypotheses ? 93 : 89,
      estimatedImpact:
        "High: 80-90% retention of appropriate patients + strong foundation for future product adoption",
      resourcesRequired:
        "Cardiac risk stratification tool, patient support services, field rep, MSL for future collaboration",
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

  // Group strategies by source for clearer presentation
  const rlStrategy = ensembleStrategies.find(s => s.source === "RL");
  const rulesStrategy = ensembleStrategies.find(s => s.source === "Rules");
  const aiStrategy = ensembleStrategies.find(s => s.source === "AI");
  const ensembleStrategy = ensembleStrategies.find(s => s.source === "Ensemble");

  const StrategyCard = ({ strategy }: { strategy: EnsembleStrategy }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 h-full ${
        selectedStrategy === strategy.id
          ? "border-2 border-gray-900 shadow-lg"
          : "border border-gray-200 hover:border-gray-400 hover:shadow-md"
      }`}
      onClick={() => setSelectedStrategy(strategy.id)}
      data-testid={`strategy-card-${strategy.id}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          {getSourceBadge(strategy.source)}
          <div className="text-right">
            <div className="text-3xl font-semibold text-gray-900 tracking-tight">
              {strategy.confidenceScore}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              confidence
            </div>
          </div>
        </div>
        <CardTitle className="text-lg font-semibold leading-tight text-gray-900">
          {strategy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {strategy.description}
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <h5 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
              Strengths
            </h5>
            <ul className="space-y-1.5">
              {strategy.pros.map((pro, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
              Considerations
            </h5>
            <ul className="space-y-1.5">
              {strategy.cons.map((con, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span className="leading-relaxed">{con}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {strategy.estimatedImpact}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {strategy.timeToImplement}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
          Strategy Recommendations
        </h2>
        <p className="text-base text-gray-600 font-light">
          Ensemble combining data-driven patterns, business rules, and AI reasoning
        </p>
      </div>

      {/* Three Source Sections */}
      <div className="space-y-16">
        {/* RL-Based NBA Engine */}
        {rlStrategy && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">
                RL-Based NBA Engine
              </h3>
              <p className="text-sm text-gray-600 font-light">
                Data-driven recommendations from reinforcement learning trained on historical engagement patterns
              </p>
            </div>
            <StrategyCard strategy={rlStrategy} />
          </div>
        )}

        {/* Pre-defined Rules */}
        {rulesStrategy && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">
                Pre-defined Rules
              </h3>
              <p className="text-sm text-gray-600 font-light">
                Compliance-based protocols ensuring regulatory and safety standards
              </p>
            </div>
            <StrategyCard strategy={rulesStrategy} />
          </div>
        )}

        {/* Gen AI Suggestions */}
        {aiStrategy && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">
                Gen AI Suggestions
              </h3>
              <p className="text-sm text-gray-600 font-light">
                Autonomous causal reasoning tailored to proven hypotheses and specific HCP behavior
              </p>
            </div>
            <StrategyCard strategy={aiStrategy} />
            
            {/* Tactical Breakdown for Risk Stratification Strategy */}
            {hasProvenHypotheses && (
              <div className="mt-6">
                <Card className="border border-gray-300 bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Implementation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Patient Cohort Focus
                        </div>
                        <div className="text-sm text-gray-900">Stable cohort (3 patients, 25% of panel)</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Risk Stratification
                        </div>
                        <div className="text-sm text-gray-900">Cardiac screening tool + baseline ECG/QTc</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Monitoring Protocol
                        </div>
                        <div className="text-sm text-gray-900">Cardiology co-management pathway</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Patient Support
                        </div>
                        <div className="text-sm text-gray-900">Nurse navigator, adherence programs</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Future Positioning
                        </div>
                        <div className="text-sm text-gray-900">Next-gen products, combination trials</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Clinical Integrity
                        </div>
                        <div className="text-sm text-gray-900">Acknowledge evidence-based switches</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Ensemble Recommendation - Special Summary Section */}
      {ensembleStrategy && (
        <div className="border-t-2 border-gray-900 pt-16">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              Ensemble Recommendation
            </h3>
            <p className="text-base text-gray-600 font-light">
              Integrated multi-channel strategy combining all three sources
            </p>
          </div>

          <Card className="border-2 border-gray-900 bg-gray-50 shadow-xl">
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-gray-900" />
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {ensembleStrategy.title}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold text-gray-900 tracking-tight">
                    {ensembleStrategy.confidenceScore}%
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    confidence
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Multi-Phase Plan */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Multi-Phase Implementation Plan
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {ensembleStrategy.description}
                </p>
              </div>

              {/* Strengths & Considerations Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Strengths
                  </h5>
                  <ul className="space-y-2">
                    {ensembleStrategy.pros.map((pro, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Considerations
                  </h5>
                  <ul className="space-y-2">
                    {ensembleStrategy.cons.map((con, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span className="leading-relaxed">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Impact & Resources */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Expected Impact
                    </h5>
                  </div>
                  <p className="text-sm text-gray-900">
                    {ensembleStrategy.estimatedImpact}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Timeline
                    </h5>
                  </div>
                  <p className="text-sm text-gray-900">
                    {ensembleStrategy.timeToImplement}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Resources
                    </h5>
                  </div>
                  <p className="text-sm text-gray-900">
                    {ensembleStrategy.resourcesRequired}
                  </p>
                </div>
              </div>

              {/* Implement Button */}
              <div className="pt-4">
                <Button 
                  onClick={() => setSelectedStrategy(ensembleStrategy.id)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-base"
                  data-testid="button-implement-ensemble"
                >
                  Implement Ensemble Strategy
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Human-in-the-Loop Controls - moved to bottom */}
      <Card className="border border-gray-200 bg-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Human Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Urgency Priority
              </label>
              <Badge variant="outline" className="text-sm">
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
            <p className="text-xs text-gray-500 mt-2 font-light">
              Higher = Prioritize faster implementation
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Risk Tolerance
              </label>
              <Badge variant="outline" className="text-sm">
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
            <p className="text-xs text-gray-500 mt-2 font-light">
              Higher = Allow novel approaches
            </p>
          </div>
        </CardContent>
      </Card>

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
