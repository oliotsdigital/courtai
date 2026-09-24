import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquareQuote } from "lucide-react";

export interface DemoScriptOption {
  id: "combined" | "marathi" | "english";
  label: string;
  badge: string;
  script: string;
  description: string;
}

export const DEMO_SCRIPTS: DemoScriptOption[] = [
  {
    id: "combined",
    label: "English + Marathi",
    badge: "Bilingual (द्विभाषिक)",
    script:
      "The Applicant ने Section one forty four of the CPC अन्वये अर्ज दाखल केला आहे. Full stop. Next paragraph. The Respondent ला Hon'ble Court समोर हजर राहण्याचे आदेश देण्यात येत आहेत.",
    description: "Legal code-switching commonly used in District & High Courts",
  },
  {
    id: "marathi",
    label: "Marathi Only",
    badge: "मराठी",
    script:
      "अर्जदाराने कलम एकशे चव्वेचाळीस अन्वये अर्ज दाखल केला आहे. पूर्णविराम. पुढील परिच्छेद. प्रतिवादीला मा. न्यायालयासमोर उपस्थित राहण्याचे आदेश देण्यात येत आहेत.",
    description: "Pure Marathi legal order dictation with 'पूर्णविराम' and 'कलम'",
  },
  {
    id: "english",
    label: "English Only",
    badge: "English",
    script:
      "The Applicant has filed an application under Section one forty four of the CPC. Full stop. Next paragraph. The Respondent is directed to appear before the Court.",
    description: "Standard English court dictation with legal normalization",
  },
];

export const DemoScript: React.FC = () => {
  const [selectedId, setSelectedId] = useState<"combined" | "marathi" | "english">("combined");
  const [copied, setCopied] = useState(false);

  const current = DEMO_SCRIPTS.find((s) => s.id === selectedId) || DEMO_SCRIPTS[0];

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(current.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-court-800">
          <Sparkles className="w-4 h-4 text-court-600 flex-shrink-0" />
          <span>Dictation Test Script / चाचणी वाक्ये</span>
        </div>

        {/* Script Selection Pills (Mobile-Friendly Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DEMO_SCRIPTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center ${
                selectedId === item.id
                  ? "bg-court-700 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Script Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 text-slate-800 font-serif text-sm sm:text-base leading-relaxed relative shadow-2xs">
        <div className="flex items-center justify-between mb-1.5 not-italic">
          <span className="text-[11px] font-bold uppercase tracking-wider text-court-700 bg-court-50 px-2 py-0.5 rounded border border-court-200">
            {current.badge}
          </span>
          <button
            type="button"
            onClick={handleCopyScript}
            className="text-xs font-semibold text-court-700 hover:text-court-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>
        <p className="italic text-slate-900 mt-2">
          &ldquo;{current.script}&rdquo;
        </p>
      </div>

      {/* Mobile-Friendly Feature Highlights */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Voice Punctuation:</span>
          &ldquo;full stop&rdquo; or &ldquo;पूर्णविराम&rdquo; → . &bull; &ldquo;next paragraph&rdquo; or &ldquo;नवीन परिच्छेद&rdquo; → newline
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Section Normalization:</span>
          &ldquo;section one forty four&rdquo; or &ldquo;कलम एकशे चव्वेचाळीस&rdquo; → Section 144
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Dual-Language Precision:</span>
          Code-switching between English &amp; Marathi preserves legal accuracy
        </div>
      </div>
    </div>
  );
};
