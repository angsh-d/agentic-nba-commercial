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
    color: "#007AFF",
    name: "Strategic Planner",
    emoji: "🎯"
  },
  analyst: {
    icon: Eye,
    color: "#86868b", 
    name: "Evidence Analyst",
    emoji: "👁️"
  },
  synthesizer: {
    icon: Lightbulb,
    color: "#86868b",
    name: "Action Synthesizer",
    emoji: "💡"
  },
  reflector: {
    icon: Brain,
    color: "#86868b",
    name: "Self-Reflector",
    emoji: "🧠"
  },
  orchestrator: {
    icon: Sparkles,
    color: "#86868b",
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
      <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 mb-6 animate-pulse">
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
    <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
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
            <div className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Loading reasoning...</p>
            </div>
          </div>
        )}
        
        {!isLoadingHistory && events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-4 animate-pulse">
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
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
                <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">{event.phase}</span>
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
              </div>
            )}

            {event.type === 'thought' && (() => {
              const config = agentConfig[event.agent as keyof typeof agentConfig] || agentConfig.orchestrator;
              return (
                <div className="group relative">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="absolute left-6 -top-6 w-0.5 h-6 bg-gray-200 dark:bg-gray-800" />
                  )}
                  
                  <div className="relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      {/* Agent Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                          <span className="text-2xl">{config.emoji}</span>
                        </div>
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
                  <div className="rounded-3xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                            {config.name}
                          </h4>
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-xs font-medium text-blue-500">
                            {event.actionType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                        {event.metadata && event.metadata.confidence && (
                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-1000"
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
              <div className="rounded-3xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center shadow-lg">
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
