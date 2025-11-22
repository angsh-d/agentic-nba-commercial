import { useEffect, useState, useRef } from "react";
import { Brain, Lightbulb, Target, Eye, Sparkles, TrendingUp } from "lucide-react";

interface ThoughtEvent {
  type: 'thought';
  sessionId: number;
  agent: string;
  thoughtType: string;
  content: string;
  timestamp: string;
}

interface ActionEvent {
  type: 'action';
  sessionId: number;
  agent: string;
  actionType: string;
  description: string;
  metadata: any;
  timestamp: string;
}

interface PhaseEvent {
  type: 'phase';
  sessionId: number;
  phase: string;
  timestamp: string;
}

interface CompletedEvent {
  type: 'completed';
  sessionId: number;
  result: any;
}

type ReasoningEvent = ThoughtEvent | ActionEvent | PhaseEvent | CompletedEvent;

interface AgentReasoningPanelProps {
  sessionId: number | null;
  onClose?: () => void;
}

const agentConfig = {
  planner: {
    icon: Target,
    color: "#0A84FF",
    gradient: "from-blue-500 to-blue-600",
    name: "Strategic Planner",
    emoji: "🎯"
  },
  analyst: {
    icon: Eye,
    color: "#30D158", 
    gradient: "from-green-500 to-emerald-600",
    name: "Evidence Analyst",
    emoji: "👁️"
  },
  synthesizer: {
    icon: Lightbulb,
    color: "#FFD60A",
    gradient: "from-yellow-500 to-amber-600",
    name: "Action Synthesizer",
    emoji: "💡"
  },
  reflector: {
    icon: Brain,
    color: "#BF5AF2",
    gradient: "from-purple-500 to-violet-600",
    name: "Self-Reflector",
    emoji: "🧠"
  },
  orchestrator: {
    icon: Sparkles,
    color: "#86868b",
    gradient: "from-gray-500 to-gray-600",
    name: "Orchestrator",
    emoji: "⚡"
  }
};

export function AgentReasoningPanel({ sessionId, onClose }: AgentReasoningPanelProps) {
  const [events, setEvents] = useState<ReasoningEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("Initializing");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch and poll for session updates
  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      return;
    }

    const fetchSessionHistory = async () => {
      if (!isLoadingHistory) {
        setIsLoadingHistory(true);
      }
      try {
        const response = await fetch(`/api/agent/sessions/${sessionId}`);
        if (response.ok) {
          const session = await response.json();
          
          const historyEvents: ReasoningEvent[] = [];
          
          if (session.session?.thoughts || session.thoughts) {
            const thoughts = session.session?.thoughts || session.thoughts;
            thoughts.forEach((thought: any) => {
              historyEvents.push({
                type: 'thought',
                sessionId: session.session?.id || session.id,
                agent: thought.agentType,
                thoughtType: thought.thoughtType,
                content: thought.content,
                timestamp: thought.timestamp,
              });
            });
          }
          
          if (session.session?.actions || session.actions) {
            const actions = session.session?.actions || session.actions;
            actions.forEach((action: any) => {
              historyEvents.push({
                type: 'action',
                sessionId: session.session?.id || session.id,
                agent: action.agentType,
                actionType: action.actionType,
                description: action.actionDescription,
                metadata: action.actionParams,
                timestamp: action.executedAt,
              });
            });
          }
          
          historyEvents.sort((a, b) => {
            const aTime = 'timestamp' in a ? new Date(a.timestamp).getTime() : 0;
            const bTime = 'timestamp' in b ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
          });
          
          setEvents(historyEvents);
          const sessionData = session.session || session;
          setCurrentPhase(sessionData.status === 'completed' ? 'Completed' : sessionData.currentPhase || sessionData.status);
        }
      } catch (error) {
        console.error("Failed to load session history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchSessionHistory();
    
    const pollInterval = setInterval(() => {
      if (!events.some(e => e.type === 'completed')) {
        fetchSessionHistory();
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (!sessionId) {
    return (
      <div className="relative overflow-hidden rounded-[32px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            AI Agents Generating...
          </h3>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Strategic Planner → Evidence Analyst → Action Synthesizer → Self-Reflector
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative px-8 py-6 border-b border-black/5 dark:border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agent Reasoning
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session #{sessionId} • Live AI Thinking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentPhase}</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-gray-400"
                data-testid="button-close-reasoning"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div 
        ref={scrollRef}
        className="relative h-[600px] overflow-y-auto p-8 space-y-6"
      >
        {isLoadingHistory && events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Loading reasoning...</p>
            </div>
          </div>
        )}
        
        {!isLoadingHistory && events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 animate-pulse">
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">AI Agents Thinking...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing patterns and generating insights</p>
            </div>
          </div>
        )}

        {events.map((event, idx) => (
          <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {event.type === 'phase' && (
              <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-600 uppercase tracking-widest font-medium my-8">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
                <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">{event.phase}</span>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
              </div>
            )}

            {event.type === 'thought' && (() => {
              const config = agentConfig[event.agent as keyof typeof agentConfig] || agentConfig.orchestrator;
              return (
                <div className="group relative">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="absolute left-6 -top-6 w-0.5 h-6 bg-gradient-to-b from-gray-200 dark:from-gray-800 to-transparent" />
                  )}
                  
                  <div className="relative rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} rounded-t-3xl opacity-60`} />
                    
                    <div className="flex items-start gap-4">
                      {/* Agent Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ring-4 ring-white/50 dark:ring-black/50`}>
                          <span className="text-2xl">{config.emoji}</span>
                        </div>
                        {/* Pulse effect */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {config.name}
                          </h4>
                          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                            {event.thoughtType}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                          {event.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {event.type === 'action' && (() => {
              const config = agentConfig[event.agent as keyof typeof agentConfig] || agentConfig.orchestrator;
              return (
                <div className="relative">
                  <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/30 p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                            {config.name}
                          </h4>
                          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {event.actionType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                        {event.metadata && event.metadata.confidence && (
                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                                style={{ width: `${event.metadata.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event.metadata.confidence}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {event.type === 'completed' && (
              <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/30 p-6 shadow-lg">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Reasoning Complete</p>
                    <p className="text-sm opacity-75">All agents have finished their analysis</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
