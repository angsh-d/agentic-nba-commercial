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
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-32 text-center max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div className="mb-6">
              <span className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
                Agentic AI Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl md:text-8xl font-semibold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-none">
              Territory Intelligence.
              <br />
              Reimagined.
            </h1>

            {/* Subheadline */}
            <p className="text-2xl md:text-3xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
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
              className="text-sm text-gray-500"
            >
              <div className="inline-block animate-bounce">↓</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Territory Section - Apple Style */}
      <section className="relative bg-white text-black py-24">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
              Your Territory
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select a healthcare provider to unlock AI-powered insights and intelligent recommendations.
            </p>
          </div>

          {/* HCP Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading providers...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {hcps.map((hcp, index) => {
                const risk = getRiskLevel(hcp.riskScore);
                return (
                  <motion.div
                    key={hcp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  >
                    <Link href={`/hcp/${hcp.id}`}>
                      <Card 
                        className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] border-gray-200 bg-white overflow-hidden"
                        data-testid={`card-hcp-${hcp.id}`}
                      >
                        <CardContent className="p-8">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-start gap-6 flex-1">
                              {/* Avatar */}
                              <Avatar className="w-20 h-20 border-2 border-gray-100">
                                <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {hcp.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>

                              {/* Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="text-3xl font-semibold text-gray-900">
                                    {hcp.name}
                                  </h3>
                                  <Badge 
                                    className={`${risk.bgColor} ${risk.textColor} border-0 px-3 py-1.5`}
                                    data-testid={`badge-risk-${hcp.id}`}
                                  >
                                    {risk.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-base text-gray-600">
                                  <span className="flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    {hcp.specialty}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    {hcp.institution}, {hcp.location}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Risk Score */}
                            <div className="text-right">
                              <div className="text-5xl font-bold text-gray-900 mb-1">
                                {hcp.riskScore}
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Switch Risk
                              </div>
                            </div>
                          </div>

                          {/* Insights Grid */}
                          <div className="grid grid-cols-3 gap-6 p-6 bg-gray-50 rounded-3xl mb-6">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                                Engagement
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {hcp.engagement || "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                                Rx Trend
                                {getTrendIcon(hcp.prescriptionTrend)}
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {hcp.prescriptionTrend || "Stable"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                                Account Age
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {hcp.accountAge ?? 0} months
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-end text-base font-semibold text-gray-600 group-hover:text-black transition-colors">
                            <span>Analyze & Generate NBAs</span>
                            <ChevronRight className="w-6 h-6 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
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
      <section className="bg-gray-100 text-black py-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Saama. Powered by Azure OpenAI GPT-5-mini.
          </p>
        </div>
      </section>
    </div>
  );
}
