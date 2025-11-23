import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnsembleNBAPanel } from "@/components/EnsembleNBAPanel";
import { ArrowLeft, Brain, AlertCircle, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";

interface NBAResults {
  hasResults: boolean;
  session?: any;
  nba?: any;
}

interface InvestigationResults {
  hasInvestigation: boolean;
  session?: any;
  provenHypotheses?: any[];
  allHypotheses?: any[];
  confirmedHypotheses?: any[];
  isConfirmed?: boolean;
}

async function fetchNBAResults(hcpId: string): Promise<NBAResults> {
  const response = await fetch(`/api/ai/nba-results/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch NBA results");
  return response.json();
}

async function fetchInvestigationResults(hcpId: string): Promise<InvestigationResults> {
  const response = await fetch(`/api/ai/investigation-results/${hcpId}`);
  if (!response.ok) throw new Error("Failed to fetch investigation results");
  return response.json();
}

export default function StrategiesPage() {
  const [, params] = useRoute("/hcp/:id/strategies");
  const hcpId = params?.id;

  const { data: investigationResults } = useQuery({
    queryKey: ["investigation-results", hcpId],
    queryFn: () => fetchInvestigationResults(hcpId!),
    enabled: !!hcpId,
  });

  const confirmedHypotheses = investigationResults?.confirmedHypotheses || [];
  const hasInvestigation = investigationResults?.hasInvestigation || false;
  const isConfirmed = investigationResults?.isConfirmed || false;
  
  // Guard: Only allow access if investigation is confirmed with hypotheses
  const canAccessStrategies = hasInvestigation && 
                               isConfirmed && 
                               Array.isArray(confirmedHypotheses) && 
                               confirmedHypotheses.length > 0;

  const { data: nbaResults } = useQuery({
    queryKey: ["nba-results", hcpId],
    queryFn: () => fetchNBAResults(hcpId!),
    enabled: !!hcpId && canAccessStrategies, // Only fetch if access is allowed
    // Poll every 3 seconds if investigation is confirmed but NBA not yet generated
    refetchInterval: (query) => {
      const currentData = query.state.data as NBAResults | undefined;
      const isGenerating = canAccessStrategies && !currentData?.nba;
      return isGenerating ? 3000 : false;
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-20">
        {/* Back Button */}
        <Link href={`/hcp/${hcpId}`}>
          <Button
            variant="ghost"
            className="mb-12 -ml-3 text-gray-500 hover:text-gray-900 transition-colors text-sm font-light"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to HCP
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-4">
            <Brain className="w-8 h-8 text-gray-900" />
            <h1 className="text-5xl font-semibold text-gray-900 tracking-tight">
              Strategy Recommendations
            </h1>
          </div>
          <p className="text-lg text-gray-600 font-light">
            AI-generated ensemble strategies based on proven root causes
          </p>
        </div>

        {/* Guard: Must confirm investigation before accessing strategies */}
        {!canAccessStrategies && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12">
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                  Investigation Required
                </h3>
                <p className="text-base text-gray-600 mb-8 font-light leading-relaxed">
                  {!hasInvestigation && "Complete the causal investigation and confirm root causes to generate AI strategy recommendations."}
                  {hasInvestigation && !isConfirmed && "Review and confirm your investigation findings to generate AI strategy recommendations."}
                  {hasInvestigation && isConfirmed && confirmedHypotheses.length === 0 && "At least one proven hypothesis must be confirmed to generate strategies."}
                </p>
                <Link href={`/hcp/${hcpId}/investigate`}>
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    data-testid="button-complete-investigation"
                  >
                    {!hasInvestigation && "Start Investigation"}
                    {hasInvestigation && !isConfirmed && "Review & Confirm"}
                    {hasInvestigation && isConfirmed && "Return to Investigation"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NBA Ensemble Panel or Loading State - Only show if access is allowed */}
        {canAccessStrategies && (
          <>
            {nbaResults?.nba ? (
              <EnsembleNBAPanel 
                nba={nbaResults.nba} 
                provenHypotheses={confirmedHypotheses}
              />
            ) : (
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-16 text-center">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-8 animate-pulse" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight">
                    Generating Strategies...
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-base font-light leading-relaxed">
                    Our AI agents are analyzing the confirmed root causes and generating personalized strategy recommendations across three sources: RL-based patterns, compliance rules, and autonomous AI reasoning.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-8 font-light">
                    This typically takes 30-60 seconds. Page will auto-refresh when complete.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
