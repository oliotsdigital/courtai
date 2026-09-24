import React from "react";
import { Mic, Square, Loader2, Check, AlertCircle } from "lucide-react";

export type DictationState =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "error";

interface MicrophoneButtonProps {
  state: DictationState;
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  state,
  isRecording,
  onStart,
  onStop,
  disabled = false,
}) => {
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="relative flex items-center justify-center">
        {/* Subtle animation ring while recording */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full animate-listening-ring pointer-events-none" />
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled && !isRecording}
          aria-label={isRecording ? "Stop dictation" : "Start dictation"}
          className={`relative z-10 flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 active:scale-95"
              : state === "processing"
              ? "bg-slate-100 text-slate-700 border-2 border-slate-300 focus:ring-slate-300"
              : "bg-court-700 text-white hover:bg-court-800 focus:ring-court-400 active:scale-95 hover:shadow-lg"
          } ${disabled && !isRecording ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 fill-current mb-1" />
              <span className="text-xs tracking-wide uppercase font-bold">Stop</span>
            </>
          ) : state === "processing" ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-court-700 mb-1" />
              <span className="text-xs text-slate-600 font-semibold tracking-wide">
                Processing
              </span>
            </>
          ) : state === "error" ? (
            <>
              <AlertCircle className="w-8 h-8 text-amber-300 mb-1" />
              <span className="text-xs tracking-wide uppercase">Retry</span>
            </>
          ) : (
            <>
              <Mic className="w-9 h-9 mb-1" />
              <span className="text-xs tracking-wide uppercase font-bold">
                Start Dictate
              </span>
            </>
          )}
        </button>
      </div>

      {/* Helpful context text below button */}
      <div className="mt-3 text-center">
        {isRecording ? (
          <p className="text-sm font-medium text-red-600 flex items-center justify-center gap-1.5 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span>Listening... Speak clearly into your microphone</span>
          </p>
        ) : state === "processing" ? (
          <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-court-700" />
            <span>Sending audio to OpenAI Speech-to-Text...</span>
          </p>
        ) : state === "success" ? (
          <p className="text-sm font-medium text-emerald-600 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Transcript updated</span>
          </p>
        ) : state === "error" ? (
          <p className="text-sm font-medium text-red-600">
            Click Start Dictate to try again
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            बोलणे सुरू करा / Tap to begin legal dictation (English &amp; मराठी)
          </p>
        )}
      </div>
    </div>
  );
};
