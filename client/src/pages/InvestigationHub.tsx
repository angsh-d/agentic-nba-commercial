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
  AlertCircle, 
  Sparkles,
  TrendingUp
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

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case "proven":
    case "likely":
      return "bg-green-500";
    case "possible":
      return "bg-yellow-500";
    case "unlikely":
    case "disproven":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getVerdictIcon(verdict: string) {
  switch (verdict) {
    case "proven":
    case "likely":
      return <CheckCircle2 className="w-5 h-5" />;
    case "possible":
      return <AlertCircle className="w-5 h-5" />;
    case "unlikely":
    case "disproven":
      return <XCircle className="w-5 h-5" />;
    default:
      return null;
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
      toast.info("Starting Causal Investigation", {
        description: "AI is generating competing hypotheses...",
      });
    },
    onSuccess: (data) => {
      setInvestigationResults(data.investigation);
      setIsInvestigating(false);
      toast.success("Investigation Complete", {
        description: `${data.investigation.provenHypotheses.length} hypotheses proven`,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <main className="container mx-auto px-12 py-16 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Link href={`/hcp/${hcpId}`}>
            <Button
              variant="ghost"
              className="mb-6 -ml-2 text-gray-500 hover:text-gray-900"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to HCP Details
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
                Causal Investigation Hub
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Multi-hypothesis autonomous reasoning & evidence discovery
              </p>
            </div>
          </div>
        </div>

        {/* Investigation Status */}
        {!investigationResults && !isInvestigating && (
          <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Ready to Investigate Root Causes
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Our AI agents will generate multiple competing hypotheses, gather evidence from various data sources,
                test each hypothesis objectively, and identify the proven causal factors behind switching behavior.
              </p>
              <Button
                size="lg"
                onClick={() => investigateMutation.mutate()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg"
                data-testid="button-start-investigation"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start Causal Investigation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Investigation in Progress */}
        {isInvestigating && (
          <div className="space-y-6">
            <Card className="border-2 border-purple-200">
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      AI Investigation in Progress
                    </h3>
                    <p className="text-gray-600">
                      Generating hypotheses, gathering evidence, and testing causal relationships...
                    </p>
                  </div>
                </div>
                <Progress value={66} className="h-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Investigation Results */}
        {investigationResults && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      Total Hypotheses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-600">
                      {allHypotheses.length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Generated & tested</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-900">
                      Proven Hypotheses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                      {provenHypotheses.length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Strong evidence found</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-900">
                      Ruled Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-red-600">
                      {ruledOut.length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Insufficient evidence</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* All Hypotheses */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Hypotheses Ranked by Evidence</h2>
              
              {allHypotheses.map((result: HypothesisResult, index: number) => (
                <motion.div
                  key={result.hypothesis.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-2 ${result.evidence.finalConfidence >= 70 ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-white' : result.evidence.finalConfidence < 40 ? 'border-red-200 bg-gray-50' : 'border-yellow-200'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${getVerdictColor(result.evidence.verdict)} text-white`}>
                              <div className="flex items-center gap-1">
                                {getVerdictIcon(result.evidence.verdict)}
                                <span className="capitalize">{result.evidence.verdict}</span>
                              </div>
                            </Badge>
                            <CardTitle className="text-xl">{result.hypothesis.title}</CardTitle>
                          </div>
                          <p className="text-gray-600 text-sm">{result.hypothesis.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-gray-900">
                            {result.evidence.finalConfidence}%
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Confidence
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={result.evidence.finalConfidence} className="h-2 mb-6" />

                      {/* Causal Chain */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Causal Chain:</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.hypothesis.causalChain.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {step}
                              </Badge>
                              {idx < result.hypothesis.causalChain.length - 1 && (
                                <span className="text-gray-400">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evidence Found */}
                      {result.evidence.evidenceFound.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Evidence ({result.evidence.evidenceFound.length} findings):
                          </h4>
                          <div className="space-y-2">
                            {result.evidence.evidenceFound.map((evidence, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg text-sm ${
                                  evidence.supportsHypothesis
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {evidence.supportsHypothesis ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{evidence.source}</div>
                                    <div className="text-gray-700 mt-1">{evidence.finding}</div>
                                    <Badge
                                      variant="outline"
                                      className="mt-2 text-xs capitalize"
                                    >
                                      {evidence.strength} evidence
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Reasoning */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Analysis:</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {result.evidence.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Next Steps */}
            {provenHypotheses.length > 0 && (
              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Next Steps: Strategic Intervention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    With {provenHypotheses.length} proven causal factor{provenHypotheses.length > 1 ? 's' : ''} identified,
                    our Ensemble NBA Agent can now design targeted intervention strategies.
                  </p>
                  <Link href={`/hcp/${hcpId}`}>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      View Strategic Recommendations →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
