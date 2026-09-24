/**
 * Audio recording utilities and transcript merging helpers.
 */

import { normalizeLegalTranscript } from "./legalNormalizer";

export interface AudioMimeTypeInfo {
  mimeType: string;
  extension: string;
}

/**
 * Detects the best audio MIME type supported by the user's browser.
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
    if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
      return candidate;
    }
  }

  return { mimeType: "", extension: "webm" };
}

/**
 * Intelligent deterministic merge for chunked transcription:
 * - Detects overlapping trailing words of existing text with leading words of incoming chunk
 * - Trims duplicate overlap
 * - Normalizes according to current mode
 * - Handles sentence and paragraph transitions cleanly
 */
export function mergeTranscriptChunks(
  existingText: string,
  incomingRawChunk: string,
  mode: "court_draft" | "verbatim" | "translate" = "court_draft"
): string {
  const normalizedIncoming = normalizeLegalTranscript(incomingRawChunk, mode);
  if (!normalizedIncoming) return existingText;
  if (!existingText.trim()) return normalizedIncoming;

  const prevClean = existingText.trimEnd();

  // Tokenize into words for overlap detection (ignore punctuation for matching)
  const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/gi, "");

  const existingWords = prevClean.split(/\s+/).filter(Boolean);
  const incomingWords = normalizedIncoming.split(/\s+/).filter(Boolean);

  // Look for 1 to 6 overlapping words at boundary
  const maxOverlap = Math.min(6, existingWords.length, incomingWords.length);
  let overlapFound = 0;

  for (let len = maxOverlap; len >= 1; len--) {
    const existingEnd = existingWords.slice(-len).map(cleanWord);
    const incomingStart = incomingWords.slice(0, len).map(cleanWord);

    const matches = existingEnd.every((w, i) => w.length > 0 && w === incomingStart[i]);
    if (matches) {
      overlapFound = len;
      break;
    }
  }

  let finalIncoming = normalizedIncoming;
  if (overlapFound > 0) {
    // Drop the first `overlapFound` words from incoming
    const slicedTokens = incomingWords.slice(overlapFound);
    if (slicedTokens.length === 0) {
      return prevClean; // Whole chunk was a duplicate
    }
    // Reconstruct remainder
    finalIncoming = slicedTokens.join(" ");
  }

  // Check if incoming starts with newline/paragraph
  if (finalIncoming.startsWith("\n")) {
    return `${prevClean}${finalIncoming}`;
  }

  // Check punctuation on boundary
  const lastChar = prevClean.slice(-1);
  const needsSpace = !/[\s\n]/.test(lastChar);

  // Capitalize if previous ended in sentence terminator
  if (/[\.\?!]/.test(lastChar)) {
    finalIncoming =
      finalIncoming.charAt(0).toUpperCase() + finalIncoming.slice(1);
  }

  return `${prevClean}${needsSpace ? " " : ""}${finalIncoming}`;
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
