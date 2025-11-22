import { useEffect, useState, useRef } from "react";
import { Brain, Lightbulb, Target, Eye, CheckCircle2, Loader2 } from "lucide-react";

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

const agentIcons = {
  planner: Target,
  analyst: Eye,
  synthesizer: Lightbulb,
  reflector: Brain,
};

const agentColors = {
  planner: "#60A5FA",
  analyst: "#34D399", 
  synthesizer: "#FBBF24",
  reflector: "#A78BFA",
};

export function AgentReasoningPanel({ sessionId, onClose }: AgentReasoningPanelProps) {
  const [events, setEvents] = useState<ReasoningEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("Initializing");
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource(`/api/agent/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("Agent reasoning stream connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log("Stream connected for session:", data.sessionId);
        } else if (data.type === 'phase') {
          setCurrentPhase(data.phase);
          setEvents(prev => [...prev, data]);
        } else if (data.type === 'thought' || data.type === 'action') {
          setEvents(prev => [...prev, data]);
        } else if (data.type === 'completed') {
          setEvents(prev => [...prev, data]);
          setCurrentPhase("Completed");
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (!sessionId) {
    return (
      <div className="bg-[#1d1d1f]/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-8">
        <div className="text-center text-[#86868b]">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Click "Generate AI NBAs" to see agent reasoning in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1d1d1f]/40 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-5 h-5 text-white" />
            {isConnected && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">Agent Reasoning</h3>
            <p className="text-xs text-[#86868b]">Session {sessionId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white/5 rounded-full">
            <span className="text-xs text-[#86868b]">{currentPhase}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#86868b] hover:text-white transition-colors"
              data-testid="button-close-reasoning"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Events Stream */}
      <div 
        ref={scrollRef}
        className="h-[500px] overflow-y-auto p-6 space-y-4"
      >
        {events.length === 0 && isConnected && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#86868b] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#86868b]">Agents are thinking...</p>
            </div>
          </div>
        )}

        {events.map((event, idx) => (
          <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {event.type === 'phase' && (
              <div className="flex items-center gap-2 text-xs text-[#86868b] uppercase tracking-wider mb-2">
                <div className="h-px bg-white/10 flex-1" />
                <span>{event.phase}</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
            )}

            {event.type === 'thought' && (
              <div className="bg-white/5 rounded-[16px] p-4 border border-white/5">
                <div className="flex items-start gap-3">
                  {(() => {
                    const Icon = agentIcons[event.agent as keyof typeof agentIcons] || Brain;
                    const color = agentColors[event.agent as keyof typeof agentColors] || "#86868b";
                    return (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white capitalize">{event.agent}</span>
                      <span className="text-xs text-[#86868b]">{event.thoughtType}</span>
                    </div>
                    <p className="text-sm text-[#F5F5F7] leading-relaxed">{event.content}</p>
                  </div>
                </div>
              </div>
            )}

            {event.type === 'action' && (
              <div className="bg-blue-500/10 rounded-[16px] p-4 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white capitalize">{event.agent}</span>
                      <span className="text-xs text-blue-400">{event.actionType}</span>
                    </div>
                    <p className="text-sm text-[#F5F5F7]">{event.description}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-[#86868b] font-mono">
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {event.type === 'completed' && (
              <div className="bg-green-500/10 rounded-[16px] p-4 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Agent reasoning completed</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
