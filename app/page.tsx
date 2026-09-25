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
import { DeveloperDebugPanel } from "@/components/DeveloperDebugPanel";
import { CourtFooter } from "@/components/CourtFooter";
import {
  getSupportedAudioMimeType,
  getAudioConstraints,
  appendTranscriptText,
  AudioDebugInfo,
} from "@/lib/audio";
import {
  normalizeLegalTranscript,
  isHallucination,
} from "@/lib/legalNormalizer";

const SAMPLE_ENGLISH_TRANSCRIPT = `The Applicant has filed an application under Section 144 of the CPC.

The Respondent is directed to appear before the Hon'ble Court.`;

const SAMPLE_MARATHI_TRANSCRIPT = `अर्जदाराने कलम 144 अन्वये अर्ज दाखल केला आहे.

प्रतिवादीला मा. न्यायालयासमोर उपस्थित राहण्याचे आदेश देण्यात येत आहेत.`;

const SESSIONS_TRIAL_ORDER_SAMPLE = `PW-3 Vikram Singh examined, cross-examined, and discharged. PW-4 Sub-Inspector Mahendra Patil examined, cross-examined, and discharged. Exhibits P-18, P-19, and P-22 duly marked. Prosecution gives up listed witnesses numbers 5 and 6.

Issue bailable warrant in the sum of five thousand rupees against Dr. S.K. Roy, CMO, Government Medical College, to secure his presence for marking the Post-Mortem Report on the next date of hearing. Summons be also issued to the Investigating Officer, Inspector Deshmukh.

Accused Ramesh Kumar remanded to judicial custody till the next date. Accused Suresh's bail bond extended on same terms.

Matter is adjourned for further prosecution evidence to 12th October 2021.`;

