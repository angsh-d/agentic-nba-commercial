import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ClinicalEvent {
  id: number;
  eventType: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  impact: string;
  relatedDrug?: string;
  metadata?: any;
}

interface Patient {
  id: number;
  patientCode: string;
  age: number;
  cancerType: string;
  cohort: string;
  switchedDate?: string;
  switchedToDrug?: string;
  hasCardiovascularRisk: number;
}

interface EventTimelineProps {
  events: ClinicalEvent[];
  patients: Patient[];
}

export function EventTimeline({ events, patients }: EventTimelineProps) {
  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  // Get cohort stats
  const cohortStats = patients.reduce((acc, p) => {
    acc[p.cohort] = (acc[p.cohort] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const switchedPatients = patients.filter(p => p.switchedDate);
  const youngRCCPatients = patients.filter(p => p.cohort === 'young_rcc');
  const cvRiskPatients = patients.filter(p => p.cohort === 'cv_risk');
  const stablePatients = patients.filter(p => p.cohort === 'stable');

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case "conference":
        return "Conference";
      case "adverse_event":
        return "Adverse Event";
      case "webinar":
        return "Webinar";
      default:
        return "Event";
    }
  };

  return (
    <div className="space-y-8">
      {/* Patient Cohort Summary */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-500">
                Young RCC Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-500">
                  {youngRCCPatients.length}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">
                    {youngRCCPatients.filter(p => p.switchedDate).length}
                  </span>{" "}
                  switched to competitor
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Age {'<'}55 • Post-ASCO switches
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-gray-200 bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900">
                CV-Risk Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-600">
                  {cvRiskPatients.length}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">
                    {cvRiskPatients.filter(p => p.switchedDate).length}
                  </span>{" "}
                  switched for safety
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Cardiac comorbidities • Post-AE switches
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900">
                Stable Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-600">
                  {stablePatients.length}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">
                    {stablePatients.filter(p => !p.switchedDate).length}
                  </span>{" "}
                  remain on Onco-Pro
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Low-risk • Loyal to our drug
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clinical Events Timeline */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Clinical Event Timeline
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Causal factors influencing prescription behavior
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pb-6 last:pb-0"
              >
                {/* Event Content */}
                <div className="bg-white rounded-lg p-6 hover:shadow-md transition-all duration-300 border border-gray-200">
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {getEventTypeLabel(event.eventType)}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      {event.eventTitle}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {event.impact === 'high' && (
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        High Impact
                      </div>
                    )}
                  </div>

                  <p className="text-base text-gray-700 leading-relaxed mb-4">
                    {event.eventDescription}
                  </p>

                  {event.relatedDrug && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Related Drug:</span> {event.relatedDrug}
                    </div>
                  )}

                  {/* Metadata if available */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(event.metadata).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="text-gray-600">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                            <span className="text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Causal Insights Summary */}
      <Card className="border border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Causal Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 bg-gray-400 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  ASCO Conference → Young RCC Switching
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  June-July 2025
                </div>
                <div className="text-base text-gray-700 leading-relaxed">
                  Following ASCO's ORION-Y trial presentation showing 40% PFS improvement in RCC patients {'<'}55,
                  all {youngRCCPatients.length} young RCC patients systematically switched to Onco-Rival.
                  <span className="font-semibold text-blue-500"> 95% confidence</span> this was evidence-driven.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1 h-1 bg-gray-400 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Adverse Event Cluster → CV-Risk Switching
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  August-September 2025
                </div>
                <div className="text-base text-gray-700 leading-relaxed">
                  After experiencing 3 cardiac adverse events in 18 days (QT prolongation, arrhythmia, chest pain),
                  {cvRiskPatients.filter(p => p.switchedDate).length} of {cvRiskPatients.length} CV-risk patients
                  selectively switched for safety.
                  <span className="font-semibold text-gray-900"> 90% confidence</span> this was safety-driven.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1 h-1 bg-gray-400 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Stable Cohort → Strategic, Not Categorical Switching
                </div>
                <div className="text-base text-gray-700 leading-relaxed">
                  {stablePatients.filter(p => !p.switchedDate).length} low-risk patients remain on Onco-Pro,
                  demonstrating that Dr. Smith's switching is <span className="font-semibold text-gray-900">evidence-based and patient-specific</span>,
                  not wholesale drug abandonment.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
