import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TerritoryPlan } from "@/components/TerritoryPlan";
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Zap,
  ChevronRight,
  LineChart,
  Calendar,
  Mail,
  Phone,
  Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/minimalist_abstract_white_and_grey_3d_network_data_flow.png";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNbas, fetchStats, fetchLatestAnalytics } from "@/lib/api";
import type { NbaWithHcp } from "@/lib/api";

const copilotSuggestions = [
  {
    title: "Territory Plan Generated",
    description: "Based on recent switch patterns, I've prioritized 5 HCPs for you to visit this week.",
    action: "View Plan"
  },
  {
    title: "Follow-up Required",
    description: "You haven't logged a response from Dr. Lee regarding the sample request.",
    action: "Draft Email"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("actions");
  const [planOpen, setPlanOpen] = useState(false);

  const { data: nbas = [], isLoading: nbasLoading } = useQuery({
    queryKey: ["nbas"],
    queryFn: fetchNbas,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchLatestAnalytics,
  });

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-gray-200">
      <Navbar />
      <TerritoryPlan open={planOpen} onOpenChange={setPlanOpen} />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative h-[600px] overflow-hidden bg-white border-b border-gray-100 flex items-center">
          <div className="absolute inset-0 z-0">
             <img 
               src={heroImage} 
               alt="Abstract Data Flow" 
               className="w-full h-full object-cover opacity-30 mix-blend-multiply grayscale contrast-125"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-white/10" />
             <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
          </div>

          <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center max-w-7xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-8">
                <Badge variant="secondary" className="bg-gray-100/80 backdrop-blur-sm text-gray-600 border-gray-200 px-4 py-1.5 rounded-full font-semibold tracking-wider uppercase text-[11px] shadow-sm">
                  Agentic AI Platform v2.0
                </Badge>
              </div>
              
              <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tight text-[#1d1d1f] mb-6 leading-[1.05] -ml-1">
                Agentic AI. <br />
                <span className="text-[#86868b]">Contextual Action.</span>
              </h1>
              
              <p className="text-[21px] md:text-[24px] text-[#86868b] font-normal leading-relaxed mb-10 max-w-2xl tracking-tight">
                Transforming commercial optimization with autonomous agents that reason, plan, and adapt in real-time.
              </p>
              
              <div className="flex items-center gap-5">
                <Button size="lg" className="rounded-full h-14 px-10 text-[17px] font-medium bg-[#1d1d1f] hover:bg-black text-white shadow-xl shadow-gray-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Explore Agents
                </Button>
                <Button size="lg" variant="outline" className="rounded-full h-14 px-10 text-[17px] font-medium border-[#d2d2d7] text-[#1d1d1f] hover:bg-gray-50 hover:text-black transition-all hover:border-[#86868b]">
                  View Roadmap
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Content */}
        <div className="container mx-auto px-6 py-16 max-w-[1400px]">
          
          {/* Stats Overview - Bento Grid Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Active HCPs", value: stats?.activeHcps?.toString() || "0", trend: "+2.4%", icon: Users, sub: "vs last month" },
              { label: "Switching Risks", value: stats?.switchingRisks?.toString() || "0", trend: "-12%", icon: Activity, alert: true, sub: "requires attention" },
              { label: "Actions Completed", value: stats?.actionsCompleted ? `${Math.round((stats.actionsCompleted / stats.totalActions) * 100)}%` : "0%", trend: "+5.1%", icon: Activity, sub: "completion rate" },
              { label: "Agent Accuracy", value: `${stats?.agentAccuracy || 0}%`, trend: "+1.2%", icon: Brain, sub: "model confidence" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
              >
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 rounded-[24px] overflow-hidden h-full">
                  <CardContent className="p-8 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-2.5 rounded-2xl ${stat.alert ? 'bg-red-50 text-red-500' : 'bg-[#F5F5F7] text-black'}`}>
                        <stat.icon className="h-5 w-5 stroke-[1.5px]" />
                      </div>
                      <span className={`text-[13px] font-semibold px-3 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[42px] font-semibold tracking-tighter text-[#1d1d1f] mb-1">{stat.value}</h3>
                      <p className="text-[15px] font-medium text-[#86868b]">{stat.label}</p>
                      <p className="text-[13px] text-gray-400 mt-1 font-normal">{stat.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Main Feed: Next Best Actions (Phase 1) */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Next Best Actions</h2>
                <Tabs defaultValue="actions" className="w-auto">
                  <TabsList className="bg-[#F5F5F7] rounded-full p-1 h-10">
                    <TabsTrigger value="actions" className="rounded-full text-[13px] font-medium px-5 h-8 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">Priority</TabsTrigger>
                    <TabsTrigger value="all" className="rounded-full text-[13px] font-medium px-5 h-8 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">All HCPs</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-6">
                {nbasLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
                  </div>
                ) : nbas.length === 0 ? (
                  <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[24px] p-12 text-center">
                    <p className="text-[#86868b]">No actions available at the moment.</p>
                  </Card>
                ) : (
                  nbas.map((item) => {
                    const daysSinceVisit = item.hcp.lastVisitDate 
                      ? Math.floor((Date.now() - new Date(item.hcp.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="group"
                        data-testid={`card-nba-${item.id}`}
                      >
                        <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 rounded-[24px] overflow-hidden bg-white group-hover:scale-[1.005]">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-8">
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-5">
                                  <Avatar className="h-14 w-14 border border-black/5 bg-[#F5F5F7] shadow-sm">
                                    <AvatarFallback className="text-[#1d1d1f] font-semibold text-base">
                                      {item.hcp.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-[19px] font-semibold text-[#1d1d1f] flex items-center gap-3 mb-1" data-testid={`text-hcp-name-${item.id}`}>
                                      {item.hcp.name}
                                      {item.priority === 'High' && (
                                        <span className="flex h-2 w-2 relative">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-[15px] text-[#86868b] font-normal">{item.hcp.specialty} • {item.hcp.hospital}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider border border-black/5 text-[#86868b] bg-[#F5F5F7]">
                                  {item.actionType}
                                </Badge>
                              </div>

                              {/* AI Reasoning Layer - Apple Style */}
                              <div className="bg-[#F5F5F7]/50 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                                <div className="flex items-start gap-4">
                                  <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                                    <Sparkles className="h-4 w-4 text-[#1d1d1f]" />
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    <p className="text-[15px] font-semibold text-[#1d1d1f]" data-testid={`text-action-${item.id}`}>
                                      {item.action}
                                    </p>
                                    <p className="text-[15px] text-[#86868b] leading-relaxed font-normal" data-testid={`text-insight-${item.id}`}>
                                      {item.aiInsight}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-6 text-[13px] text-[#86868b] font-medium">
                                  <span className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 rounded-lg">
                                    <Activity className="h-3.5 w-3.5" /> Switch Risk Detected
                                  </span>
                                  {daysSinceVisit !== null && (
                                    <span className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 rounded-lg">
                                      <Calendar className="h-3.5 w-3.5" /> Last Visit: {daysSinceVisit} days ago
                                    </span>
                                  )}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  className="text-[#1d1d1f] hover:bg-[#F5F5F7] font-medium text-[14px] rounded-full px-5 h-10 group-hover:translate-x-1 transition-all"
                                  data-testid={`button-action-${item.id}`}
                                >
                                  Take Action <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar: Agent Copilot (Phase 2) & Analytics */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Agent Copilot Card - iOS/macOS Widget Style */}
              <Card className="bg-black text-white border-none shadow-2xl rounded-[32px] overflow-hidden relative h-[500px] flex flex-col">
                 {/* Abstract Background Mesh */}
                 <div className="absolute top-0 right-0 p-40 bg-[#2997ff]/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                 <div className="absolute bottom-0 left-0 p-32 bg-[#af52de]/20 rounded-full blur-[100px] -ml-16 -mb-16 pointer-events-none" />
                 
                 <CardHeader className="pb-4 relative z-10 pt-8 px-8">
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-[19px] font-semibold tracking-tight">Agent Copilot</CardTitle>
                            <CardDescription className="text-gray-400 text-[13px]">Active Orchestration</CardDescription>
                        </div>
                     </div>
                     <div className="h-2 w-2 rounded-full bg-[#30d158] shadow-[0_0_10px_#30d158]" />
                   </div>
                 </CardHeader>

                 <CardContent className="relative z-10 px-8 flex-1 overflow-y-auto no-scrollbar">
                   <div className="space-y-4">
                     {copilotSuggestions.map((suggestion, i) => (
                       <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        onClick={() => suggestion.action === "View Plan" && setPlanOpen(true)}
                        className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-[20px] p-5 transition-all cursor-pointer border border-white/5 group"
                       >
                         <h4 className="text-[15px] font-semibold text-white mb-2 group-hover:text-[#2997ff] transition-colors">{suggestion.title}</h4>
                         <p className="text-[13px] text-gray-400 mb-4 leading-relaxed font-normal">{suggestion.description}</p>
                         <div className="flex items-center text-[13px] font-medium text-white/80 group-hover:text-white">
                           {suggestion.action} <ChevronRight className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 </CardContent>

                 <CardFooter className="relative z-10 border-t border-white/10 p-6 bg-black/20 backdrop-blur-xl mt-auto">
                   <div className="flex w-full items-center gap-3 bg-white/10 rounded-full px-5 py-3 border border-white/5 focus-within:bg-white/15 transition-colors">
                     <MessageSquare className="h-4 w-4 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Ask Copilot..." 
                       className="bg-transparent border-none text-[14px] text-white placeholder:text-gray-500 focus:outline-none w-full font-normal"
                     />
                     <button className="h-7 w-7 rounded-full bg-white flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                       <ArrowRight className="h-3.5 w-3.5 text-black" />
                     </button>
                   </div>
                 </CardFooter>
              </Card>

              {/* Root Cause Analytics (Phase 3 Mockup) */}
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                  <CardTitle className="text-[19px] font-semibold text-[#1d1d1f] tracking-tight">Switching Root Causes</CardTitle>
                  <CardDescription className="text-[13px]">AI-diagnosed factors for Q3</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-6">
                    {[
                      { label: "Clinical Efficacy", value: analytics?.clinicalEfficacy || 45, color: "bg-[#1d1d1f]" },
                      { label: "Patient Access", value: analytics?.patientAccess || 30, color: "bg-gray-500" },
                      { label: "Side Effect Profile", value: analytics?.sideEffects || 15, color: "bg-gray-300" },
                      { label: "Competitor Pricing", value: analytics?.competitorPricing || 10, color: "bg-gray-100" }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[13px] font-medium mb-2">
                          <span className="text-[#1d1d1f]">{item.label}</span>
                          <span className="text-[#86868b]">{item.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            transition={{ duration: 1.2, delay: 0.5, ease: "circOut" }}
                            className={`h-full rounded-full ${item.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full rounded-full text-[13px] font-medium h-11 mt-8 border-gray-200 text-[#1d1d1f] hover:bg-[#F5F5F7] hover:border-transparent transition-all">
                     View Full Analysis
                   </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Icon Component placeholders if lucide is missing (it's not, but for safety)
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