export default function CourtAiPage() {
  // Core State Machine: "ready" | "recording" | "processing" | "success" | "error"
  const [dictationState, setDictationState] = useState<DictationState>("ready");
  const [statusMessage, setStatusMessage] = useState("Ready / तयार");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings: Default to "combined" (English + Marathi auto-detect verbatim stenographer)
  const [language, setLanguage] = useState<SupportedLanguage>("combined");
  const [mode, setMode] = useState<TranscriptionMode>("court_draft");
  const [transcript, setTranscript] = useState("");

  // Live Feedback & Debugging
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLiveTyping, setIsLiveTyping] = useState(false);
  const [debugInfo, setDebugInfo] = useState<AudioDebugInfo | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  // Audio References
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive Real-Time Stenographer State Tracking
  const activeRecorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const speechFramesInSliceRef = useRef<number>(0);
  const overallVoiceDetectedRef = useRef<boolean>(false);
  const maxVolumeRef = useRef<number>(0);
  const transcriptionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const totalChunksProcessedRef = useRef<number>(0);
  const lastRecordedBlobRef = useRef<Blob | null>(null);
  const currentSessionIdRef = useRef<string>("");

  // Clean up all audio hardware resources safely
  const cleanupAudioHardware = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Post single audio slice blob to /api/transcribe and append live to document
  const queueChunkForTranscription = useCallback(
    (audioBlob: Blob, sessionId: string) => {
      const mimeInfo = getSupportedAudioMimeType();
      const extension =
        mimeInfo.extension || (audioBlob.type.includes("mp4") ? "mp4" : "webm");
      const chunkIndex = ++totalChunksProcessedRef.current;

      const task = async () => {
        try {
          setIsLiveTyping(true);
          const formData = new FormData();
          formData.append(
            "audio",
            audioBlob,
            `court_chunk_${chunkIndex}_${sessionId}.${extension}`
          );
          formData.append("language", language);

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            console.warn(`[Chunk ${chunkIndex} Error]:`, data.error);
            return;
          }

          const rawText: string = (data.rawText || data.text || "").trim();
          // Filter out empty text and silence/ambient hallucinations
          if (!rawText || isHallucination(rawText)) return;

          // Apply legal normalization deterministically
          let finalText = rawText;
          if (mode === "court_draft") {
            finalText = normalizeLegalTranscript(rawText, "court_draft");
          } else if (mode === "verbatim") {
            finalText = normalizeLegalTranscript(rawText, "verbatim");
          } else if (mode === "translate") {
            finalText = normalizeLegalTranscript(rawText, "translate");
          }

          if (!finalText || isHallucination(finalText)) return;

          // Live append to transcript editor with smart word overlap deduplication
          setTranscript((prev) => appendTranscriptText(prev, finalText));

          // Update stenographer live typing indicator
          setStatusMessage(
            `✍️ Stenographer typed: "${finalText.slice(0, 36)}${
              finalText.length > 36 ? "..." : ""
            }"`
          );

          // Update developer debug diagnostics
          setDebugInfo({
            mimeType: audioBlob.type || mimeInfo.mimeType,
            sizeKb: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            sizeBytes: audioBlob.size,
            durationSeconds: "4.0s (Live Chunk)",
            language: language,
            model: data.model || "whisper-1",
            rawTranscript: rawText,
            finalTranscript: finalText,
            voiceDetected: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (err) {
          console.error(`[Chunk ${chunkIndex} Processing Failed]:`, err);
        } finally {
          setTimeout(() => {
            setIsLiveTyping(false);
          }, 1200);
        }
      };

      // Ensure strictly sequential, in-order transcription appending
      transcriptionQueueRef.current = transcriptionQueueRef.current.then(
        task,
        task
      );
    },
    [language, mode]
  );

  // Instantiate and start a standalone audio slice recorder on the current stream
  const startNewSliceRecorder = useCallback(
    (sessionId: string) => {
      if (!streamRef.current || !isRecordingRef.current) return;

      const mimeInfo = getSupportedAudioMimeType();
      const recorder = mimeInfo.mimeType
        ? new MediaRecorder(streamRef.current, { mimeType: mimeInfo.mimeType })
        : new MediaRecorder(streamRef.current);

      const sliceChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          sliceChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Sustained speech check: require at least 8 frames (~130ms) of sustained speech energy (>= 12% volume)
        // Completely suppresses ambient room noise, typing, and quiet breathing so silence is NEVER sent to the API
        const speechFrames = speechFramesInSliceRef.current;
        speechFramesInSliceRef.current = 0; // reset for next slice

        const hasSustainedSpeech = speechFrames >= 8;

        if (sliceChunks.length > 0 && hasSustainedSpeech) {
          overallVoiceDetectedRef.current = true;
          const finalMime =
            mimeInfo.mimeType || recorder.mimeType || "audio/webm";
          const sliceBlob = new Blob(sliceChunks, { type: finalMime });
          lastRecordedBlobRef.current = sliceBlob;
          queueChunkForTranscription(sliceBlob, sessionId);
        }
      };

      activeRecorderRef.current = recorder;
      recorder.start(250);
    },
    [queueChunkForTranscription]
  );

  // START DICTATION: Real-time stenographer recording session
  const startDictation = async () => {
    setErrorMessage(null);
    setCanRetry(false);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorMessage("Audio recording is not supported in this browser.");
      setDictationState("error");
      return;
    }

    try {
      setStatusMessage("Requesting microphone permission...");

      // 1. Request microphone with noise suppression, echo cancellation, auto gain
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // 2. Set up Web Audio API Analyser for live volume meter and voice activity detection
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = ctx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalizedLevel = Math.min(
              100,
              Math.round((average / 128) * 100)
            );

            setAudioLevel(normalizedLevel);
            if (normalizedLevel > maxVolumeRef.current) {
              maxVolumeRef.current = normalizedLevel;
            }

            // Real voice detection: genuine speech produces >= 12% energy
            // Count frames to distinguish genuine speech from transient background noise
            if (normalizedLevel >= 12) {
              speechFramesInSliceRef.current += 1;
            }

            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (audioCtxErr) {
        console.warn("Web Audio Analyser not available:", audioCtxErr);
      }

      // 3. Initialize real-time stenographer session
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 7)}`;
      currentSessionIdRef.current = sessionId;
      isRecordingRef.current = true;
      maxVolumeRef.current = 0;
      overallVoiceDetectedRef.current = false;
      speechFramesInSliceRef.current = 0;
      totalChunksProcessedRef.current = 0;
      transcriptionQueueRef.current = Promise.resolve();

      // Start initial slice recorder
      startNewSliceRecorder(sessionId);

      // Start UI duration timer
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // 4. Rolling slice rotation every 4.0 seconds for real-time progressive typing
      const CHUNK_WINDOW_MS = 4000;
      chunkIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;

        const prevRecorder = activeRecorderRef.current;
        // Start next recorder immediately on the same stream to avoid missing speech samples
        startNewSliceRecorder(sessionId);

        // Stop previous recorder; its onstop triggers and dispatches chunk to transcription queue
        if (prevRecorder && prevRecorder.state === "recording") {
          try {
            prevRecorder.stop();
          } catch (e) {
            console.warn("Error stopping slice recorder:", e);
          }
        }
      }, CHUNK_WINDOW_MS);

      setDictationState("recording");
      setStatusMessage(
        "🔴 Stenographer listening... Transcribing live in English & Marathi."
      );
    } catch (err: unknown) {
      console.error("Microphone startup error:", err);
      cleanupAudioHardware();
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
    }
  };

  // STOP & TRANSCRIBE: Finalize remaining speech and complete stenographer dictation
  const stopDictation = useCallback(async () => {
    if (!isRecordingRef.current) {
      cleanupAudioHardware();
      setDictationState("ready");
      setStatusMessage("Ready / तयार");
      return;
    }

    isRecordingRef.current = false;

    // Stop chunk rotation timer
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    // Stop active slice recorder to flush final phrase
    const lastRecorder = activeRecorderRef.current;
    if (lastRecorder && lastRecorder.state === "recording") {
      try {
        lastRecorder.stop();
      } catch (e) {
        console.warn("Error stopping final recorder:", e);
      }
    }

    // Clean up microphone hardware
    cleanupAudioHardware();

    setDictationState("processing");
    setStatusMessage("Stenographer finalizing transcript...");

    // Wait for all remaining queued chunks to finish transcribing
    try {
      await transcriptionQueueRef.current;
    } catch (queueErr) {
      console.error("Queue finalize error:", queueErr);
    }

    // Evaluate final transcription outcome
    if (totalChunksProcessedRef.current > 0 || transcript.trim().length > 0) {
      setDictationState("success");
      setStatusMessage("✓ Transcript finalized by Stenographer");
      setCanRetry(false);

      setTimeout(() => {
        setDictationState((curr) => (curr === "success" ? "ready" : curr));
        setStatusMessage("Ready / तयार");
      }, 2500);
    } else if (!overallVoiceDetectedRef.current) {
      setDictationState("ready");
      setErrorMessage(
        "No speech detected. Please speak clearly into your microphone."
      );
      setStatusMessage("Ready / तयार");
      setCanRetry(false);
    } else {
      setDictationState("ready");
      setStatusMessage("Ready / तयार");
      setCanRetry(false);
    }
  }, [cleanupAudioHardware, transcript]);

  // RETRY: Try transcription again with last saved audio blob without re-speaking
  const handleRetryLastAudio = () => {
    if (lastRecordedBlobRef.current) {
      queueChunkForTranscription(
        lastRecordedBlobRef.current,
        currentSessionIdRef.current || `retry_${Date.now()}`
      );
    } else {
      startDictation();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupAudioHardware();
    };
  }, [cleanupAudioHardware]);

  // Clear transcript
  const handleClearTranscript = () => {
    if (confirm("Are you sure you want to clear the transcript? / आपण मसुदा साफ करू इच्छिता?")) {
      setTranscript("");
    }
  };

  // Load sample court transcript
  const handleLoadSample = (
    type: "english" | "marathi" | "sessions_trial" = "english"
  ) => {
    if (type === "sessions_trial") {
      setTranscript(SESSIONS_TRIAL_ORDER_SAMPLE);
    } else if (type === "marathi") {
      setTranscript(SAMPLE_MARATHI_TRANSCRIPT);
    } else {
      setTranscript(SAMPLE_ENGLISH_TRANSCRIPT);
    }
    setStatusMessage("Demo sample loaded / नमुना मसुदा लोड झाला.");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Court Header */}
      <CourtHeader />

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 no-print flex-1">
        {/* Case Info Banner */}
        <CaseInfoBar caseDetails={DEMO_CASE_DETAILS} />

        {/* Controls Bar: Language & Processing Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={dictationState === "recording" || dictationState === "processing"}
          />
          <ModeSelector
            value={mode}
            onChange={setMode}
            disabled={dictationState === "recording" || dictationState === "processing"}
          />
        </div>

        {/* Area A: LIVE STATUS & Microphone Dictation Hub */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-xs flex flex-col items-center justify-center text-center">
          <MicrophoneButton
            state={dictationState}
            isRecording={dictationState === "recording"}
            onStart={startDictation}
            onStop={stopDictation}
            onRetry={handleRetryLastAudio}
            recordingDuration={recordingDuration}
            audioLevel={audioLevel}
            disabled={dictationState === "processing"}
            canRetry={canRetry}
          />

          <div className="w-full max-w-xl mt-2 sm:mt-3">
            <StatusIndicator
              state={dictationState}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onDismissError={() => setErrorMessage(null)}
              onRetry={handleRetryLastAudio}
              canRetry={canRetry}
            />
          </div>
        </div>

        {/* Area B: FINAL TRANSCRIPT & Professional Order Editor */}
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
          disabled={dictationState === "processing"}
          isLiveTyping={isLiveTyping}
        />

        {/* Court Demo Script Section */}
        <DemoScript />

        {/* Developer Debug Mode: Technical Inspection Panel */}
        <DeveloperDebugPanel debugInfo={debugInfo} />
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
