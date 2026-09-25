import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

/**
 * Robust helper to retrieve environment variables from:
 * 1. process.env (Node.js runtime, local development, and Cloudflare if nodejs_compat_populate_process_env is enabled)
 * 2. Cloudflare Worker context env (Cloudflare Dashboard Secrets / Variables)
 */
function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]?.trim()) {
    return process.env[key]!.trim();
  }

  try {
    const cf = getCloudflareContext();
    if (cf?.env && typeof cf.env === "object") {
      const val = (cf.env as Record<string, unknown>)[key];
      if (typeof val === "string" && val.trim()) {
        return val.trim();
      }
    }
  } catch {
    // Cloudflare context unavailable outside edge/worker requests
  }

  return undefined;
}

/**
 * Health check endpoint for /api/transcribe
 * Allows checking if the endpoint is deployed and if OPENAI_API_KEY is detected.
 */
export async function GET() {
  const apiKey = getEnv("OPENAI_API_KEY");
  return NextResponse.json({
    status: "ok",
    service: "CourtAI Speech-to-Text API",
    apiKeyConfigured: Boolean(apiKey),
    model: getEnv("OPENAI_TRANSCRIPTION_MODEL") || "whisper-1",
  });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getEnv("OPENAI_API_KEY");

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is missing. Please configure OPENAI_API_KEY in the Cloudflare Dashboard (Workers & Pages > courtai > Settings > Variables and Secrets) or in your .env.local file locally.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const languageParam = formData.get("language") as string | null;

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No valid audio file provided in request." },
        { status: 400 }
      );
    }

    const model = getEnv("OPENAI_TRANSCRIPTION_MODEL") || "whisper-1";

    // Prepare standard multipart/form-data for OpenAI Audio Transcription API
    const openAiFormData = new FormData();

    // Map MIME type to correct file extension compatible with OpenAI Whisper
    const mimeType = audioFile.type || "";
    let extension = "webm";
    if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
      extension = "mp4";
    } else if (mimeType.includes("wav")) {
      extension = "wav";
    } else if (mimeType.includes("ogg")) {
      extension = "ogg";
    } else if (mimeType.includes("aac")) {
      extension = "aac";
    } else if (mimeType.includes("webm")) {
      extension = "webm";
    }

    // Ensure a proper filename with extension is provided so Whisper recognizes the audio format
    const filename =
      audioFile instanceof File && audioFile.name && audioFile.name.includes(".")
        ? audioFile.name
        : `court_dictation_${Date.now()}.${extension}`;

    openAiFormData.append("file", audioFile, filename);
    openAiFormData.append("model", model);
    openAiFormData.append("response_format", "verbose_json");
    openAiFormData.append("temperature", "0");

    // Explicit language selection
    // In "combined" mode, DO NOT pass any prompt so Whisper never repeats prompt text on silence!
    if (languageParam === "en") {
      openAiFormData.append("language", "en");
    } else if (languageParam === "mr") {
      openAiFormData.append("language", "mr");
    } else if (languageParam === "hi") {
      openAiFormData.append("language", "hi");
    }

    // Direct native fetch to OpenAI Whisper API - 100% compatible with Cloudflare Workers runtime
    const apiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openAiFormData,
    });

    const data = (await apiRes.json()) as {
      text?: string;
      language?: string;
      segments?: Array<{
        text?: string;
        no_speech_prob?: number;
        avg_logprob?: number;
      }>;
      error?: { message?: string; type?: string; code?: string };
    };

    if (!apiRes.ok) {
      const openAiErrorMessage =
        data?.error?.message ||
        `OpenAI returned error status ${apiRes.status} (${apiRes.statusText})`;
      console.error("[OpenAI Whisper Error]:", openAiErrorMessage);

      let friendlyError = openAiErrorMessage;
      if (apiRes.status === 401) {
        friendlyError =
          "Invalid OpenAI API key. Please verify your OPENAI_API_KEY in Cloudflare Settings > Variables and Secrets.";
      } else if (apiRes.status === 429) {
        friendlyError =
          "OpenAI quota exceeded. Please check your OpenAI account billing and credits.";
      }

      return NextResponse.json(
        { error: friendlyError },
        { status: apiRes.status }
      );
    }

    // Filter silence using Whisper segment no_speech_prob
    let validSegmentsText = "";
    if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
      const speechSegments = data.segments.filter((seg) => {
        // Discard segment if Whisper confidence indicates high silence probability
        if (typeof seg.no_speech_prob === "number" && seg.no_speech_prob > 0.45) {
          return false;
        }
        if (typeof seg.avg_logprob === "number" && seg.avg_logprob < -1.15) {
          return false;
        }
        return true;
      });
      validSegmentsText = speechSegments.map((s) => s.text || "").join(" ").trim();
    } else {
      validSegmentsText = (data.text || "").trim();
    }

    const rawText = validSegmentsText.trim();
    const detectedLanguage = (data.language || "").toLowerCase().trim();

    // Whitelist check: ONLY English, Marathi, or Hindi allowed
    const ALLOWED_LANGUAGES = new Set(["english", "en", "marathi", "mr", "hindi", "hi"]);
    if (detectedLanguage && !ALLOWED_LANGUAGES.has(detectedLanguage)) {
      console.warn(`[Whisper Discard]: Non-target language detected: "${detectedLanguage}".`);
      return NextResponse.json({
        text: "",
        rawText: "",
        model,
        language: detectedLanguage,
        rejected: true,
      });
    }

    // Hallucination blacklist filter (e.g. "Thanks for watching", YouTube artifacts, prompt repeats)
    const HALLUCINATION_REGEX =
      /thanks?\s+for\s+watching|thank\s+you\s+for\s+watching|please\s+subscribe|like\s+and\s+subscribe|see\s+you\s+in\s+the\s+next\s+video|do\s+not\s+transcribe|\[music\]|\[applause\]|\(music\)|\(applause\)|बघितल्याबद्दल\s+धन्यवाद|पाहिल्याबद्दल\s+धन्यवाद|देखने\s+के\s+लिए\s+धन्यवाद/i;

    if (!rawText || HALLUCINATION_REGEX.test(rawText)) {
      return NextResponse.json({
        text: "",
        rawText: "",
        model,
        language: detectedLanguage || "unknown",
        rejected: true,
      });
    }

    // Reject non-target scripts (e.g. Arabic, Cyrillic, Chinese, etc.)
    const foreignScriptRegex =
      /[\p{Script=Arabic}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Hebrew}\p{Script=Greek}]/u;
    if (foreignScriptRegex.test(rawText)) {
      return NextResponse.json({
        text: "",
        rawText: "",
        model,
        language: detectedLanguage || "unknown",
        rejected: true,
      });
    }

    return NextResponse.json({
      text: rawText,
      rawText: rawText,
      model,
      language: detectedLanguage || languageParam || "auto",
    });
  } catch (error: unknown) {
    console.error("[Transcription Route Error]:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal transcription error.";

    return NextResponse.json(
      { error: `Transcription failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

