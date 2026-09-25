import React from "react";
import { Mic, Square, Loader2, Check, RotateCcw, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/audio";

export type DictationState =
  | "ready"
  | "recording"
  | "processing"
  | "success"
  | "error";

interface MicrophoneButtonProps {
  state: DictationState;
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onRetry?: () => void;
  recordingDuration?: number;
  audioLevel?: number; // 0 to 100
  disabled?: boolean;
  canRetry?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  state,
  isRecording,
  onStart,
  onStop,
  onRetry,
  recordingDuration = 0,
  audioLevel = 0,
  disabled = false,
  canRetry = false,
}) => {
  const handlePrimaryClick = () => {
    if (isRecording) {
      onStop();
    } else if (state === "ready" || state === "success") {
      onStart();
    } else if (state === "error") {
      if (canRetry && onRetry) {
        onRetry();
      } else {
        onStart();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-4 sm:my-6">
      <div className="relative flex items-center justify-center">
        {/* Subtle pulsating animation ring while recording */}
        {isRecording && (
          <div
            className="absolute -inset-2 sm:-inset-3 rounded-full bg-red-500/20 animate-ping pointer-events-none"
            style={{ animationDuration: "1.8s" }}
          />
        )}

        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={disabled || state === "processing"}
          aria-label={
            isRecording
              ? "Stop and transcribe recording"
              : state === "processing"
              ? "Processing audio"
              : "Start dictation"
          }
          className={`relative z-10 flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 active:scale-95 shadow-red-500/30"
              : state === "processing"
              ? "bg-slate-100 text-slate-700 border-2 border-slate-300 focus:ring-slate-300 cursor-not-allowed opacity-90"
              : state === "error"
              ? "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400 active:scale-95"
              : "bg-court-800 text-white hover:bg-court-900 focus:ring-court-400 active:scale-95 hover:shadow-xl shadow-court-900/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 fill-current mb-1" />
              <span className="text-[11px] sm:text-xs tracking-wider uppercase font-bold text-center px-1">
                Stop &amp; Transcribe
              </span>
            </>
          ) : state === "processing" ? (
            <>
              <Loader2 className="w-9 h-9 animate-spin text-court-700 mb-1" />
              <span className="text-xs text-slate-700 font-semibold tracking-wide">
                Processing...
              </span>
            </>
          ) : state === "error" ? (
            <>
              <RotateCcw className="w-8 h-8 text-white mb-1" />
              <span className="text-xs tracking-wider uppercase font-bold">
                {canRetry ? "Try Again" : "Dictate"}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-10 h-10 mb-1" />
              <span className="text-xs tracking-wider uppercase font-bold">
                Start Dictation
              </span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Status / Timer / Audio Level Feedback */}
      <div className="mt-4 text-center w-full max-w-sm">
        {isRecording ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full font-mono text-sm font-semibold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span>LISTENING: {formatDuration(recordingDuration)}</span>
            </div>

            {/* Live Volume Meter Bar */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-32 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-75 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(8, audioLevel))}%` }}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Speak your dictation now. Click <strong>Stop &amp; Transcribe</strong> when finished.
            </p>
          </div>
        ) : state === "processing" ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-court-800 flex items-center justify-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin text-court-700" />
              <span>Processing speech...</span>
            </p>
            <p className="text-xs text-slate-500">
              Converting speech to text via OpenAI STT...
            </p>
          </div>
        ) : state === "success" ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>✓ Transcription complete</span>
            </p>
            <p className="text-xs text-slate-500">
              Click Start Dictation to dictate the next sentence or paragraph.
            </p>
          </div>
        ) : state === "error" ? (
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-medium text-amber-700">
              Unable to transcribe recording.
            </p>
            {canRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Last Audio</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              Speak clearly and naturally.
            </p>
            <p className="text-xs text-slate-500">
              बोलणे सुरू करा / Click Start Dictation when ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
