import { useState, useEffect } from "react";
import { Brain, Scale, Sparkles, TrendingUp } from "lucide-react";

interface NBAProvenance {
  rlContribution: {
    topActions: Array<{
      action: string;
      actionType: string;
      confidence: number;
      qValue: number;
      reasoning: string;
    }>;
    policyVersion: string;
    modelName: string;
  };
  rulesContribution: {
    triggeredRules: Array<{
      ruleId: string;
      ruleName: string;
      condition: string;
      action: string;
      priority: string;
    }>;
    filters: string[];
    escalations: string[];
  };
  llmContribution: {
    narrative: string;
    adjustments: string[];
    hcpSpecificInsights: string[];
  };
  finalSynthesis: {
    action: string;
    actionType: string;
    priority: string;
    reason: string;
    synthesisRationale: string;
  };
}

interface NBAProvenancePanelProps {
  hcpId: number;
}

export function NBAProvenancePanel({ hcpId }: NBAProvenancePanelProps) {
  const [provenance, setProvenance] = useState<NBAProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvenance = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hcps/${hcpId}/nba-provenance`);
        if (!response.ok) throw new Error("Failed to fetch provenance");
        const data = await response.json();
        setProvenance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProvenance();
  }, [hcpId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !provenance) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Unable to load provenance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">NBA Ensemble Synthesis</h3>
        <p className="text-xs text-gray-600">
          See how RL policy, business rules, and LLM reasoning combine to generate the optimal Next Best Action
        </p>
      </div>

      {/* Three Component Panels */}
      <div className="grid grid-cols-3 gap-4">
        {/* RL Engine Panel */}
        <div className="bg-white rounded-xl border border-blue-200 p-5" data-testid="panel-rl-engine">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900">RL Policy</h4>
              <p className="text-xs text-gray-500">{provenance.rlContribution.modelName}</p>
            </div>
          </div>

          <div className="space-y-3">
            {provenance.rlContribution.topActions.map((action, idx) => (
              <div key={idx} className="bg-blue-50 rounded-lg p-3" data-testid={`rl-action-${idx}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-blue-900">#{idx + 1}</span>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-blue-700">Q={action.qValue}</span>
                    <span className="text-xs text-blue-600 ml-2">{(action.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-900 mb-1">{action.action}</p>
                <p className="text-xs text-gray-600">{action.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rules Engine Panel */}
        <div className="bg-white rounded-xl border border-purple-200 p-5" data-testid="panel-rules-engine">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Scale className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900">Business Rules</h4>
              <p className="text-xs text-gray-500">
                {provenance.rulesContribution.triggeredRules.length} rule{provenance.rulesContribution.triggeredRules.length !== 1 ? 's' : ''} triggered
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {provenance.rulesContribution.triggeredRules.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">No rules triggered</p>
              </div>
            ) : (
              provenance.rulesContribution.triggeredRules.map((rule) => (
                <div key={rule.ruleId} className="bg-purple-50 rounded-lg p-3" data-testid={`rule-${rule.ruleId}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-purple-900">{rule.ruleId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rule.priority === "High" ? "bg-red-100 text-red-700" :
                      rule.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {rule.priority}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 mb-1">{rule.ruleName}</p>
                  <p className="text-xs text-gray-600 mb-1">{rule.action}</p>
                  <p className="text-xs text-gray-500 italic">IF {rule.condition}</p>
                </div>
              ))
            )}

            {provenance.rulesContribution.escalations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-xs font-semibold text-red-900 mb-1">Escalations:</p>
                {provenance.rulesContribution.escalations.map((esc, idx) => (
                  <p key={idx} className="text-xs text-red-700">{esc}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LLM Contextualization Panel */}
        <div className="bg-white rounded-xl border border-green-200 p-5" data-testid="panel-llm-context">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900">Customized for This HCP</h4>
              <p className="text-xs text-gray-500">AI-tailored approach</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-900 mb-1">Recommended Approach:</p>
              <p className="text-xs text-gray-700">{provenance.llmContribution.narrative}</p>
            </div>

            {provenance.llmContribution.adjustments.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-900 mb-2">How This is Customized:</p>
                <ul className="space-y-1">
                  {provenance.llmContribution.adjustments.map((adj, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-green-600">•</span>
                      <span>{adj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {provenance.llmContribution.hcpSpecificInsights.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-900 mb-2">Key Topics to Emphasize:</p>
                <ul className="space-y-1">
                  {provenance.llmContribution.hcpSpecificInsights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-green-600">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final Synthesis */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border-2 border-gray-700 p-6" data-testid="panel-final-synthesis">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Final Synthesized NBA</h4>
            <p className="text-xs text-gray-400">Combined recommendation</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className={`text-xs px-2 py-1 rounded ${
                provenance.finalSynthesis.priority === "High" ? "bg-red-600 text-white" :
                provenance.finalSynthesis.priority === "Medium" ? "bg-yellow-600 text-white" :
                "bg-gray-600 text-white"
              }`}>
                {provenance.finalSynthesis.priority} Priority
              </span>
            </div>
            <span className="text-xs text-gray-400 uppercase">{provenance.finalSynthesis.actionType}</span>
          </div>
          <h5 className="text-sm font-semibold text-white mb-2">{provenance.finalSynthesis.action}</h5>
          <p className="text-xs text-gray-300">{provenance.finalSynthesis.reason}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-300 mb-1">Synthesis Rationale:</p>
          <p className="text-xs text-gray-400">{provenance.finalSynthesis.synthesisRationale}</p>
        </div>
      </div>
    </div>
  );
}
