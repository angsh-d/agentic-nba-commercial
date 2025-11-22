import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Brain, 
  CheckCircle2, 
  XCircle,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
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
  const [investigationResults, setInvestigationResults] = useState<any>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

  const investigateMutation = useMutation({
    mutationFn: () => triggerInvestigation(Number(hcpId)),
    onMutate: () => {
      setIsInvestigating(true);
      toast.info("Starting Investigation");
    },
    onSuccess: (data) => {
      setInvestigationResults(data.investigation);
      setIsInvestigating(false);
      toast.success(`${data.investigation.provenHypotheses.length} hypotheses proven`);
    },
    onError: () => {
      setIsInvestigating(false);
      toast.error("Investigation failed");
    },
  });

  const allHypotheses: HypothesisResult[] = investigationResults?.allHypotheses || [];
  const provenHypotheses = investigationResults?.provenHypotheses || [];
  const ruledOut = investigationResults?.ruledOut || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href={`/hcp/${hcpId}`}>
            <Button
              variant="ghost"
              className="mb-6 -ml-3 text-gray-600 hover:text-gray-900 text-sm"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-gray-900" />
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
              Causal Investigation
            </h1>
          </div>
          <p className="text-base text-gray-600 mt-2">
            Multi-hypothesis autonomous reasoning with evidence discovery
          </p>
        </div>

        {/* Not Started */}
        {!investigationResults && !isInvestigating && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Ready to Investigate
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-sm">
                Generate competing hypotheses, gather evidence from multiple sources,
                and identify proven causal factors behind switching behavior.
              </p>
              <Button
                onClick={() => investigateMutation.mutate()}
                className="bg-gray-900 hover:bg-gray-800 text-white"
                data-testid="button-start-investigation"
              >
                Start Investigation
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* In Progress */}
        {isInvestigating && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Investigation in Progress
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generating hypotheses and gathering evidence...
                  </p>
                </div>
              </div>
              <Progress value={66} className="h-1.5 bg-gray-100" />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {investigationResults && (
          <div className="space-y-8">
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

            {/* Hypotheses List */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Hypotheses</h2>
              
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

            {/* CTA to NBA Strategy */}
            {provenHypotheses.length > 0 && (
              <Card className="border border-gray-900 bg-gray-900 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        View Ensemble NBA Strategies
                      </h3>
                      <p className="text-sm text-gray-300">
                        See AI-generated recommendations based on proven hypotheses
                      </p>
                    </div>
                    <Link href={`/hcp/${hcpId}`}>
                      <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                        View Strategies
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
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
