import React, { useState } from "react";
import {
  Copy,
  Trash2,
  FileDown,
  Printer,
  FileText,
  Check,
  RotateCcw,
} from "lucide-react";
import { calculateTranscriptStats } from "@/lib/audio";
import { exportToDocx, CourtCaseMeta } from "@/lib/docxExport";

interface TranscriptEditorProps {
  transcript: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onLoadSample: () => void;
  caseMeta: CourtCaseMeta;
  disabled?: boolean;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcript,
  onChange,
  onClear,
  onLoadSample,
  caseMeta,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const stats = calculateTranscriptStats(transcript);

  const handleCopy = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadTxt = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Court_Order_${caseMeta.caseNumber.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    if (!transcript) return;
    try {
      setIsExportingDocx(true);
      const blob = await exportToDocx(transcript, caseMeta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Court_Order_${caseMeta.caseNumber.replace(/\//g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Docx generation failed:", err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Editor Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-court-800">
            Live Transcript & Draft Order
          </span>
          <span className="text-xs text-slate-400 font-mono">
            (Editable Area)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Fallback Sample Button */}
          <button
            type="button"
            onClick={onLoadSample}
            title="Load sample legal text for offline demonstration fallback"
            className="text-xs font-medium text-slate-600 hover:text-court-700 bg-white border border-slate-200 hover:border-court-300 rounded px-2.5 py-1 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Load Sample Transcript</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1 rounded">
              Demo Sample
            </span>
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative p-4 flex-1">
        <textarea
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Transcription will appear here automatically as you dictate... You can also edit, format, or type directly into this court draft."
          rows={10}
          className="w-full h-64 sm:h-72 p-3 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-court-600 focus:border-court-600 resize-y font-normal font-sans"
        />
      </div>

      {/* Editor Footer & Action Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Word and Character Count */}
        <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
          <span>
            Words: <strong className="text-slate-800">{stats.wordCount}</strong>
          </span>
          <span>
            Characters:{" "}
            <strong className="text-slate-800">{stats.characterCount}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clear */}
          <button
            type="button"
            onClick={onClear}
            disabled={!transcript}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!transcript}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Download TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!transcript}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          {/* Download DOCX */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={!transcript || isExportingDocx}
            className="px-3 py-1.5 text-xs font-semibold text-court-700 hover:text-court-800 bg-court-50 hover:bg-court-100 border border-court-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileDown className="w-3.5 h-3.5 text-court-600" />
            <span>{isExportingDocx ? "Generating DOCX..." : "Download DOCX"}</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={!transcript}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-court-700 hover:bg-court-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:pointer-events-none"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
