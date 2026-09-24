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

    // Ensure a proper filename with extension is provided so Whisper recognizes the audio format
    const filename =
      audioFile instanceof File && audioFile.name
        ? audioFile.name
        : `audio_${Date.now()}.${audioFile.type?.includes("mp4") ? "mp4" : "webm"}`;

    openAiFormData.append("file", audioFile, filename);
    openAiFormData.append("model", model);
    openAiFormData.append("response_format", "json");
    openAiFormData.append("temperature", "0");

    if (languageParam === "en") {
      openAiFormData.append("language", "en");
      openAiFormData.append(
        "prompt",
        "Court proceedings dictation in English. Hon'ble Court, Section, CPC, CrPC, IPC, Applicant, Respondent, Petitioner."
      );
    } else if (languageParam === "mr") {
      openAiFormData.append("language", "mr");
      openAiFormData.append(
        "prompt",
        "न्यायालयीन कामकाज डिक्टेशन मराठीत. मा. न्यायालय, अर्जदार, प्रतिवादी, आदेश, कलम, दिवाणी प्रक्रिया संहिता, फौजदारी प्रक्रिया संहिता."
      );
    } else {
      // "mixed" or "auto" - allow Whisper to dynamically transcribe both English and Marathi
      openAiFormData.append(
        "prompt",
        "Court legal proceedings dictation in English and Marathi (मराठी). The Applicant ने application दाखल केली under Section 144 of the CPC. मा. न्यायालय, Hon'ble Court, अर्जदार, प्रतिवादी, आदेश, FIR, IPC, CrPC."
      );
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

    return NextResponse.json({
      text: data.text || "",
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

