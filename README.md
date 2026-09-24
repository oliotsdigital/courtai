# Court AI — AI-Powered Court Speech-to-Document (Demo)

A lightweight legal speech-to-text dictation demo application designed for demonstrating real-time-ish legal dictation to judges, registrars, and court staff.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **OpenAI Speech-to-Text (Whisper)**.

---

## 🏛 Features

- **Microphone Dictation:** Uses the browser `MediaRecorder` API with auto-detected supported MIME types (`audio/webm`, `audio/mp4`).
- **Chunked Transcription:** Approximately 5–6s audio chunking cycle to give a live dictation experience without audio buffer bloat.
- **Multilingual Recognition:**
  - Auto Detect (model detects language dynamically)
  - English
  - Marathi (मराठी)
  - Hindi (हिन्दी)
  - Mixed-language court speech support (e.g., *"The Applicant ने application दाखल केली आहे."*)
- **Deterministic Legal Normalization:**
  - Legal terms: `"honourable court"` → `Hon'ble Court`, `"civil procedure code"` → `CPC`, `"criminal procedure code"` → `CrPC`, `Applicant`, `Respondent`, etc.
  - Section numbers: `"section one forty four"` → `Section 144`, `"section three hundred two"` → `Section 302`.
  - Voice punctuation: `"full stop"` → `.`, `"comma"` → `,`, `"next paragraph"` → newline, etc.
- **Live Editable Transcript:** Instant manual correction, word count, character count.
- **Official Court Document Exports:**
  - **Download DOCX:** Formatted Word document generated directly in-browser using `docx` with court headers, matter details, case number, and presiding judge signoff.
  - **Download TXT:** Raw text file download.
  - **Print / Save as PDF:** Customized `@media print` layout that prints only the formal court order (hiding all UI buttons, navigation, and microphone controls).
- **Fallback Quick Test:**
  - `[Load Sample Transcript]` button for guaranteed offline demonstration.
  - One-click `[Copy Demo Script]` test prompt.
- **Zero Heavy Infrastructure:** No database, no separate backend server, no Docker, no external persistence needed.

---

## 🔒 Security & Architecture

```
Browser (Microphone)
       │
       ▼  (Audio Chunks: 5-6s)
Next.js Server Proxy (/api/transcribe)
       │  (OPENAI_API_KEY kept secret on server)
       ▼
OpenAI Speech-to-Text API (Whisper)
       │
       ▼  (JSON Transcript)
Client Normalizer & Live Editor
```

- **Protected API Key:** The OpenAI API key is stored exclusively in `.env.local` and accessed via the server-side Route Handler (`app/api/transcribe/route.ts`). It is **never** exposed to browser JavaScript or client bundles (no `NEXT_PUBLIC_` prefix).
- **Transient Audio:** Audio chunks are converted to memory blobs and deleted immediately upon dispatch; no audio or transcripts are stored on disk or database.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- Modern browser (Chrome, Edge, Firefox, or Safari) with microphone support
  *(Note: Web browsers enforce that microphone access requires `http://localhost` or a secure `https://` origin)*.

### 2. Installation

Clone or enter the project directory:

```bash
cd CDST
npm install
```

### 3. Environment Setup

Create your `.env.local` file from the example:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and provide your OpenAI API key:

```env
OPENAI_API_KEY=sk-...your-openai-api-key...
OPENAI_TRANSCRIPTION_MODEL=whisper-1
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎙 How to Demo to Court Staff

1. Click **Start Dictate** (grant microphone permission when prompted).
2. Read the built-in demo script:
   > *"The Applicant has filed an application under Section one forty four of the CPC. Full stop. Next paragraph. The Respondent is directed to appear before the Court."*
3. Watch the text automatically appear with normalized legal abbreviations (`Section 144`, `CPC`, `Applicant`, `Respondent`) and formatted paragraph breaks.
4. Try speaking Marathi or Hindi (or select from the language dropdown).
5. Click **Download DOCX** or **Print / Save as PDF** to generate the final court order.
6. If testing without a microphone or OpenAI key, use **Load Sample Transcript** for an instant preview.

---

## 📁 Project Structure

```
court-ai-demo/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts        # Server-side OpenAI proxy
│   ├── globals.css             # Tailwind + @media print styles
│   ├── layout.tsx              # Root HTML & metadata
│   └── page.tsx                # Main single-screen experience
├── components/
│   ├── CaseInfoBar.tsx         # Court matter header
│   ├── CourtFooter.tsx         # Legal disclaimer footer
│   ├── CourtHeader.tsx         # App brand & DEMO badge
│   ├── DemoScript.tsx          # Sample script with copy button
│   ├── DocumentPrintView.tsx   # Print-only formal court order
│   ├── LanguageSelector.tsx    # Auto / English / Marathi / Hindi
│   ├── MicrophoneButton.tsx    # Recording states & pulse animation
│   ├── ModeSelector.tsx        # Court Draft / Verbatim
│   ├── StatusIndicator.tsx     # Live status & friendly errors
│   └── TranscriptEditor.tsx    # Editable text area + DOCX/PDF export
├── lib/
│   ├── audio.ts                # MIME detector & overlap merger
│   ├── docxExport.ts           # In-browser Word doc generation
│   └── legalNormalizer.ts      # Deterministic legal normalization
├── .env.local.example
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 📜 Disclaimer
This application is a prototype demonstration of speech recognition technology in legal workflows. It does not replace human court stenographers or judicial verification.
