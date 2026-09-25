import React, { useState } from "react";
import { Terminal, ChevronDown, ChevronUp, Bug, CheckCircle, Activity } from "lucide-react";
import { AudioDebugInfo } from "@/lib/audio";

interface DeveloperDebugPanelProps {
  debugInfo: AudioDebugInfo | null;
}

export const DeveloperDebugPanel: React.FC<DeveloperDebugPanelProps> = ({
  debugInfo,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 no-print border border-slate-200 bg-slate-50 rounded-xl overflow-hidden shadow-2xs">
      {/* Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-court-700" />
          <span>Developer Debug Mode (Pipeline Inspector)</span>
          {debugInfo && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
              Live Data Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span className="text-[11px] font-normal">
            {isOpen ? "Hide Inspector" : "Show Inspector"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Collapsible Inspection Panel */}
      {isOpen && (
        <div className="p-4 border-t border-slate-200 bg-white space-y-4">
          {!debugInfo ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <Terminal className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="font-medium">No recording diagnostic data captured yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click <strong>Start Dictation</strong>, speak, and click <strong>Stop &amp; Transcribe</strong> to inspect audio pipeline metrics.
              </p>
            </div>
          ) : (
            <>
              {/* Technical Audio Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Audio MIME
                  </span>
                  <span className="font-mono text-slate-800 font-semibold text-[11px] truncate block" title={debugInfo.mimeType}>
                    {debugInfo.mimeType || "Default"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Audio Size
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {debugInfo.sizeKb}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Duration
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {debugInfo.durationSeconds}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Language
                  </span>
                  <span className="font-mono text-slate-800 font-semibold uppercase">
                    {debugInfo.language}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Model
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {debugInfo.model}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Voice Activity
                  </span>
                  <span className="font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Detected</span>
                  </span>
                </div>
              </div>

              {/* Side-by-side comparison of RAW vs FINAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Raw Transcript Card */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      RAW TRANSCRIPT (Direct STT Output)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">OpenAI API</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 text-slate-800 min-h-[90px] max-h-[160px] overflow-y-auto">
                    {debugInfo.rawTranscript || "(Empty transcription)"}
                  </pre>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Unmodified text directly returned by speech-to-text model.
                  </p>
                </div>

                {/* Final Transcript Card */}
                <div className="border border-court-200 rounded-lg p-3 bg-court-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-court-800">
                      FINAL TRANSCRIPT (Legal Normalized)
                    </span>
                    <span className="text-[10px] text-court-700 font-mono">Formatted</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs bg-white p-2.5 rounded border border-court-200 text-slate-900 min-h-[90px] max-h-[160px] overflow-y-auto font-medium">
                    {debugInfo.finalTranscript || "(Empty)"}
                  </pre>
                  <p className="text-[10px] text-court-700 mt-1.5">
                    Formatted with section numbers, legal terms, and voice punctuation.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
