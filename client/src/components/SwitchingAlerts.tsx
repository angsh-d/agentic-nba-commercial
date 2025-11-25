import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, X, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSwitchingEvents, updateSwitchingEventStatus } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function SwitchingAlerts() {
  const queryClient = useQueryClient();
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["switchingEvents", "active"],
    queryFn: () => fetchSwitchingEvents("active"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateSwitchingEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["switchingEvents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  if (isLoading) {
    return null;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <AlertTriangle className="h-5 w-5 text-gray-900" />
        <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">
          Switching Alerts
        </h2>
        <Badge className="ml-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-gray-900 text-white">
          {events.length} ACTIVE
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {events.map((event) => {
            const impactColor =
              event.impactLevel === "critical"
                ? "bg-gray-900"
                : event.impactLevel === "high"
                ? "bg-gray-700"
                : event.impactLevel === "medium"
                ? "bg-gray-500"
                : "bg-blue-600";

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card
                  className="border-l-4 border-l-gray-900 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white"
                  data-testid={`alert-switching-${event.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-10 w-10 rounded-2xl ${impactColor} flex items-center justify-center`}>
                            <TrendingDown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-[17px] font-semibold text-[#1d1d1f]" data-testid={`text-hcp-${event.id}`}>
                              {event.hcp.name} - Switching Detected
                            </h3>
                            <p className="text-[13px] text-[#86868b]">
                              {event.hcp.specialty} • {event.hcp.hospital}
                            </p>
                          </div>
                          <Badge
                            variant="destructive"
                            className="ml-auto rounded-full text-[11px] font-semibold uppercase tracking-wider"
                          >
                            {event.impactLevel}
                          </Badge>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-5 mb-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-[12px] text-[#86868b] font-medium mb-1">FROM</p>
                              <p className="text-[15px] font-semibold text-[#1d1d1f]">{event.fromProduct}</p>
                            </div>
                            <div>
                              <p className="text-[12px] text-[#86868b] font-medium mb-1">TO</p>
                              <p className="text-[15px] font-semibold text-gray-900">{event.toProduct}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[13px]">
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg font-medium">
                              <span className="text-[#86868b]">Confidence:</span>
                              <span className="text-[#1d1d1f] font-semibold">{event.confidenceScore}%</span>
                            </span>
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg font-medium">
                              <span className="text-[#86868b]">Type:</span>
                              <span className="text-[#1d1d1f] font-semibold capitalize">{event.switchType}</span>
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{event.aiAnalysis}</p>
                        </div>

                        {event.rootCauses && event.rootCauses.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {event.rootCauses.map((cause, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="bg-[#F5F5F7] text-[#1d1d1f] text-[12px] px-3 py-1 rounded-full font-normal"
                              >
                                {cause}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            className="rounded-full bg-gray-900 hover:bg-blue-600 text-white h-10 px-6 font-medium"
                            data-testid={`button-address-${event.id}`}
                            onClick={() => updateStatusMutation.mutate({ id: event.id, status: "addressed" })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Addressed
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-[#86868b] hover:bg-[#F5F5F7] h-10 px-6 font-medium"
                            data-testid={`button-dismiss-${event.id}`}
                            onClick={() => updateStatusMutation.mutate({ id: event.id, status: "monitoring" })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
