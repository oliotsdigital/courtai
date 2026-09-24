import React from "react";
import { Globe } from "lucide-react";

export type SupportedLanguage = "auto" | "en" | "mr" | "hi";

interface LanguageOption {
  id: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: "auto", label: "Auto Detect", nativeLabel: "Multilingual" },
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { id: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <label
        htmlFor="language-select"
        className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
      >
        <Globe className="w-3.5 h-3.5 text-court-700" />
        Language
      </label>
      <div className="relative">
        <select
          id="language-select"
          value={value}
          onChange={(e) => onChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3.5 py-2 pr-9 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-court-600 focus:border-court-600 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label} ({lang.nativeLabel})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
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
    </div>
  );
};
