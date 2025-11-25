import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

interface PrescriptionData {
  month: string;
  ownDrug: number;
  competitorDrug: number;
  regionalBenchmarkOwn: number;
  regionalBenchmarkCompetitor: number;
  nationalBenchmarkOwn: number;
  nationalBenchmarkCompetitor: number;
}

interface ComparativePrescriptionTrendsProps {
  hcpName: string;
  prescriptionData: PrescriptionData[];
}

export function ComparativePrescriptionTrends({ hcpName, prescriptionData }: ComparativePrescriptionTrendsProps) {
  // Calculate trend indicators
  const latest = prescriptionData[prescriptionData.length - 1];
  const previous = prescriptionData[prescriptionData.length - 2];
  
  const ownDrugChange = previous ? ((latest.ownDrug - previous.ownDrug) / previous.ownDrug) * 100 : 0;
  const competitorChange = previous ? ((latest.competitorDrug - previous.competitorDrug) / previous.competitorDrug) * 100 : 0;
  const marketShare = latest ? (latest.ownDrug / (latest.ownDrug + latest.competitorDrug)) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Onco-Pro (Our Drug)</p>
              {ownDrugChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-gray-900" />
              ) : (
                <TrendingUp className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{latest?.ownDrug || 0}</p>
            <div className="flex items-center gap-2">
              <Badge className={ownDrugChange < 0 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}>
                {ownDrugChange > 0 ? "+" : ""}{ownDrugChange.toFixed(1)}%
              </Badge>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Onco-Rival (Competitor)</p>
              {competitorChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-gray-900" />
              ) : (
                <TrendingDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{latest?.competitorDrug || 0}</p>
            <div className="flex items-center gap-2">
              <Badge className={competitorChange > 0 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}>
                {competitorChange > 0 ? "+" : ""}{competitorChange.toFixed(1)}%
              </Badge>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-2">
              <p className="text-sm text-gray-600">Market Share</p>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{marketShare.toFixed(0)}%</p>
            <div className="flex items-center gap-2">
              <Badge className={marketShare < 50 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}>
                {marketShare < 50 ? "Below Parity" : "At/Above Parity"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temporal Trend Chart */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg">Prescription Trends: {hcpName} vs Benchmarks</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            6-month temporal analysis comparing HCP performance to regional and national averages
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={prescriptionData}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis 
                dataKey="month" 
                stroke="#E5E5EA"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#E5E5EA"
                style={{ fontSize: '12px' }}
                label={{ value: 'Prescriptions', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#666' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
              
              {/* Benchmarks (lighter, thinner) */}
              <Line 
                type="monotone" 
                dataKey="nationalBenchmarkOwn" 
                stroke="#d1d5db" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="National Avg (Our Drug)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="regionalBenchmarkOwn" 
                stroke="#9ca3af" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Regional Avg (Our Drug)"
                dot={false}
              />
              
              {/* Actual performance (bold, solid) */}
              <Line 
                type="monotone" 
                dataKey="ownDrug" 
                stroke="#007AFF" 
                strokeWidth={3}
                name={`${hcpName} - Onco-Pro`}
                dot={{ fill: '#007AFF', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="competitorDrug" 
                stroke="#111" 
                strokeWidth={3}
                name={`${hcpName} - Onco-Rival`}
                dot={{ fill: '#111', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Market Share Evolution */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg">Market Share Evolution</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Monthly distribution of Onco-Pro vs Onco-Rival prescriptions
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prescriptionData}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis 
                dataKey="month" 
                stroke="#E5E5EA"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#E5E5EA"
                style={{ fontSize: '12px' }}
                label={{ value: 'Prescriptions', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#666' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
              <Bar dataKey="ownDrug" stackId="a" fill="#007AFF" name="Onco-Pro (Our Drug)" />
              <Bar dataKey="competitorDrug" stackId="a" fill="#111" name="Onco-Rival (Competitor)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
