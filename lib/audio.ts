/**
 * Audio recording utilities, MIME type detection, silence checking,
 * and deterministic transcript merging helpers for Court AI.
 */

import { normalizeLegalTranscript } from "./legalNormalizer";

export interface AudioMimeTypeInfo {
  mimeType: string;
  extension: string;
}

export interface AudioDebugInfo {
  mimeType: string;
  sizeKb: string;
  sizeBytes: number;
  durationSeconds: string;
  language: string;
  model: string;
  rawTranscript: string;
  finalTranscript: string;
  voiceDetected: boolean;
  timestamp: string;
}

/**
 * Detects the best audio MIME type supported by the user's browser using MediaRecorder.isTypeSupported.
 * Prioritizes standard formats:
 * 1. audio/webm;codecs=opus
 * 2. audio/webm
 * 3. audio/mp4
 * 4. audio/aac
 * 5. audio/ogg;codecs=opus
 * 6. audio/ogg
 * 7. audio/wav
 */
export function getSupportedAudioMimeType(): AudioMimeTypeInfo {
  if (typeof window === "undefined" || !window.MediaRecorder) {
    return { mimeType: "audio/webm", extension: "webm" };
  }

  const preferredTypes: AudioMimeTypeInfo[] = [
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/mp4", extension: "mp4" },
    { mimeType: "audio/aac", extension: "aac" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
    { mimeType: "audio/ogg", extension: "ogg" },
    { mimeType: "audio/wav", extension: "wav" },
  ];

  for (const candidate of preferredTypes) {
    try {
      if (
        typeof MediaRecorder.isTypeSupported === "function" &&
        MediaRecorder.isTypeSupported(candidate.mimeType)
      ) {
        return candidate;
      }
    } catch {
      // Continue checking next candidate
    }
  }

  return { mimeType: "", extension: "webm" };
}

/**
 * Microphone audio constraints optimized for legal speech dictation.
 * Includes echo cancellation, noise suppression, and auto gain control.
 */
export function getAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  };
}

/**
 * Formats a duration in seconds into MM:SS format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Appends a finalized, validated transcript chunk to the document:
 * - Handles sentence boundaries and paragraphing
 * - Prevents exact duplicate insertions
 */
export function appendTranscriptText(
  existingText: string,
  newChunk: string
): string {
  const cleanNew = newChunk.trim();
  if (!cleanNew) return existingText;
  if (!existingText.trim()) return cleanNew;

  const prev = existingText.trimEnd();

  // If identical, do not re-append
  if (prev.endsWith(cleanNew)) {
    return prev;
  }

  // Check if incoming text starts with newline
  if (cleanNew.startsWith("\n")) {
    return `${prev}\n\n${cleanNew.trimStart()}`;
  }

  // Check boundary punctuation
  const lastChar = prev.slice(-1);
  if (/[\.\?!:]/.test(lastChar)) {
    return `${prev}\n\n${cleanNew}`;
  }

  return `${prev} ${cleanNew}`;
}

/**
 * Intelligent deterministic merge for chunked transcription (backward compatibility):
 */
export function mergeTranscriptChunks(
  existingText: string,
  incomingRawChunk: string,
  mode: "court_draft" | "verbatim" | "translate" = "court_draft"
): string {
  const normalizedIncoming = normalizeLegalTranscript(incomingRawChunk, mode);
  if (!normalizedIncoming) return existingText;
  if (!existingText.trim()) return normalizedIncoming;

  return appendTranscriptText(existingText, normalizedIncoming);
}

/**
 * Calculates word and character statistics for the transcript editor.
 */
export function calculateTranscriptStats(text: string): {
  wordCount: number;
  characterCount: number;
} {
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  return { wordCount: words, characterCount: characters };
}
