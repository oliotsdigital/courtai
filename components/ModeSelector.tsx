import React from "react";
import { Sliders } from "lucide-react";

export type TranscriptionMode = "court_draft" | "verbatim" | "translate";

interface ModeOption {
  id: TranscriptionMode;
  label: string;
  description: string;
  badge?: string;
}

const MODES: ModeOption[] = [
  {
    id: "court_draft",
    label: "Court Draft (Standard)",
    description: "Legal normalization (Section 144, CPC, Hon'ble Court, paragraphing)",
    badge: "Recommended",
  },
  {
    id: "verbatim",
    label: "Verbatim (Exact Words)",
    description: "Direct speech-to-text without legal term replacements",
    badge: "Safest",
  },
  {
    id: "translate",
    label: "Translation Mode",
    description: "Converts Marathi / Hindi proceedings to English order draft",
  },
];

interface ModeSelectorProps {
  value: TranscriptionMode;
  onChange: (mode: TranscriptionMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor="mode-select"
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-court-700" />
          Processing Mode / पद्धत
        </label>
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
          {value === "court_draft" ? "Legal Formatted" : value === "verbatim" ? "Exact Spoken" : "Translation"}
        </span>
      </div>

      <div className="relative">
        <select
          id="mode-select"
          value={value}
          onChange={(e) => onChange(e.target.value as TranscriptionMode)}
          disabled={disabled}
          className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 sm:py-2 pr-9 text-sm sm:text-base font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-court-600 focus:border-court-600 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer min-h-[44px]"
        >
          {MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label} {mode.badge ? `(${mode.badge})` : ""}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg
            className="w-4 h-4 fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Court Draft applies Section number formatting and punctuation cleanup after transcription.
      </p>
    </div>
  );
};
