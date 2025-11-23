import { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, XCircle, AlertCircle, Target } from "lucide-react";

interface SubHypothesis {
  id: string;
  text: string;
  status: "gathering" | "proven" | "rejected" | "pending";
  confidence: number;
  evidence?: string[];
}

interface Hypothesis {
  id: string;
  text: string;
  status: "gathering" | "proven" | "rejected" | "pending";
  confidence: number;
  subHypotheses?: SubHypothesis[];
  evidence?: string[];
}

interface HypothesisTreeViewProps {
  hypotheses: Hypothesis[];
}

export function HypothesisTreeView({ hypotheses }: HypothesisTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "proven":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-neutral-400" />;
      case "gathering":
        return <Target className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "proven":
        return "bg-emerald-50 border-emerald-200";
      case "rejected":
        return "bg-neutral-50 border-neutral-200 opacity-60";
      case "gathering":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-neutral-50 border-neutral-200";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-700 bg-emerald-100";
    if (confidence >= 60) return "text-blue-700 bg-blue-100";
    if (confidence >= 40) return "text-amber-700 bg-amber-100";
    return "text-neutral-600 bg-neutral-100";
  };

  return (
    <div className="space-y-3" data-testid="hypothesis-tree">
      {hypotheses.map((hypothesis) => {
        const isExpanded = expandedIds.has(hypothesis.id);
        const hasSubHypotheses = hypothesis.subHypotheses && hypothesis.subHypotheses.length > 0;

        return (
          <div key={hypothesis.id} className="space-y-2">
            <div
              className={`border rounded-lg p-4 transition-all ${getStatusColor(hypothesis.status)}`}
              data-testid={`hypothesis-${hypothesis.id}`}
            >
              <div className="flex items-start gap-3">
                {hasSubHypotheses && (
                  <button
                    onClick={() => toggleExpanded(hypothesis.id)}
                    className="mt-1 text-neutral-600 hover:text-neutral-900 transition-colors"
                    data-testid={`toggle-hypothesis-${hypothesis.id}`}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
                {!hasSubHypotheses && <div className="w-4" />}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(hypothesis.status)}
                      <div>
                        <p className="text-sm font-medium text-neutral-900 leading-relaxed">
                          {hypothesis.text}
                        </p>
                        {hypothesis.evidence && hypothesis.evidence.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {hypothesis.evidence.map((ev, idx) => (
                              <p key={idx} className="text-xs text-neutral-600 pl-3 border-l-2 border-neutral-300">
                                {ev}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getConfidenceColor(hypothesis.confidence)}`}
                      data-testid={`confidence-${hypothesis.id}`}
                    >
                      {hypothesis.confidence}%
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && hasSubHypotheses && (
                <div className="mt-4 ml-7 space-y-2 pl-4 border-l-2 border-neutral-200">
                  {hypothesis.subHypotheses!.map((subHyp) => (
                    <div
                      key={subHyp.id}
                      className={`border rounded-lg p-3 ${getStatusColor(subHyp.status)}`}
                      data-testid={`subhypothesis-${subHyp.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(subHyp.status)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-neutral-800 leading-relaxed flex-1">{subHyp.text}</p>
                            <div
                              className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getConfidenceColor(subHyp.confidence)}`}
                              data-testid={`subconfidence-${subHyp.id}`}
                            >
                              {subHyp.confidence}%
                            </div>
                          </div>
                          {subHyp.evidence && subHyp.evidence.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {subHyp.evidence.map((ev, idx) => (
                                <p key={idx} className="text-xs text-neutral-600 pl-3 border-l-2 border-neutral-300">
                                  {ev}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
