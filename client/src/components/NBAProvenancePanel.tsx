import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    <div className="space-y-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h3 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">NBA Ensemble Synthesis</h3>
        <p className="text-base text-gray-600 font-light leading-relaxed">
          See how RL policy, business rules, and LLM reasoning combine to generate the optimal Next Best Action
        </p>
      </div>

      {/* Accordion-style Panels */}
      <Accordion type="multiple" defaultValue={["rl", "rules", "llm", "synthesis"]} className="space-y-6">
        {/* RL Engine Panel */}
        <AccordionItem value="rl" className="bg-white rounded-2xl border border-gray-200 px-8" data-testid="panel-rl-engine">
          <AccordionTrigger className="text-2xl font-semibold text-gray-900 py-8 tracking-tight hover:no-underline">
            RL Policy
            <span className="text-base text-gray-500 font-normal ml-3">{provenance.rlContribution.modelName}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-8">
            <div className="space-y-6">
              {provenance.rlContribution.topActions.map((action, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6" data-testid={`rl-action-${idx}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">#{idx + 1}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">Q={action.qValue}</span>
                      <span className="text-sm text-gray-600 ml-3">{(action.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-base font-medium text-gray-900 mb-2">{action.action}</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{action.reasoning}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rules Engine Panel */}
        <AccordionItem value="rules" className="bg-white rounded-2xl border border-gray-200 px-8" data-testid="panel-rules-engine">
          <AccordionTrigger className="text-2xl font-semibold text-gray-900 py-8 tracking-tight hover:no-underline">
            Business Rules
            <span className="text-base text-gray-500 font-normal ml-3">
              {provenance.rulesContribution.triggeredRules.length} rule{provenance.rulesContribution.triggeredRules.length !== 1 ? 's' : ''} triggered
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-8">
            <div className="space-y-6">
              {provenance.rulesContribution.triggeredRules.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-sm text-gray-600">No rules triggered</p>
                </div>
              ) : (
                provenance.rulesContribution.triggeredRules.map((rule) => (
                  <div key={rule.ruleId} className="bg-gray-50 rounded-xl p-6" data-testid={`rule-${rule.ruleId}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">{rule.ruleId}</span>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-gray-200 text-gray-700">
                        {rule.priority}
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-2">{rule.ruleName}</p>
                    <p className="text-sm text-gray-600 mb-2 font-light">{rule.action}</p>
                    <p className="text-sm text-gray-500 italic font-light">IF {rule.condition}</p>
                  </div>
                ))
              )}

              {provenance.rulesContribution.escalations.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mt-6">
                  <p className="text-base font-semibold text-gray-900 mb-3">Escalations:</p>
                  {provenance.rulesContribution.escalations.map((esc, idx) => (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed font-light">{esc}</p>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LLM Contextualization Panel */}
        <AccordionItem value="llm" className="bg-white rounded-2xl border border-gray-200 px-8" data-testid="panel-llm-context">
          <AccordionTrigger className="text-2xl font-semibold text-gray-900 py-8 tracking-tight hover:no-underline">
            LLM Contextualization
            <span className="text-base text-gray-500 font-normal ml-3">GPT-5-mini</span>
          </AccordionTrigger>
          <AccordionContent className="pb-8">
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-base font-medium text-gray-900 mb-3">Narrative:</p>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{provenance.llmContribution.narrative}</p>
              </div>

              {provenance.llmContribution.adjustments.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-base font-medium text-gray-900 mb-4">Adjustments:</p>
                  <ul className="space-y-2">
                    {provenance.llmContribution.adjustments.map((adj, idx) => (
                      <li key={idx} className="text-sm text-gray-700 leading-relaxed font-light flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>{adj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {provenance.llmContribution.hcpSpecificInsights.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-base font-medium text-gray-900 mb-4">HCP Insights:</p>
                  <ul className="space-y-2">
                    {provenance.llmContribution.hcpSpecificInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-700 leading-relaxed font-light flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Final Synthesis */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8" data-testid="panel-final-synthesis">
        <h3 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">Final Synthesized NBA</h3>
        <p className="text-base text-gray-500 mb-8 font-light">Combined recommendation</p>

        <div className="bg-gray-50 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-medium">
                {provenance.finalSynthesis.priority} Priority
              </span>
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">{provenance.finalSynthesis.actionType}</span>
          </div>
          <h5 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">{provenance.finalSynthesis.action}</h5>
          <p className="text-base text-gray-600 leading-relaxed font-light">{provenance.finalSynthesis.reason}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8">
          <p className="text-base font-medium text-gray-900 mb-3">Synthesis Rationale:</p>
          <p className="text-sm text-gray-600 leading-relaxed font-light">{provenance.finalSynthesis.synthesisRationale}</p>
        </div>
      </div>
    </div>
  );
}
