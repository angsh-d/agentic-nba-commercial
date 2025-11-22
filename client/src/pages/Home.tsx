import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useState } from "react";

// Mock Data for "Enrichment Layer" (Phase 1)
const nextBestActions = [
  {
    id: 1,
    hcp: "Dr. Sarah Smith",
    specialty: "Oncologist",
    hospital: "Memorial Sloan Kettering",
    action: "Schedule Clinical Review",
    priority: "High",
    reason: "Increased use of Competitor X in renal cell carcinoma since Q2.",
    aiInsight: "Dr. Smith's switch likely correlates with new efficacy data for younger patients released last month. Suggest highlighting our Phase 3 long-term survival data.",
    type: "meeting"
  },
  {
    id: 2,
    hcp: "Dr. James Wilson",
    specialty: "Hematologist",
    hospital: "Mount Sinai",
    action: "Send Email: Dosing Guidelines",
    priority: "Medium",
    reason: "Recent drop in prescriptions for 2nd line therapy.",
    aiInsight: "Pattern analysis suggests potential confusion regarding the new dosing protocol. A clarification email with the simplified dosing chart has a 85% predicted success rate.",
    type: "email"
  },
  {
    id: 3,
    hcp: "Dr. Emily Chen",
    specialty: "Oncologist",
    hospital: "NY Presbyterian",
    action: "Invite to Symposium",
    priority: "Low",
    reason: "High engagement with recent webinar content.",
    aiInsight: "Dr. Chen is showing high interest in immunotherapy combinations. The upcoming symposium aligns perfectly with her recent research publications.",
    type: "event"
  }
];

// Mock Data for "Agent Copilot" (Phase 2)
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

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-gray-200">
      <Navbar />
      
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
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Active HCPs", value: "1,248", trend: "+2.4%", icon: Users },
              { label: "Switching Risks", value: "14", trend: "-12%", icon: Activity, alert: true },
              { label: "Actions Completed", value: "86%", trend: "+5.1%", icon: CheckCircle },
              { label: "Agent Accuracy", value: "94.2%", trend: "+1.2%", icon: Brain }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-xl ${stat.alert ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-900'}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</h3>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Feed: Next Best Actions (Phase 1) */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Next Best Actions</h2>
                <Tabs defaultValue="actions" className="w-auto">
                  <TabsList className="bg-gray-100 rounded-full p-1 h-9">
                    <TabsTrigger value="actions" className="rounded-full text-xs px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">Priority</TabsTrigger>
                    <TabsTrigger value="all" className="rounded-full text-xs px-4 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">All HCPs</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                {nextBestActions.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="group"
                  >
                    <Card className="border border-gray-200 shadow-none hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                      <div className="flex flex-col md:flex-row">
                        {/* Left Status Strip */}
                        <div className={`w-full md:w-1.5 ${
                          item.priority === 'High' ? 'bg-gray-900' : 
                          item.priority === 'Medium' ? 'bg-gray-400' : 'bg-gray-200'
                        }`} />
                        
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border border-gray-100 bg-gray-50">
                                <AvatarFallback className="text-gray-700 font-semibold text-sm">{item.hcp.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  {item.hcp}
                                  {item.priority === 'High' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                                </h3>
                                <p className="text-sm text-gray-500">{item.specialty} • {item.hospital}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider border-gray-200 text-gray-600 bg-gray-50">
                              {item.type}
                            </Badge>
                          </div>

                          {/* AI Reasoning Layer */}
                          <div className="bg-gray-50/80 rounded-xl p-4 mb-4 border border-gray-100 group-hover:border-gray-200 transition-colors">
                            <div className="flex items-start gap-3">
                              <Sparkles className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">
                                  Recommended: <span className="text-gray-700">{item.action}</span>
                                </p>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                  <span className="font-semibold text-gray-700">Reasoning: </span>
                                  {item.aiInsight}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Switch Risk Detected</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Last Visit: 14 days ago</span>
                            </div>
                            <Button variant="ghost" className="text-gray-900 hover:bg-gray-100 font-medium text-sm group-hover:translate-x-1 transition-transform">
                              Take Action <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar: Agent Copilot (Phase 2) & Analytics */}
            <div className="space-y-8">
              
              {/* Agent Copilot Card */}
              <Card className="bg-gray-900 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                 <div className="absolute bottom-0 left-0 p-24 bg-gray-800/20 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />
                 
                 <CardHeader className="pb-2 relative z-10">
                   <div className="flex items-center justify-between mb-2">
                     <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                       <Brain className="h-5 w-5 text-white" />
                     </div>
                     <Badge className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full text-[10px] uppercase tracking-wider">Active</Badge>
                   </div>
                   <CardTitle className="text-xl font-light">Agent Copilot</CardTitle>
                   <CardDescription className="text-gray-400">Orchestrating territory plans</CardDescription>
                 </CardHeader>

                 <CardContent className="relative z-10">
                   <div className="space-y-4 mt-4">
                     {copilotSuggestions.map((suggestion, i) => (
                       <div key={i} className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                         <h4 className="text-sm font-medium text-white mb-1">{suggestion.title}</h4>
                         <p className="text-xs text-gray-400 mb-3 leading-relaxed">{suggestion.description}</p>
                         <button className="text-xs font-semibold text-white flex items-center hover:underline">
                           {suggestion.action} <ChevronRight className="h-3 w-3 ml-1" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </CardContent>

                 <CardFooter className="relative z-10 border-t border-white/10 pt-4">
                   <div className="flex w-full items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                     <MessageSquare className="h-4 w-4 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Ask Copilot..." 
                       className="bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none w-full"
                     />
                     <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform">
                       <ArrowRight className="h-3 w-3 text-gray-900" />
                     </div>
                   </div>
                 </CardFooter>
              </Card>

              {/* Root Cause Analytics (Phase 3 Mockup) */}
              <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Switching Root Causes</CardTitle>
                  <CardDescription>AI-diagnosed factors for Q3</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Clinical Efficacy", value: 45, color: "bg-gray-900" },
                      { label: "Patient Access", value: 30, color: "bg-gray-600" },
                      { label: "Side Effect Profile", value: 15, color: "bg-gray-400" },
                      { label: "Competitor Pricing", value: 10, color: "bg-gray-200" }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="text-gray-500">{item.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full ${item.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                   <Button variant="outline" className="w-full rounded-full text-xs h-8 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                     View Full Analysis
                   </Button>
                </CardFooter>
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
