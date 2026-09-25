/**
 * Cloudflare Pages native Edge Function for OpenAI Speech-to-Text transcription.
 * Automatically handled by Cloudflare Pages on /api/transcribe without requiring adapters.
 */

interface Env {
  OPENAI_API_KEY: string;
  OPENAI_TRANSCRIPTION_MODEL?: string;
}

export const onRequestGet = async (context: {
  env: Env;
}): Promise<Response> => {
  const apiKey = context.env.OPENAI_API_KEY?.trim();
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "Cloudflare Pages Transcription Function",
      apiKeyConfigured: Boolean(apiKey),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  try {
    const apiKey = context.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key is missing. Please set OPENAI_API_KEY in Cloudflare Pages Settings > Variables and Secrets.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await context.request.formData();
    const audioFile = formData.get("audio");
    const languageParam = formData.get("language") as string | null;

    if (!audioFile || !(audioFile instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "No audio file provided in request." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const model = context.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "whisper-1";

    const openAiFormData = new FormData();

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

    const filename =
      audioFile instanceof File && audioFile.name && audioFile.name.includes(".")
        ? audioFile.name
        : `court_dictation_${Date.now()}.${extension}`;

    openAiFormData.append("file", audioFile, filename);
    openAiFormData.append("model", model);

    openAiFormData.append("response_format", "verbose_json");
    openAiFormData.append("temperature", "0");

    if (languageParam === "en") {
      openAiFormData.append("language", "en");
    } else if (languageParam === "mr") {
      openAiFormData.append("language", "mr");
    } else if (languageParam === "hi") {
      openAiFormData.append("language", "hi");
    }

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
      error?: { message?: string };
    };

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({
          error: data?.error?.message || "Transcription request failed.",
        }),
        {
          status: apiRes.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filter silence using Whisper segment no_speech_prob
    let validSegmentsText = "";
    if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
      const speechSegments = data.segments.filter((seg) => {
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

    // STRICT LANGUAGE FILTER: Allow ONLY English, Marathi, or Hindi
    const ALLOWED_LANGUAGES = new Set(["english", "en", "marathi", "mr", "hindi", "hi"]);
    if (detectedLanguage && !ALLOWED_LANGUAGES.has(detectedLanguage)) {
      return new Response(
        JSON.stringify({ text: "", rejected: true, reason: `Unsupported language: ${detectedLanguage}` }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Hallucination blacklist filter (e.g. "Thanks for watching", YouTube artifacts, prompt repeats)
    const HALLUCINATION_REGEX =
      /thanks?\s+for\s+watching|thank\s+you\s+for\s+watching|please\s+subscribe|like\s+and\s+subscribe|see\s+you\s+in\s+the\s+next\s+video|do\s+not\s+transcribe|\[music\]|\[applause\]|\(music\)|\(applause\)|बघितल्याबद्दल\s+धन्यवाद|पाहिल्याबद्दल\s+धन्यवाद|देखने\s+के\s+लिए\s+धन्यवाद/i;

    if (!rawText || HALLUCINATION_REGEX.test(rawText)) {
      return new Response(
        JSON.stringify({ text: "", rejected: true, reason: "Silence hallucination filtered" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Reject non-target scripts (e.g. Arabic, Cyrillic, Han/Chinese, Hangul, Japanese, Thai, Hebrew, etc.)
    const foreignScriptRegex = /[\p{Script=Arabic}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Hebrew}\p{Script=Greek}]/u;
    if (foreignScriptRegex.test(rawText)) {
      return new Response(
        JSON.stringify({ text: "", rejected: true, reason: "Non-target script detected" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ text: rawText }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal transcription error.";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
