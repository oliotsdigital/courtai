import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquareQuote } from "lucide-react";

export const SAMPLE_DEMO_SCRIPT =
  "The Applicant has filed an application under Section one forty four of the CPC. Full stop. Next paragraph. The Respondent is directed to appear before the Court.";

export const DemoScript: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_DEMO_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-court-800">
          <Sparkles className="w-4 h-4 text-court-600" />
          <span>Dictation Test Script</span>
        </div>
        <button
          type="button"
          onClick={handleCopyScript}
          className="text-xs font-semibold text-court-700 hover:text-court-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Demo Script</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-800 font-serif text-sm sm:text-base leading-relaxed italic relative">
        <MessageSquareQuote className="w-4 h-4 text-slate-400 absolute top-2 right-2 opacity-50" />
        &ldquo;{SAMPLE_DEMO_SCRIPT}&rdquo;
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
        <div className="bg-white p-2 rounded border border-slate-200">
          <span className="font-semibold text-slate-800 block">Voice Punctuation:</span>
          Say &ldquo;full stop&rdquo; → . or &ldquo;next paragraph&rdquo; → newline
        </div>
        <div className="bg-white p-2 rounded border border-slate-200">
          <span className="font-semibold text-slate-800 block">Section Normalization:</span>
          &ldquo;section one forty four&rdquo; → Section 144
        </div>
        <div className="bg-white p-2 rounded border border-slate-200">
          <span className="font-semibold text-slate-800 block">Multilingual Legal:</span>
          English, हिन्दी, and मराठी are natively recognized
        </div>
      </div>
    </div>
  );
};
