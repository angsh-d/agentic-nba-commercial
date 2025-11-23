import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Brain, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Hypothesis {
  id: string;
  title: string;
  description: string;
  causalChain: string[];
  predictedPatterns: string[];
  dataSourcesNeeded: string[];
  initialConfidence: number;
}

interface Evidence {
  source: string;
  finding: string;
  supportsHypothesis: boolean;
  strength: "weak" | "moderate" | "strong";
}

interface HypothesisResult {
  hypothesis: Hypothesis;
  evidence: {
    hypothesisId: string;
    evidenceFound: Evidence[];
    finalConfidence: number;
    verdict: "proven" | "likely" | "possible" | "unlikely" | "disproven";
    reasoning: string;
  };
}

async function triggerInvestigation(hcpId: number) {
  const response = await fetch(`/api/ai/investigate/${hcpId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to start investigation");
  return response.json();
}

async function confirmInvestigation(hcpId: number, confirmedHypotheses: any[], smeNotes: string) {
  const response = await fetch(`/api/ai/confirm-investigation/${hcpId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmedHypotheses, smeNotes }),
  });
  if (!response.ok) throw new Error("Failed to confirm investigation");
  return response.json();
}

function getVerdictBadge(verdict: string) {
  switch (verdict) {
    case "proven":
    case "likely":
      return <Badge className="bg-gray-900 text-white text-xs px-2.5 py-0.5">{verdict}</Badge>;
    case "possible":
      return <Badge className="bg-gray-600 text-white text-xs px-2.5 py-0.5">{verdict}</Badge>;
    case "unlikely":
    case "disproven":
      return <Badge className="bg-gray-300 text-gray-700 text-xs px-2.5 py-0.5">{verdict}</Badge>;
    default:
      return <Badge className="bg-gray-200 text-gray-600 text-xs px-2.5 py-0.5">testing</Badge>;
  }
}

