import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Calendar, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { GeneratedArtifact, CallScriptContent, EmailDraftContent, MeetingAgendaContent } from "@shared/schema";

interface ArtifactDisplayProps {
  artifacts: GeneratedArtifact[];
}

export function ArtifactDisplay({ artifacts }: ArtifactDisplayProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case "call_script":
        return <FileText className="w-5 h-5" />;
      case "email_draft":
        return <Mail className="w-5 h-5" />;
      case "meeting_agenda":
        return <Calendar className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderCallScript = (content: CallScriptContent, artifactId: number) => {
    const fullText = `
CALL SCRIPT

OPENING:
${content.opening}

KEY TALKING POINTS:
${content.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

OBJECTION HANDLING:
${content.objectionHandling.map(oh => `Q: ${oh.objection}\nA: ${oh.response}`).join('\n\n')}

CLOSING:
${content.closingStatement}

FOLLOW-UP:
${content.followUpAction}
    `.trim();

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Opening</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-light">{content.opening}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Key Talking Points</h4>
          <ul className="space-y-2">
            {content.keyPoints.map((point, idx) => (
              <li key={idx} className="text-sm text-gray-700 leading-relaxed font-light flex gap-3">
                <span className="text-gray-400 font-medium">{idx + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Objection Handling</h4>
          <div className="space-y-4">
            {content.objectionHandling.map((oh, idx) => (
              <div key={idx} className="border-l-2 border-gray-200 pl-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Objection: {oh.objection}</p>
                <p className="text-sm text-gray-700 leading-relaxed font-light">Response: {oh.response}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Closing</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-light">{content.closingStatement}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Follow-Up Action</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-light">{content.followUpAction}</p>
        </div>

        <Button
          onClick={() => copyToClipboard(fullText, artifactId)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 text-sm font-medium rounded-xl transition-all duration-200"
          data-testid={`button-copy-${artifactId}`}
        >
          {copiedId === artifactId ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Call Script
            </>
          )}
        </Button>
      </div>
    );
  };

  const renderEmailDraft = (content: EmailDraftContent, artifactId: number) => {
    const fullText = `
Subject: ${content.subject}

${content.greeting}

${content.body.join('\n\n')}

${content.closing}

${content.signature}

${content.attachmentSuggestions && content.attachmentSuggestions.length > 0 ? `\nAttachments: ${content.attachmentSuggestions.join(', ')}` : ''}
    `.trim();

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Subject Line</h4>
          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded border border-gray-200">
            {content.subject}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Email Body</h4>
          <div className="space-y-4 bg-gray-50 px-4 py-3 rounded border border-gray-200">
            <p className="text-sm text-gray-700 font-light">{content.greeting}</p>
            {content.body.map((paragraph, idx) => (
              <p key={idx} className="text-sm text-gray-700 leading-relaxed font-light">{paragraph}</p>
            ))}
            <p className="text-sm text-gray-700 font-light">{content.closing}</p>
            <p className="text-sm text-gray-600 font-light whitespace-pre-line">{content.signature}</p>
          </div>
        </div>

        {content.attachmentSuggestions && content.attachmentSuggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Suggested Attachments</h4>
            <ul className="space-y-1">
              {content.attachmentSuggestions.map((attachment, idx) => (
                <li key={idx} className="text-sm text-gray-700 font-light flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{attachment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={() => copyToClipboard(fullText, artifactId)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 text-sm font-medium rounded-xl transition-all duration-200"
          data-testid={`button-copy-${artifactId}`}
        >
          {copiedId === artifactId ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Email Draft
            </>
          )}
        </Button>
      </div>
    );
  };

  const renderMeetingAgenda = (content: MeetingAgendaContent, artifactId: number) => {
    const fullText = `
MEETING AGENDA

OBJECTIVE:
${content.objective}

DURATION:
${content.duration}

AGENDA:
${content.agenda.map(item => `${item.time} - ${item.topic}\n${item.details}`).join('\n\n')}

KEY MESSAGES:
${content.keyMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

MATERIALS NEEDED:
${content.materialsNeeded.map(mat => `• ${mat}`).join('\n')}

DESIRED OUTCOME:
${content.desiredOutcome}
    `.trim();

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Objective</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-light">{content.objective}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Duration</h4>
          <p className="text-sm text-gray-700 font-light">{content.duration}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Agenda</h4>
          <div className="space-y-4">
            {content.agenda.map((item, idx) => (
              <div key={idx} className="border-l-2 border-blue-200 pl-4">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {item.time} - {item.topic}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{item.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Key Messages</h4>
          <ul className="space-y-2">
            {content.keyMessages.map((message, idx) => (
              <li key={idx} className="text-sm text-gray-700 leading-relaxed font-light flex gap-3">
                <span className="text-gray-400 font-medium">{idx + 1}.</span>
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Materials Needed</h4>
          <ul className="space-y-1">
            {content.materialsNeeded.map((material, idx) => (
              <li key={idx} className="text-sm text-gray-700 font-light flex gap-2">
                <span className="text-gray-400">•</span>
                <span>{material}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Desired Outcome</h4>
          <p className="text-sm text-gray-700 leading-relaxed font-light">{content.desiredOutcome}</p>
        </div>

        <Button
          onClick={() => copyToClipboard(fullText, artifactId)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 text-sm font-medium rounded-xl transition-all duration-200"
          data-testid={`button-copy-${artifactId}`}
        >
          {copiedId === artifactId ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Meeting Agenda
            </>
          )}
        </Button>
      </div>
    );
  };

  if (!artifacts || artifacts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-16">
      <div>
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Ready-to-Use Artifacts
        </h2>
        <p className="text-base text-gray-600 font-light">
          AI-generated content you can use immediately
        </p>
      </div>

      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="border border-gray-200 bg-white" data-testid={`artifact-${artifact.id}`}>
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                {getArtifactIcon(artifact.artifactType)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                  {artifact.title}
                </h3>
                {artifact.context && (
                  <p className="text-sm text-gray-500 mt-1 font-light">{artifact.context}</p>
                )}
              </div>
            </div>

            {artifact.content.type === "call_script" && renderCallScript(artifact.content as CallScriptContent, artifact.id)}
            {artifact.content.type === "email_draft" && renderEmailDraft(artifact.content as EmailDraftContent, artifact.id)}
            {artifact.content.type === "meeting_agenda" && renderMeetingAgenda(artifact.content as MeetingAgendaContent, artifact.id)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
