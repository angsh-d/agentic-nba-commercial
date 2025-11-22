import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertTriangle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Activity,
  Brain,
  Target,
  Eye,
  Lightbulb
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface HCP {
  id: number;
  name: string;
  specialty: string;
  hospital: string;
  territory: string;
  switchRiskScore: number;
  switchRiskTier: string;
  engagementLevel: string;
  createdAt: string;
}

async function fetchHCPs(): Promise<HCP[]> {
  const response = await fetch("/api/hcps");
  if (!response.ok) throw new Error("Failed to fetch HCPs");
  return response.json();
}

function getRiskLevel(tier: string, score: number) {
  if (tier === "high" || score >= 70) return { label: "High Risk", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" };
  if (tier === "medium" || score >= 40) return { label: "Medium Risk", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" };
  return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" };
}

function getEngagementLabel(level: string) {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  if (level === "low") return "Low";
  return "Not Set";
}

function calculateAccountAge(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
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
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      
      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white" />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-40 text-center max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div className="mb-6">
              <span className="text-sm font-semibold tracking-wider text-gray-600 uppercase">
                Agentic AI Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl md:text-8xl font-semibold tracking-tight mb-8 bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent leading-[1.15] pb-2">
              Territory Intelligence.
              <br />
              Reimagined.
            </h1>

            {/* Subheadline */}
            <p className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Autonomous AI agents detect prescription switching and generate contextual Next Best Actions in real-time.
            </p>

            {/* Agent Icons */}
            <div className="flex items-center justify-center gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500">Planner</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/50">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500">Analyst</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500">Synthesizer</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500">Reflector</span>
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-sm text-gray-400"
            >
              <div className="inline-block animate-bounce">↓</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Territory Section - Apple Style */}
      <section className="relative bg-white text-black py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
              Your Territory
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Select a healthcare provider to unlock AI-powered insights and intelligent recommendations.
            </p>
          </div>

          {/* HCP Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
                <p className="text-base text-gray-600 font-light">Loading providers...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
              {hcps.map((hcp, index) => {
                const risk = getRiskLevel(hcp.switchRiskTier, hcp.switchRiskScore);
                const accountAge = calculateAccountAge(hcp.createdAt);
                return (
                  <motion.div
                    key={hcp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  >
                    <Link href={`/hcp/${hcp.id}`}>
                      <Card 
                        className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-[1.005] border border-gray-200 bg-white overflow-hidden rounded-[32px]"
                        data-testid={`card-hcp-${hcp.id}`}
                      >
                        <CardContent className="p-10">
                          <div className="flex items-start justify-between mb-8">
                            <div className="flex items-start gap-8 flex-1">
                              {/* Avatar */}
                              <Avatar className="w-24 h-24 border-0 shadow-lg">
                                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {hcp.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>

                              {/* Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                  <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                                    {hcp.name}
                                  </h3>
                                  <Badge 
                                    className={`${risk.bgColor} ${risk.textColor} border-0 px-4 py-2 text-sm font-semibold rounded-full`}
                                    data-testid={`badge-risk-${hcp.id}`}
                                  >
                                    {risk.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-base text-gray-600 font-light">
                                  <span className="flex items-center gap-2.5">
                                    <Activity className="w-5 h-5 text-gray-400" />
                                    {hcp.specialty}
                                  </span>
                                  <span className="flex items-center gap-2.5">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    {hcp.hospital}, {hcp.territory}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Risk Score */}
                            <div className="text-right">
                              <div className="text-6xl font-bold text-gray-900 mb-2 leading-none">
                                {hcp.switchRiskScore}
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                                Switch Risk
                              </div>
                            </div>
                          </div>

                          {/* Insights Grid */}
                          <div className="grid grid-cols-2 gap-8 p-8 bg-gray-50 rounded-[28px] mb-6">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                                Engagement Level
                              </div>
                              <div className="text-xl font-semibold text-gray-900">
                                {getEngagementLabel(hcp.engagementLevel)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                                Account Age
                              </div>
                              <div className="text-xl font-semibold text-gray-900">
                                {accountAge} {accountAge === 1 ? 'month' : 'months'}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-end text-base font-medium text-gray-500 group-hover:text-black transition-colors">
                            <span className="tracking-tight">Analyze & Generate NBAs</span>
                            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <section className="bg-white border-t border-gray-200 text-black py-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Saama. Powered by Azure OpenAI GPT-5-mini.
          </p>
        </div>
      </section>
    </div>
  );
}