export default function InvestigationHub() {
  const [, params] = useRoute("/hcp/:id/investigate");
  const hcpId = params?.id;
  const [, setLocation] = useLocation();
  const [investigationResults, setInvestigationResults] = useState<any>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [selectedHypotheses, setSelectedHypotheses] = useState<Set<string>>(new Set());
  const [smeNotes, setSmeNotes] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load existing investigation results on mount
  const { data: existingResults } = useQuery({
    queryKey: [`investigation-results-${hcpId}`],
    queryFn: async () => {
      const response = await fetch(`/api/ai/investigation-results/${hcpId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!hcpId,
  });

  // Populate investigation results from existing data
  useEffect(() => {
    if (existingResults?.hasInvestigation && !investigationResults) {
      setInvestigationResults({
        allHypotheses: existingResults.allHypotheses || [],
        provenHypotheses: existingResults.provenHypotheses || [],
        ruledOut: (existingResults.allHypotheses || []).filter(
          (h: any) => h.evidence.verdict === 'ruled_out'
        ),
      });
      
      // Auto-select proven hypotheses if not yet confirmed
      if (!existingResults.isConfirmed && existingResults.provenHypotheses) {
        const provenIds = new Set<string>(
          existingResults.provenHypotheses.map((h: any) => h.hypothesis.id)
        );
        setSelectedHypotheses(provenIds);
      }
    }
  }, [existingResults, investigationResults]);

  const investigateMutation = useMutation({
    mutationFn: () => triggerInvestigation(Number(hcpId)),
    onMutate: () => {
      setIsInvestigating(true);
      toast.info("Starting Investigation");
    },
    onSuccess: (data) => {
      setInvestigationResults(data.investigation);
      setIsInvestigating(false);
      // Auto-select all proven hypotheses by default
      const provenIds = new Set<string>(data.investigation.provenHypotheses.map((h: any) => h.hypothesis.id));
      setSelectedHypotheses(provenIds);
      toast.success(`${data.investigation.provenHypotheses.length} hypotheses proven`);
    },
    onError: () => {
      setIsInvestigating(false);
      toast.error("Investigation failed");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      const confirmed = allHypotheses.filter(h => selectedHypotheses.has(h.hypothesis.id));
      return confirmInvestigation(Number(hcpId), confirmed, smeNotes);
    },
    onSuccess: (data) => {
      toast.success(`${data.confirmedCount} hypotheses confirmed`);
      setLocation(`/hcp/${hcpId}`);
    },
    onError: () => {
      toast.error("Failed to save confirmation");
    },
  });

  const allHypotheses: HypothesisResult[] = investigationResults?.allHypotheses || [];
  const provenHypotheses = investigationResults?.provenHypotheses || [];
  const ruledOut = investigationResults?.ruledOut || [];

  const toggleHypothesis = (id: string) => {
    const newSelected = new Set(selectedHypotheses);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedHypotheses(newSelected);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="mb-20">
          <Link href={`/hcp/${hcpId}`}>
            <Button
              variant="ghost"
              className="mb-12 -ml-3 text-gray-500 hover:text-gray-900 text-sm font-light"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <Brain className="w-8 h-8 text-gray-900" />
            <h1 className="text-5xl font-semibold text-gray-900 tracking-tight">
              Causal Investigation
            </h1>
          </div>
          <p className="text-lg text-gray-600 mt-4 font-light">
            Multi-hypothesis autonomous reasoning with evidence discovery
          </p>
        </div>

        {/* Not Started */}
        {!investigationResults && !isInvestigating && (
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-16 text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-8" />
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">
                Ready to Investigate
              </h2>
              <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-base font-light leading-relaxed">
                Generate competing hypotheses, gather evidence from multiple sources,
                and identify proven causal factors behind switching behavior.
              </p>
              <Button
                onClick={() => investigateMutation.mutate()}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base"
                data-testid="button-start-investigation"
              >
                Start Investigation
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* In Progress */}
        {isInvestigating && (
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-12">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                    Investigation in Progress
                  </h3>
                  <p className="text-base text-gray-600 font-light mt-1">
                    Generating hypotheses and gathering evidence...
                  </p>
                </div>
              </div>
              <Progress value={66} className="h-2 bg-gray-100" />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {investigationResults && (
          <div className="space-y-12">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border border-gray-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total Hypotheses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900">
                    {allHypotheses.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Proven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900">
                    {provenHypotheses.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Ruled Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900">
                    {ruledOut.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hypothesis Analysis: Three-Phase Framework */}
            <div className="mb-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">1</div>
                  <span className="text-sm font-medium text-gray-700">Hypothesis</span>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">2</div>
                  <span className="text-sm font-medium text-gray-700">Correlation</span>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">3</div>
                  <span className="text-sm font-medium text-gray-700">Causality</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">Causal Hypotheses</h2>
              <div className="space-y-6">
              {allHypotheses.map((result: HypothesisResult, index: number) => (
                <motion.div
                  key={result.hypothesis.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border ${result.evidence.finalConfidence >= 70 ? 'border-gray-900' : 'border-gray-200'} bg-white`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getVerdictBadge(result.evidence.verdict)}
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {result.hypothesis.title}
                            </CardTitle>
                          </div>
                          <p className="text-sm text-gray-600">{result.hypothesis.description}</p>
                        </div>
                        <div className="text-right ml-6">
                          <div className="text-3xl font-semibold text-gray-900">
                            {result.evidence.finalConfidence}%
                          </div>
                          <div className="text-xs text-gray-500">
                            confidence
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={result.evidence.finalConfidence} className="h-1.5 bg-gray-100 mb-6" />

                      {/* Causal Chain */}
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Causal Chain</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.hypothesis.causalChain.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">
                                {step}
                              </span>
                              {idx < result.hypothesis.causalChain.length - 1 && (
                                <span className="text-gray-400">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evidence */}
                      {result.evidence.evidenceFound.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Evidence ({result.evidence.evidenceFound.length})
                          </h4>
                          <div className="space-y-2">
                            {result.evidence.evidenceFound.map((evidence, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg text-sm border border-gray-200 bg-gray-50"
                              >
                                <div className="flex items-start gap-2">
                                  {evidence.supportsHypothesis ? (
                                    <CheckCircle2 className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-xs">{evidence.source}</div>
                                    <div className="text-gray-700 mt-1">{evidence.finding}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            </div>

            {/* Human Confirmation Section */}
            {provenHypotheses.length > 0 && (
              <Card className="border border-gray-900 bg-white">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-gray-900" />
                    <div>
                      <CardTitle className="text-xl">Review & Confirm Root Causes</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Select proven hypotheses you agree with before generating strategies
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Hypothesis Selection */}
                    <div className="space-y-3">
                      {provenHypotheses.map((result: HypothesisResult) => (
                        <div
                          key={result.hypothesis.id}
                          className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors"
                          data-testid={`hypothesis-confirm-${result.hypothesis.id}`}
                        >
                          <Checkbox
                            checked={selectedHypotheses.has(result.hypothesis.id)}
                            onCheckedChange={() => toggleHypothesis(result.hypothesis.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{result.hypothesis.title}</h4>
                              {getVerdictBadge(result.evidence.verdict)}
                              <Badge variant="outline" className="text-xs">
                                {result.evidence.finalConfidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{result.hypothesis.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* SME Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SME Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any additional context or notes about your confirmation..."
                        value={smeNotes}
                        onChange={(e) => setSmeNotes(e.target.value)}
                        className="min-h-[80px] text-sm"
                        data-testid="input-sme-notes"
                      />
                    </div>

                    {/* Confirmation Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        {selectedHypotheses.size} of {provenHypotheses.length} hypotheses selected
                      </div>
                      <Button
                        onClick={() => confirmMutation.mutate()}
                        disabled={selectedHypotheses.size === 0 || confirmMutation.isPending}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                        data-testid="button-confirm-hypotheses"
                      >
                        {confirmMutation.isPending ? (
                          <>Confirming...</>
                        ) : (
                          <>
                            Confirm & Generate Strategies
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
