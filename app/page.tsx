"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CourtHeader } from "@/components/CourtHeader";
import { CaseInfoBar, DEMO_CASE_DETAILS } from "@/components/CaseInfoBar";
import {
  LanguageSelector,
  SupportedLanguage,
} from "@/components/LanguageSelector";
import { ModeSelector, TranscriptionMode } from "@/components/ModeSelector";
import {
  MicrophoneButton,
  DictationState,
} from "@/components/MicrophoneButton";
import { StatusIndicator } from "@/components/StatusIndicator";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { DemoScript } from "@/components/DemoScript";
import { DocumentPrintView } from "@/components/DocumentPrintView";
import { CourtFooter } from "@/components/CourtFooter";
import { getSupportedAudioMimeType, mergeTranscriptChunks } from "@/lib/audio";
import { normalizeLegalTranscript } from "@/lib/legalNormalizer";

const SAMPLE_FALLBACK_TRANSCRIPT = `The Applicant has filed an application under Section 144 of the CPC.

The Respondent is directed to appear before the Court.`;

const CHUNK_INTERVAL_MS = 6000; // 6 seconds chunks for live legal dictation feel

export default function CourtAiPage() {
  // Main states
  const [isRecording, setIsRecording] = useState(false);
  const [dictationState, setDictationState] = useState<DictationState>("idle");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [language, setLanguage] = useState<SupportedLanguage>("auto");
  const [mode, setMode] = useState<TranscriptionMode>("court_draft");
  const [transcript, setTranscript] = useState("");

  // Refs for audio handling and ongoing state without stale closures
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentChunkIndex = useRef(0);
  const processingCount = useRef(0);

  // Send an audio blob chunk to /api/transcribe
  const transcribeAudioChunk = useCallback(
    async (audioBlob: Blob, chunkNumber: number) => {
      // Don't send empty or tiny silence blobs (< 1KB)
      if (audioBlob.size < 1000) {
        return;
      }

      processingCount.current += 1;
      setDictationState((prev) => (prev === "recording" ? "recording" : "processing"));

      try {
        const formData = new FormData();
        const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
        formData.append("audio", audioBlob, `chunk_${chunkNumber}.${extension}`);
        formData.append("language", language);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Speech transcription failed.");
        }

        const newRawText = data.text?.trim();

        if (newRawText) {
          setTranscript((prev) =>
            mergeTranscriptChunks(prev, newRawText, mode)
          );
          setStatusMessage("Transcript updated.");
          if (!isRecordingRef.current) {
            setDictationState("success");
            setTimeout(() => {
              setDictationState("idle");
              setStatusMessage("Ready");
            }, 2500);
          }
        }
      } catch (err: unknown) {
        console.error("Transcription chunk error:", err);
        const errStr =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during transcription.";
        setErrorMessage(errStr);
        setDictationState("error");
      } finally {
        processingCount.current = Math.max(0, processingCount.current - 1);
        if (processingCount.current === 0 && !isRecordingRef.current) {
          setDictationState((prev) => (prev === "error" ? "error" : "idle"));
        }
      }
    },
    [language, mode]
  );

  // Starts a recording cycle for one chunk, then chains to the next if still recording
  const startRecordingCycle = useCallback(() => {
    if (!isRecordingRef.current || !streamRef.current) {
      return;
    }

    try {
      const mimeInfo = getSupportedAudioMimeType();
      const recorder = mimeInfo.mimeType
        ? new MediaRecorder(streamRef.current, { mimeType: mimeInfo.mimeType })
        : new MediaRecorder(streamRef.current);

      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      const chunkNum = ++currentChunkIndex.current;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunks.length > 0) {
          const mime = mimeInfo.mimeType || "audio/webm";
          const audioBlob = new Blob(chunks, { type: mime });
          transcribeAudioChunk(audioBlob, chunkNum);
        }

        // Continue next cycle if still recording
        if (isRecordingRef.current) {
          startRecordingCycle();
        }
      };

      recorder.start();

      // Stop recorder after CHUNK_INTERVAL_MS to trigger onstop and transcribe
      timerRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, CHUNK_INTERVAL_MS);
    } catch (err: unknown) {
      console.error("Error in recording cycle:", err);
      setErrorMessage("Failed to start audio recording cycle.");
      setDictationState("error");
      stopDictation();
    }
  }, [transcribeAudioChunk]);

  // Request microphone permission and initiate dictation
  const startDictation = async () => {
    setErrorMessage(null);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorMessage(
        "Audio recording is not supported in this browser environment."
      );
      setDictationState("error");
      return;
    }

    try {
      setStatusMessage("Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);
      setDictationState("recording");
      setStatusMessage("Listening... Speak clearly.");

      startRecordingCycle();
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      let friendlyError =
        "Unable to access microphone. Please check your browser audio permissions.";
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          friendlyError =
            "Microphone permission was denied. Please allow microphone access in your browser settings.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          friendlyError = "No microphone was detected on this device.";
        }
      }
      setErrorMessage(friendlyError);
      setDictationState("error");
      setStatusMessage("Microphone error");
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Stop recording and release microphone tracks
  const stopDictation = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (processingCount.current > 0) {
      setDictationState("processing");
      setStatusMessage("Finalizing transcription...");
    } else {
      setDictationState("idle");
      setStatusMessage("Dictation stopped.");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Clear transcript
  const handleClearTranscript = () => {
    if (confirm("Are you sure you want to clear the transcript?")) {
      setTranscript("");
    }
  };

  // Load fallback sample transcript
  const handleLoadSample = () => {
    setTranscript(SAMPLE_FALLBACK_TRANSCRIPT);
    setStatusMessage("Demo sample loaded.");
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Court Header */}
      <CourtHeader />

      {/* Main Content Area (Screen View) */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 no-print flex-1">
        {/* Case Info Banner */}
        <CaseInfoBar caseDetails={DEMO_CASE_DETAILS} />

        {/* Controls Bar: Language & Processing Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isRecording}
          />
          <ModeSelector
            value={mode}
            onChange={setMode}
            disabled={isRecording}
          />
        </div>

        {/* Microphone Dictation Action Hub */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center text-center">
          <MicrophoneButton
            state={dictationState}
            isRecording={isRecording}
            onStart={startDictation}
            onStop={stopDictation}
          />

          <div className="w-full max-w-xl mt-4">
            <StatusIndicator
              state={dictationState}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onDismissError={() => setErrorMessage(null)}
            />
          </div>
        </div>

        {/* Live Transcript & Draft Editor */}
        <TranscriptEditor
          transcript={transcript}
          onChange={setTranscript}
          onClear={handleClearTranscript}
          onLoadSample={handleLoadSample}
          caseMeta={{
            courtName: DEMO_CASE_DETAILS.courtName,
            caseNumber: DEMO_CASE_DETAILS.caseNumber,
            applicant: DEMO_CASE_DETAILS.applicant,
            respondent: DEMO_CASE_DETAILS.respondent,
            dateStr: new Date().toLocaleDateString("en-US", {
              dateStyle: "long",
            }),
            presidingOfficer: "District & Sessions Judge",
          }}
        />

        {/* Demo Script Section */}
        <DemoScript />
      </main>

      {/* Print / Save as PDF Layout (Visible ONLY during window.print()) */}
      <DocumentPrintView
        transcript={transcript}
        caseDetails={DEMO_CASE_DETAILS}
      />

      {/* Footer */}
      <CourtFooter />
    </div>
  );
}
