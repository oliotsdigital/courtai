import React, { useState, useRef } from "react";
import {
  Copy,
  Trash2,
  FileDown,
  Printer,
  FileText,
  Check,
  RotateCcw,
  Edit3,
  Scale,
} from "lucide-react";
import { calculateTranscriptStats } from "@/lib/audio";
import { exportToDocx, CourtCaseMeta } from "@/lib/docxExport";

interface TranscriptEditorProps {
  transcript: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onLoadSample: (type?: "english" | "marathi" | "sessions_trial") => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleFocusEditor = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
      {/* Editor Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-court-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-court-800">
            FINAL TRANSCRIPT &bull; ORDER / JUDGMENT
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            (न्यायालयीन आदेश मसुदा)
          </span>
        </div>

        {/* Quick Sample Fallback Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onLoadSample("sessions_trial")}
            title="Load Sessions Case 412/2021 trial order sample"
            className="text-xs font-semibold text-court-800 hover:text-court-900 bg-court-50 hover:bg-court-100 border border-court-200 rounded-md px-2.5 py-1.5 transition-colors flex items-center gap-1 shadow-2xs min-h-[34px]"
          >
            <RotateCcw className="w-3 h-3 text-court-600" />
            <span>Sample (Sessions Trial)</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadSample("english")}
            title="Load English court order sample"
            className="text-xs font-medium text-slate-700 hover:text-court-700 bg-white border border-slate-200 hover:border-court-300 rounded-md px-2.5 py-1.5 transition-colors flex items-center gap-1 shadow-2xs min-h-[34px]"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Sample (Sec 144)</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadSample("marathi")}
            title="Load Marathi court order sample"
            className="text-xs font-medium text-slate-700 hover:text-court-700 bg-white border border-slate-200 hover:border-court-300 rounded-md px-2.5 py-1.5 transition-colors flex items-center gap-1 shadow-2xs min-h-[34px]"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Sample (मराठी)</span>
          </button>
        </div>
      </div>

      {/* Helper Context Subtitle */}
      <div className="px-4 py-1.5 bg-court-50/40 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span>
          <strong>Note:</strong> Review and edit the transcript before using it in a final court order or judgment.
        </span>
        <span className="hidden sm:inline text-court-700 font-medium">
          Editable Document View
        </span>
      </div>

      {/* Formal Document Container */}
      <div className="relative p-3 sm:p-5 flex-1 bg-white">
        <textarea
          ref={textareaRef}
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Final transcription will appear here after dictation is stopped and verified... You can also edit, correct, or touch-type directly into this court order."
          rows={8}
          className="w-full min-h-[220px] sm:min-h-[260px] p-3 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-court-600 focus:border-court-600 resize-y font-normal font-sans"
        />
      </div>

      {/* Editor Footer & Action Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Word and Character Count */}
        <div className="flex items-center justify-between sm:justify-start space-x-4 text-xs font-medium text-slate-500">
          <span>
            Words: <strong className="text-slate-800">{stats.wordCount}</strong>
          </span>
          <span>
            Characters:{" "}
            <strong className="text-slate-800">{stats.characterCount}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Edit / Focus */}
          <button
            type="button"
            onClick={handleFocusEditor}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit / संपादित करा</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClear}
            disabled={!transcript}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear / साफ</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!transcript}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy / कॉपी</span>
              </>
            )}
          </button>

          {/* Download TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!transcript}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          {/* Download DOCX */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={!transcript || isExportingDocx}
            className="px-3 py-2 text-xs font-semibold text-court-700 hover:text-court-800 bg-court-50 hover:bg-court-100 border border-court-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
          >
            <FileDown className="w-3.5 h-3.5 text-court-600" />
            <span>{isExportingDocx ? "Generating..." : "Download DOCX"}</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={!transcript}
            className="col-span-2 sm:col-span-1 px-3.5 py-2 text-xs font-semibold text-white bg-court-800 hover:bg-court-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF (प्रिंट)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
