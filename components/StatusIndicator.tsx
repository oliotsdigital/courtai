import React from "react";
import { CheckCircle2, AlertTriangle, Radio, Loader2, Sparkles } from "lucide-react";
import { DictationState } from "./MicrophoneButton";

interface StatusIndicatorProps {
  state: DictationState;
  statusMessage: string;
  errorMessage: string | null;
  onDismissError?: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  statusMessage,
  errorMessage,
  onDismissError,
  onRetry,
  canRetry = false,
}) => {
  return (
    <div className="w-full space-y-2">
      {/* Primary Status Pill */}
      <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg text-slate-700">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
            Live Status:
          </span>
          <div className="flex items-center gap-1.5 font-medium">
            {state === "recording" ? (
              <>
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-red-700 font-semibold">🔴 Listening...</span>
              </>
            ) : state === "processing" ? (
              <>
                <Loader2 className="w-4 h-4 text-court-700 animate-spin" />
                <span className="text-court-800 font-medium">◌ Processing speech...</span>
              </>
            ) : state === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">✓ Transcription complete</span>
              </>
            ) : state === "error" ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-amber-800 font-semibold">Attention required</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">{statusMessage || "Ready / तयार"}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-court-600" />
          <span>Professional Dictation Engine</span>
        </div>
      </div>

      {/* Friendly Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm flex items-start justify-between shadow-xs animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-950">Transcription Notice</div>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {canRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-court-700 hover:text-court-900 bg-white hover:bg-slate-50 border border-court-300 rounded px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors"
              >
                Try Again
              </button>
            )}
            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold uppercase px-1 py-0.5"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
