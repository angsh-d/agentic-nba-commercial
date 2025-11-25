import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, Award, Book } from "lucide-react";
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "conference":
        return <Award className="w-5 h-5" />;
      case "adverse_event":
        return <AlertTriangle className="w-5 h-5" />;
      case "webinar":
        return <Book className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "conference":
        return "bg-blue-500";
      case "adverse_event":
        return "bg-red-500";
      case "webinar":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Young RCC Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
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
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                CV-Risk Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-red-600">
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
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Stable Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
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
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Clinical Event Timeline
            <Badge variant="outline" className="ml-auto">
              {events.length} Key Events
            </Badge>
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
                className="relative pl-12 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
              >
                {/* Event Icon */}
                <div className={`absolute left-0 -translate-x-1/2 w-10 h-10 rounded-full ${getEventColor(event.eventType)} flex items-center justify-center text-white shadow-lg`}>
                  {getEventIcon(event.eventType)}
                </div>

                {/* Event Content */}
                <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-all duration-300 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.eventTitle}
                        </h3>
                        <Badge variant="outline" className={getImpactBadge(event.impact)}>
                          {event.impact} impact
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.eventDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {event.eventDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{event.eventType.replace('_', ' ')}</span>
                    </span>
                    {event.relatedDrug && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Drug:</span>
                        <span>{event.relatedDrug}</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata if available */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
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
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Causal Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  ASCO Conference → Young RCC Switching (June-July 2025)
                </div>
                <div className="text-sm text-gray-600">
                  Following ASCO's ORION-Y trial presentation showing 40% PFS improvement in RCC patients {'<'}55,
                  all {youngRCCPatients.length} young RCC patients systematically switched to Onco-Rival.
                  <span className="font-semibold text-blue-700"> 95% confidence</span> this was evidence-driven.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  Adverse Event Cluster → CV-Risk Switching (August-September 2025)
                </div>
                <div className="text-sm text-gray-600">
                  After experiencing 3 cardiac adverse events in 18 days (QT prolongation, arrhythmia, chest pain),
                  {cvRiskPatients.filter(p => p.switchedDate).length} of {cvRiskPatients.length} CV-risk patients
                  selectively switched for safety.
                  <span className="font-semibold text-red-700"> 90% confidence</span> this was safety-driven.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  Stable Cohort → Strategic, Not Categorical Switching
                </div>
                <div className="text-sm text-gray-600">
                  {stablePatients.filter(p => !p.switchedDate).length} low-risk patients remain on Onco-Pro,
                  demonstrating that Dr. Smith's switching is <span className="font-semibold text-green-700">evidence-based and patient-specific</span>,
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
