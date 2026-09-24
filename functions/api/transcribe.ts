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
      openAiFormData.append(
        "prompt",
        "Court legal proceedings dictation in English and Marathi (मराठी). The Applicant ने application दाखल केली under Section 144 of the CPC. मा. न्यायालय, Hon'ble Court, अर्जदार, प्रतिवादी, आदेश, FIR, IPC, CrPC."
      );
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

    return new Response(
      JSON.stringify({ text: data.text || "" }),
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
