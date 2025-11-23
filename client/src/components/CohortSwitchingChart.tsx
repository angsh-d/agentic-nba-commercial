import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Users, AlertCircle } from "lucide-react";

interface Patient {
  id: number;
  patientCode: string;
  cohort: string;
  switchedDate: string | null;
  age?: number;
  cancerType?: string;
}

interface ClinicalEvent {
  id: number;
  eventDate: string;
  eventTitle: string;
  eventType: string;
  eventDescription?: string;
}

interface PrescriptionHistory {
  month: string;
  productName: string;
  prescriptionCount: number;
  isOurProduct: number;
}

interface CohortSwitchingChartProps {
  patients: Patient[];
  clinicalEvents: ClinicalEvent[];
  prescriptionHistory: PrescriptionHistory[];
  productName: string;
}

// Helper to calculate position on timeline based on date
function getTimelinePosition(date: string, startMonth: string, endMonth: string): number {
  const start = new Date(startMonth + "-01");
  const end = new Date(endMonth + "-01");
  const target = new Date(date);
  
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const targetDays = (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  return Math.max(0, Math.min(100, (targetDays / totalDays) * 100));
}

// Helper to format month for display
function formatMonth(monthStr: string): string {
  const date = new Date(monthStr + "-01");
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

export function CohortSwitchingChart({
  patients,
  clinicalEvents,
  prescriptionHistory,
  productName,
}: CohortSwitchingChartProps) {
  if (!patients?.length) {
    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-8 text-center text-gray-500">
          <p>No patient data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get timeline range from prescription history
  const months = prescriptionHistory
    .filter(h => h.productName === productName)
    .map(h => h.month)
    .sort();
  
  const startMonth = months[0] || "2025-04";
  const endMonth = months[months.length - 1] || "2025-09";

  // Calculate cohort breakdowns with actual dates
  const youngRccPatients = patients.filter(p => p.cohort === 'young_rcc');
  const cvRiskPatients = patients.filter(p => p.cohort === 'cv_risk');
  const stablePatients = patients.filter(p => p.cohort === 'stable');

  const youngRccSwitched = youngRccPatients.filter(p => p.switchedDate);
  const cvRiskSwitched = cvRiskPatients.filter(p => p.switchedDate);
  const stableRemained = stablePatients.filter(p => !p.switchedDate);

  // Calculate actual switching timeframes
  const youngRccSwitchDates = youngRccSwitched.map(p => p.switchedDate!).sort();
  const cvRiskSwitchDates = cvRiskSwitched.map(p => p.switchedDate!).sort();

  // Determine when switching started for each cohort
  const youngRccFirstSwitch = youngRccSwitchDates[0];
  const youngRccLastSwitch = youngRccSwitchDates[youngRccSwitchDates.length - 1];
  const cvRiskFirstSwitch = cvRiskSwitchDates[0];
  const cvRiskLastSwitch = cvRiskSwitchDates[cvRiskSwitchDates.length - 1];

  // Find key events and calculate their positions
  const ascoEvent = clinicalEvents.find(e => e.eventType === 'conference' && e.eventTitle.includes('ASCO'));
  const cardiacEvents = clinicalEvents.filter(e => e.eventType === 'adverse_event');
  const firstCardiacEvent = cardiacEvents.sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];

  const ascoPosition = ascoEvent ? getTimelinePosition(ascoEvent.eventDate, startMonth, endMonth) : null;
  const cardiacPosition = firstCardiacEvent ? getTimelinePosition(firstCardiacEvent.eventDate, startMonth, endMonth) : null;
  
  // Calculate switching event positions
  const youngRccSwitchPosition = youngRccFirstSwitch ? getTimelinePosition(youngRccFirstSwitch, startMonth, endMonth) : null;
  const cvRiskSwitchPosition = cvRiskFirstSwitch ? getTimelinePosition(cvRiskFirstSwitch, startMonth, endMonth) : null;

  const totalPatients = patients.length;
  const totalSwitched = youngRccSwitched.length + cvRiskSwitched.length;
  const switchRate = Math.round((totalSwitched / totalPatients) * 100);

  // Format switching timeframes
  const youngRccSwitchPeriod = youngRccFirstSwitch && youngRccLastSwitch
    ? (() => {
        const firstMonth = new Date(youngRccFirstSwitch).toLocaleDateString("en-US", { month: "short" });
        const lastMonth = new Date(youngRccLastSwitch).toLocaleDateString("en-US", { month: "short" });
        return firstMonth === lastMonth ? firstMonth : `${firstMonth}-${lastMonth}`;
      })()
    : "N/A";
  
  const cvRiskSwitchPeriod = cvRiskFirstSwitch && cvRiskLastSwitch
    ? (() => {
        const firstMonth = new Date(cvRiskFirstSwitch).toLocaleDateString("en-US", { month: "short" });
        const lastMonth = new Date(cvRiskLastSwitch).toLocaleDateString("en-US", { month: "short" });
        return firstMonth === lastMonth ? firstMonth : `${firstMonth}-${lastMonth}`;
      })()
    : "N/A";

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {productName} Patient Cohort Switching Timeline
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Two distinct switching patterns across cohorts
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-semibold text-gray-900">
                {switchRate}%
              </span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              switched
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Timeline View with Month Labels */}
        <div className="space-y-6">
          {/* Month Labels */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-2">
            {months.slice(0, 6).map((month, i) => (
              <span key={i}>{formatMonth(month)}</span>
            ))}
          </div>

          {/* Young RCC Cohort Lane */}
          {youngRccPatients.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-xs px-2.5 py-1">
                  Young RCC Cohort
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{youngRccPatients.length} patients (ages &lt;55, RCC)</span>
                </div>
              </div>
              <div className="relative h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-visible">
                {/* Baseline patients */}
                <div className="absolute left-0 top-0 h-full flex items-center px-4">
                  <div className="flex gap-1">
                    {youngRccPatients.map((_, i) => (
                      <div key={i} className="w-5 h-10 bg-blue-600 rounded" title={`Patient ${i+1}`} />
                    ))}
                  </div>
                </div>
                
                {/* ASCO Event Marker */}
                {ascoPosition !== null && (
                  <div 
                    className="absolute top-0 h-full border-l-2 border-dashed border-purple-600" 
                    style={{ left: `${ascoPosition}%` }}
                  >
                    <div className="absolute -top-8 left-1 text-[10px] font-semibold text-purple-700 whitespace-nowrap bg-white px-1 rounded">
                      ASCO<br/>Jun 15
                    </div>
                  </div>
                )}
                
                {/* Switching Event */}
                {youngRccSwitchPosition !== null && youngRccSwitched.length > 0 && (
                  <div 
                    className="absolute top-0 h-full flex items-center" 
                    style={{ left: `${youngRccSwitchPosition}%` }}
                  >
                    <div className="flex items-center gap-1 -ml-2">
                      <ArrowDown className="w-4 h-4 text-blue-900" />
                      <div className="px-2 py-1 bg-blue-900 text-white rounded text-[10px] font-semibold whitespace-nowrap">
                        {youngRccSwitched.length} switched {youngRccSwitchPeriod}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CV-Risk Cohort Lane */}
          {cvRiskPatients.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <Badge className="bg-red-100 text-red-900 border-red-200 text-xs px-2.5 py-1">
                  CV-Risk Cohort
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{cvRiskPatients.length} patients (cardiac comorbidities)</span>
                </div>
              </div>
              <div className="relative h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-visible">
                {/* Baseline patients */}
                <div className="absolute left-0 top-0 h-full flex items-center px-4">
                  <div className="flex gap-1">
                    {cvRiskPatients.map((_, i) => (
                      <div key={i} className="w-5 h-10 bg-red-600 rounded" title={`Patient ${i+1}`} />
                    ))}
                  </div>
                </div>
                
                {/* Cardiac AE Event Marker */}
                {cardiacPosition !== null && (
                  <div 
                    className="absolute top-0 h-full border-l-2 border-dashed border-orange-600" 
                    style={{ left: `${cardiacPosition}%` }}
                  >
                    <div className="absolute -top-8 left-1 text-[10px] font-semibold text-orange-700 whitespace-nowrap bg-white px-1 rounded">
                      Cardiac AEs<br/>Aug
                    </div>
                  </div>
                )}
                
                {/* Switching Event */}
                {cvRiskSwitchPosition !== null && cvRiskSwitched.length > 0 && (
                  <div 
                    className="absolute top-0 h-full flex items-center" 
                    style={{ left: `${cvRiskSwitchPosition}%` }}
                  >
                    <div className="flex items-center gap-1 -ml-2">
                      <ArrowDown className="w-4 h-4 text-red-900" />
                      <div className="px-2 py-1 bg-red-900 text-white rounded text-[10px] font-semibold whitespace-nowrap">
                        {cvRiskSwitched.length} switched {cvRiskSwitchPeriod}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stable Cohort Lane */}
          {stablePatients.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <Badge variant="outline" className="text-xs px-2.5 py-1 text-gray-600 border-gray-300">
                  Stable Cohort
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{stablePatients.length} patients (other indications)</span>
                </div>
              </div>
              <div className="relative h-16 bg-gray-100 rounded-lg border border-gray-200">
                {/* Baseline - all patients remain */}
                <div className="absolute left-0 top-0 h-full flex items-center px-4">
                  <div className="flex gap-1">
                    {stablePatients.map((_, i) => (
                      <div key={i} className="w-5 h-10 bg-gray-500 rounded" title={`Patient ${i+1}`} />
                    ))}
                  </div>
                </div>
                
                {/* No switching */}
                <div className="absolute right-4 top-0 h-full flex items-center">
                  <div className="px-2 py-1 bg-gray-700 text-white rounded text-[10px] font-semibold">
                    {stableRemained.length}/{stablePatients.length} remained
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cohort Summary Cards with Actual Data */}
        <div className="grid grid-cols-3 gap-4">
          {youngRccPatients.length > 0 && (
            <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Young RCC
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-900">{youngRccSwitched.length}</span>
                  <span className="text-sm text-blue-700">/ {youngRccPatients.length} switched</span>
                </div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  {youngRccSwitchPeriod} following ASCO ORION-Y trial (Jun 15) showing 40% PFS benefit in patients &lt;55
                </div>
                <Badge className="bg-blue-200 text-blue-900 text-[10px] px-2 py-0.5">
                  Efficacy-Driven
                </Badge>
              </div>
            </div>
          )}

          {cvRiskPatients.length > 0 && (
            <div className="p-5 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <h4 className="text-xs font-semibold text-red-900 uppercase tracking-wide">
                  CV-Risk
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-900">{cvRiskSwitched.length}</span>
                  <span className="text-sm text-red-700">/ {cvRiskPatients.length} switched</span>
                </div>
                <div className="text-xs text-red-800 leading-relaxed">
                  {cvRiskSwitchPeriod} after cardiac AE cluster (Aug) amplified by Onco-Rival safety webinar (Aug 30)
                </div>
                <Badge className="bg-red-200 text-red-900 text-[10px] px-2 py-0.5">
                  Safety-Driven
                </Badge>
              </div>
            </div>
          )}

          {stablePatients.length > 0 && (
            <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Stable
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stableRemained.length}</span>
                  <span className="text-sm text-gray-700">/ {stablePatients.length} remained</span>
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  No switching: neither efficacy signal (wrong indication) nor safety concern (no CV risk) applied
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-gray-600 border-gray-300">
                  100% Retention
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Key Insight - Data-Validated */}
        <div className="p-6 bg-white border-l-4 border-gray-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Dual Causal Drivers Detected
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Pattern 1 (Efficacy):</strong> {youngRccSwitched.length} young RCC patients switched {youngRccSwitchPeriod} following ASCO conference (Jun 15) presenting ORION-Y trial data showing 40% PFS improvement in patients &lt;55. 
                <strong className="ml-2">Pattern 2 (Safety):</strong> {cvRiskSwitched.length} CV-risk patients switched {cvRiskSwitchPeriod} after experiencing cardiac adverse events (Aug) amplified by competitor safety webinar (Aug 30). 
                <strong className="ml-2">Control Group:</strong> {stableRemained.length} stable cohort patients remained on {productName}, confirming strategic (not categorical) switching behavior.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
