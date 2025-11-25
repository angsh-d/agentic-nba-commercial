import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Database, RefreshCw } from "lucide-react";

interface TableData {
  tableName: string;
  rowCount: number;
  columns: string[];
}

export function DataExplorer() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ["database-tables"],
    queryFn: async () => {
      const response = await fetch("/api/database/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json() as Promise<TableData[]>;
    },
  });

  const { data: tableData, isLoading: dataLoading, refetch } = useQuery({
    queryKey: ["table-data", selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      const response = await fetch(`/api/database/tables/${selectedTable}`);
      if (!response.ok) throw new Error("Failed to fetch table data");
      return response.json();
    },
    enabled: !!selectedTable,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Data Explorer</h1>
          <p className="text-lg text-gray-500 font-light">View raw database tables and records</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Table List */}
          <div className="col-span-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-4 w-4 text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-900">Tables</h2>
              </div>
              
              {tablesLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-1">
                  {tables.map((table) => (
                    <button
                      key={table.tableName}
                      onClick={() => setSelectedTable(table.tableName)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTable === table.tableName
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      data-testid={`table-${table.tableName}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{table.tableName}</span>
                        <span className="text-xs text-gray-400 ml-2">{table.rowCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Main Content - Table Data */}
          <div className="col-span-9">
            {!selectedTable ? (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-light">Select a table to view its data</p>
                </div>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedTable}</h3>
                    <p className="text-sm text-gray-500">
                      {tableData?.rows?.length || 0} records
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={dataLoading}
                    data-testid="button-refresh-data"
                  >
                    <RefreshCw className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  {dataLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-500 font-light">Loading data...</p>
                    </div>
                  ) : tableData?.rows?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {tableData.columns.map((col: string) => (
                            <th
                              key={col}
                              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.rows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {tableData.columns.map((col: string) => (
                              <td key={col} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {typeof row[col] === "object"
                                  ? JSON.stringify(row[col])
                                  : String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      <p className="font-light">No data found</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
