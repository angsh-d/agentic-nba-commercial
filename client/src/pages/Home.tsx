import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertTriangle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface HCP {
  id: number;
  name: string;
  specialty: string;
  institution: string;
  location: string;
  riskScore: number;
  engagement: string;
  prescriptionTrend: string;
  accountAge: number;
}

async function fetchHCPs(): Promise<HCP[]> {
  const response = await fetch("/api/hcps");
  if (!response.ok) throw new Error("Failed to fetch HCPs");
  return response.json();
}

function getRiskLevel(score: number) {
  if (score >= 70) return { label: "High Risk", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" };
  if (score >= 40) return { label: "Medium Risk", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" };
  return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" };
}

function getTrendIcon(trend: string | undefined | null) {
  if (!trend) return <Activity className="w-4 h-4 text-gray-400" />;
  if (trend.includes("Decreasing")) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (trend.includes("Increasing")) return <TrendingUp className="w-4 h-4 text-green-500" />;
  return <Activity className="w-4 h-4 text-gray-400" />;
}

export default function Home() {
  const { data: hcps = [], isLoading } = useQuery({
    queryKey: ["hcps"],
    queryFn: fetchHCPs,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-white border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30" />
        <div className="relative container mx-auto px-6 py-16 max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-6">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Agentic AI Platform
              </span>
            </div>
            <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              Territory Intelligence
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              AI-powered prescription switching detection and contextual Next Best Actions for your territory
            </p>
          </div>
        </div>
      </section>
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Healthcare Providers
          </h2>
          <p className="text-base text-gray-600">
            Select an HCP to analyze switching risk and generate intelligent recommendations
          </p>
        </div>

        {/* HCP Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading HCPs...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {hcps.map((hcp) => {
              const risk = getRiskLevel(hcp.riskScore);
              return (
                <Link key={hcp.id} href={`/hcp/${hcp.id}`}>
                  <Card 
                    className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] border-gray-200 bg-white/80 backdrop-blur-sm"
                    data-testid={`card-hcp-${hcp.id}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <Avatar className="w-16 h-16 border-2 border-gray-200">
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {hcp.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-2xl text-gray-900">
                                {hcp.name}
                              </CardTitle>
                              <Badge 
                                className={`${risk.bgColor} ${risk.textColor} border-0 px-3 py-1`}
                                data-testid={`badge-risk-${hcp.id}`}
                              >
                                {risk.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1.5">
                                <Activity className="w-4 h-4" />
                                {hcp.specialty}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {hcp.institution}, {hcp.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Score */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {hcp.riskScore}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Switch Risk
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Insights Grid */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Engagement
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {hcp.engagement || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            Rx Trend
                            {getTrendIcon(hcp.prescriptionTrend)}
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {hcp.prescriptionTrend || "Stable"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Account Age
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {hcp.accountAge ?? 0} months
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 flex items-center justify-end text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                        <span>Analyze & Generate NBAs</span>
                        <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
