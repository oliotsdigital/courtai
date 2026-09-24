import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file or export OPENAI_API_KEY in your environment, then restart the server.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageParam = formData.get("language") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    // Initialize OpenAI client strictly on the server side
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const model =
      process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "whisper-1";

    // Set up transcription options
    // Supported languages: English ('en'), Marathi ('mr'), Hindi ('hi')
    // If 'auto' or not specified, OpenAI Whisper automatically detects language
    const transcriptionOptions: OpenAI.Audio.Transcriptions.TranscriptionCreateParams = {
      file: audioFile,
      model: model,
      response_format: "json",
      temperature: 0.0,
    };

    if (languageParam && languageParam !== "auto") {
      // Map to ISO-639-1 code
      transcriptionOptions.language = languageParam;
    }

    // Optional prompt to encourage correct legal terminology and capitalization in Whisper
    transcriptionOptions.prompt =
      "Court proceedings dictation. Hon'ble Court, Section, CPC, CrPC, IPC, Applicant, Respondent, Petitioner.";

    const transcription = await openai.audio.transcriptions.create(
      transcriptionOptions
    );

    return NextResponse.json({
      text: transcription.text || "",
    });
  } catch (error: unknown) {
    console.error("[Transcription Error]:", error);

    // Provide safe, user-friendly error messages without raw stack traces
    let errorMessage = "Speech transcription failed. Please try again.";

    if (error instanceof Error) {
      if (
        error.message.includes("Incorrect API key") ||
        error.message.includes("401")
      ) {
        errorMessage =
          "Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local.";
      } else if (
        error.message.includes("quota") ||
        error.message.includes("insufficient_quota") ||
        error.message.includes("429")
      ) {
        errorMessage =
          "OpenAI quota exceeded. Please check your OpenAI account billing/usage limit.";
      } else if (error.message.includes("audio")) {
        errorMessage =
          "The uploaded audio format could not be processed. Please check microphone settings.";
      } else {
        errorMessage = `Transcription request failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
