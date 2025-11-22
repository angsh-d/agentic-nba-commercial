import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { TrendingDown, Calendar } from "lucide-react";

interface Patient {
  id: number;
  patientCode: string;
  cohort: string;
  switchedDate: string | null;
}

interface ClinicalEvent {
  id: number;
  eventDate: string;
  eventTitle: string;
  eventType: string;
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

export function CohortSwitchingChart({
  patients,
  clinicalEvents,
  prescriptionHistory,
  productName,
}: CohortSwitchingChartProps) {
  // Defensive: Return early if no data
  if (!patients?.length || !prescriptionHistory?.length) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
        <CardContent className="p-8 text-center text-gray-500">
          <p>No prescription data available for cohort analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Dynamically discover all cohorts in the dataset FIRST
  const allCohorts = Array.from(new Set(patients.map((p) => p.cohort))).sort();

  // Build cohort-segmented timeline data
  const buildTimelineData = () => {
    const months = prescriptionHistory
      .filter((h) => h.productName === productName)
      .sort((a, b) => a.month.localeCompare(b.month));

    if (!months.length) {
      return [];
    }

    return months.map((monthData) => {
      const monthDate = new Date(monthData.month + "-01");

      // Count patients in each cohort who HAVEN'T switched yet by this month
      const cohortCounts: Record<string, number> = {};

      patients.forEach((patient) => {
        const switchDate = patient.switchedDate
          ? new Date(patient.switchedDate)
          : null;
        
        // Only count patient if:
        // 1. They haven't switched yet, OR
        // 2. Their switch date is AFTER the current month
        // This ensures patients who switched in July are excluded from July onwards
        const isStillOnProduct = !switchDate || switchDate > monthDate;

        if (isStillOnProduct) {
          cohortCounts[patient.cohort] = (cohortCounts[patient.cohort] || 0) + 1;
        }
      });

      // Dynamically build object with all cohorts
      const cohortData: Record<string, number> = {};
      allCohorts.forEach((cohort) => {
        cohortData[cohort] = cohortCounts[cohort] || 0;
      });

      // Calculate total as sum of cohort survivors (not prescriptions)
      // This ensures chart totals match stacked areas
      const cohortTotal = Object.values(cohortData).reduce((sum, count) => sum + count, 0);

      return {
        month: monthData.month,
        monthLabel: new Date(monthData.month + "-01").toLocaleDateString(
          "en-US",
          { month: "short" }
        ),
        total: cohortTotal, // Use cohort survivor total, not prescription count
        ...cohortData, // Spread all cohorts dynamically
      };
    });
  };

  const timelineData = buildTimelineData();

  // Defensive: If no timeline data after filtering, show message
  if (!timelineData.length) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
        <CardContent className="p-8 text-center text-gray-500">
          <p>No prescription history found for {productName}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Define colors for cohorts (cycle if more than defined)
  const cohortColors = [
    { color: "#3b82f6", name: "blue" },
    { color: "#ef4444", name: "red" },
    { color: "#10b981", name: "green" },
    { color: "#f59e0b", name: "amber" },
    { color: "#8b5cf6", name: "purple" },
  ];

  // Find key events that fall within the chart timeframe
  const chartEvents = (clinicalEvents || [])
    .map((event) => {
      const eventMonth = event.eventDate.substring(0, 7);
      const dataPoint = timelineData.find((d) => d.month === eventMonth);
      return dataPoint ? { ...event, month: eventMonth } : null;
    })
    .filter(Boolean);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload
            .slice()
            .reverse()
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">
                  {entry.name}: <span className="font-semibold">{entry.value}</span>
                </span>
              </div>
            ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-900">
            Total: {payload.reduce((sum: number, p: any) => sum + p.value, 0)}{" "}
            patients
          </p>
        </div>
      </div>
    );
  };

  const initialTotal = timelineData[0]?.total || 0;
  const finalTotal = timelineData[timelineData.length - 1]?.total || 0;
  const declinePercent =
    initialTotal > 0
      ? Math.round(((initialTotal - finalTotal) / initialTotal) * 100)
      : 0;

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            {productName} - Cohort Switching Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600">
              -{declinePercent}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Patient retention by cohort over time • Events mark key inflection points
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                {allCohorts.map((cohort, idx) => {
                  const color = cohortColors[idx % cohortColors.length].color;
                  return (
                    <linearGradient
                      key={cohort}
                      id={`color-${cohort.replace(/\s+/g, "-")}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthLabel"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                label={{
                  value: "Patients on Treatment",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: "12px", fill: "#6b7280" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Event markers */}
              {chartEvents.map((event: any, idx) => {
                const dataPoint = timelineData.findIndex(
                  (d) => d.month === event.month
                );
                if (dataPoint === -1) return null;

                return (
                  <ReferenceLine
                    key={idx}
                    x={timelineData[dataPoint].monthLabel}
                    stroke={
                      event.eventType === "conference"
                        ? "#8b5cf6"
                        : event.eventType === "adverse_event"
                        ? "#f59e0b"
                        : "#6366f1"
                    }
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  >
                    <Label
                      value={event.eventTitle.substring(0, 20)}
                      position="top"
                      style={{
                        fontSize: "10px",
                        fill: "#374151",
                        fontWeight: 600,
                      }}
                    />
                  </ReferenceLine>
                );
              })}

              {allCohorts.map((cohort, idx) => {
                const color = cohortColors[idx % cohortColors.length].color;
                return (
                  <Area
                    key={cohort}
                    type="monotone"
                    dataKey={cohort}
                    stackId="1"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#color-${cohort.replace(/\s+/g, "-")})`}
                  />
                );
              }).reverse()}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Dynamic */}
        <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
          {allCohorts.map((cohort, idx) => {
            const color = cohortColors[idx % cohortColors.length].color;
            return (
              <div key={cohort} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">{cohort}</span>
              </div>
            );
          })}
        </div>

        {/* Cohort Summary - Dynamically handle cohorts */}
        <div className={`mt-6 grid gap-4 ${allCohorts.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {allCohorts.map(
            (cohort) => {
              const cohortPatients = patients.filter(
                (p) => p.cohort === cohort
              );
              const switchedCount = cohortPatients.filter(
                (p) => p.switchedDate
              ).length;
              const retentionRate = cohortPatients.length > 0
                ? Math.round(
                    ((cohortPatients.length - switchedCount) /
                      cohortPatients.length) *
                      100
                  )
                : 0;

              return (
                <div
                  key={cohort}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {cohort}
                  </h4>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {retentionRate}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {cohortPatients.length - switchedCount} /{" "}
                    {cohortPatients.length} retained
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Key Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Key Pattern Detected
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Two distinct switching waves observed: Young RCC cohort (July)
                following ASCO conference, and CV-Risk cohort (September) after
                cardiac adverse event cluster. Stable cohort shows 100% retention.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
