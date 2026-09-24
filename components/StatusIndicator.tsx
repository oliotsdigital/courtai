import React from "react";
import { CheckCircle2, AlertTriangle, Radio, Loader2 } from "lucide-react";
import { DictationState } from "./MicrophoneButton";

interface StatusIndicatorProps {
  state: DictationState;
  statusMessage: string;
  errorMessage: string | null;
  onDismissError?: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  statusMessage,
  errorMessage,
  onDismissError,
}) => {
  return (
    <div className="w-full space-y-2">
      {/* Primary Status Pill */}
      <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg text-slate-700">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
            Status:
          </span>
          <div className="flex items-center gap-1.5 font-medium">
            {state === "recording" ? (
              <>
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-red-700 font-semibold">Listening...</span>
              </>
            ) : state === "processing" ? (
              <>
                <Loader2 className="w-4 h-4 text-court-700 animate-spin" />
                <span className="text-court-800">Processing speech chunk...</span>
              </>
            ) : state === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Transcript updated</span>
              </>
            ) : state === "error" ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-amber-800">Action required</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">{statusMessage || "Ready"}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          5s - 10s chunked proxy
        </div>
      </div>

      {/* Friendly Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start justify-between shadow-sm animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Transcription Notice</div>
              <p className="text-xs sm:text-sm text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-red-600 hover:text-red-800 text-xs font-semibold uppercase ml-3 px-1 py-0.5"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};
