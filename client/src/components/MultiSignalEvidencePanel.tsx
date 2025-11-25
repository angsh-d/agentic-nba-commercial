import { useState } from "react";
import { FileText, Building2, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CallNote {
  id: number;
  hcpId: number;
  visitDate: string;
  repName: string;
  noteText: string;
  keyTopics: string[];
  sentiment: string;
  createdAt: string;
}

interface PayerCommunication {
  id: number;
  payer: string;
  documentType: string;
  receivedDate: string;
  documentText: string;
  products: string[];
  impactSeverity: string;
  createdAt: string;
}

interface Patient {
  id: number;
  hcpId: number;
  patientCohort: string;
  switchedToCompetitor: number;
  switchDate: string | null;
  switchReason: string | null;
  payer: string | null;
  priorAuthStatus: string | null;
  denialCode: string | null;
  copayAmount: number | null;
  fulfillmentLagDays: number | null;
}

interface MultiSignalEvidencePanelProps {
  callNotes: CallNote[];
  payerCommunications: PayerCommunication[];
  patients: Patient[];
}

export function MultiSignalEvidencePanel({ callNotes, payerCommunications, patients }: MultiSignalEvidencePanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "call_notes" | "payer_docs" | "patient_data">("all");

  const allEvents = [
    ...callNotes.map((note) => ({
      type: "call_note" as const,
      date: note.visitDate,
      data: note,
    })),
    ...payerCommunications.map((comm) => ({
      type: "payer_doc" as const,
      date: comm.receivedDate,
      data: comm,
    })),
    ...patients
      .filter((p) => p.switchDate)
      .map((patient) => ({
        type: "patient_switch" as const,
        date: patient.switchDate!,
        data: patient,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredEvents = allEvents.filter((event) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "call_notes") return event.type === "call_note";
    if (selectedFilter === "payer_docs") return event.type === "payer_doc";
    if (selectedFilter === "patient_data") return event.type === "patient_switch";
    return true;
  });

  return (
    <div className="space-y-6" data-testid="evidence-panel">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
          data-testid="filter-all"
        >
          All Signals ({allEvents.length})
        </button>
        <button
          onClick={() => setSelectedFilter("call_notes")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === "call_notes"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
          data-testid="filter-call-notes"
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          Call Notes ({callNotes.length})
        </button>
        <button
          onClick={() => setSelectedFilter("payer_docs")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === "payer_docs"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
          data-testid="filter-payer-docs"
        >
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Payer Docs ({payerCommunications.length})
        </button>
        <button
          onClick={() => setSelectedFilter("patient_data")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === "patient_data"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
          data-testid="filter-patient-data"
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Patient Data ({patients.filter((p) => p.switchDate).length})
        </button>
      </div>

      <div className="space-y-4" data-testid="evidence-timeline">
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p>No evidence found for the selected filter.</p>
          </div>
        )}

        {filteredEvents.map((event, idx) => (
          <div key={`${event.type}-${idx}`} className="relative">
            {idx < filteredEvents.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 w-px bg-neutral-200" />
            )}

            {event.type === "call_note" && (
              <div className="flex gap-4" data-testid={`call-note-${event.data.id}`}>
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-900">
                        {format(new Date(event.data.visitDate), "MMM d, yyyy")}
                      </span>
                      <span className="text-sm text-neutral-500">• {event.data.repName}</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-500 px-2 py-1 rounded-full">Call Note</span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2">{event.data.noteText}</p>
                  {event.data.keyTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {event.data.keyTopics.map((topic, i) => (
                        <span key={i} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {event.type === "payer_doc" && (
              <div className="flex gap-4" data-testid={`payer-doc-${event.data.id}`}>
                <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-900">
                        {format(new Date(event.data.receivedDate), "MMM d, yyyy")}
                      </span>
                      <span className="text-sm text-neutral-500">• {event.data.payer}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.data.impactSeverity === "high"
                          ? "bg-gray-100 text-gray-700"
                          : event.data.impactSeverity === "medium"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {event.data.documentType}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">{event.data.documentText}</p>
                </div>
              </div>
            )}

            {event.type === "patient_switch" && (
              <div className="flex gap-4" data-testid={`patient-switch-${event.data.id}`}>
                <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-900">
                        {format(new Date(event.data.switchDate!), "MMM d, yyyy")}
                      </span>
                      <span className="text-sm text-neutral-500">• Patient Switch</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {event.data.patientCohort}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-2">
                    <span className="font-medium">Reason:</span> {event.data.switchReason}
                  </p>
                  {event.data.payer && (
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p>
                        <span className="font-medium">Payer:</span> {event.data.payer}
                      </p>
                      {event.data.priorAuthStatus && (
                        <p>
                          <span className="font-medium">PA Status:</span> {event.data.priorAuthStatus}
                        </p>
                      )}
                      {event.data.copayAmount !== null && (
                        <p>
                          <span className="font-medium">Copay:</span> ${event.data.copayAmount}
                        </p>
                      )}
                      {event.data.fulfillmentLagDays !== null && (
                        <p>
                          <span className="font-medium">Fulfillment Lag:</span> {event.data.fulfillmentLagDays} days
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
