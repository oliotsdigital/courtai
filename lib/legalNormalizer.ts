/**
 * Deterministic legal normalization layer for Court AI.
 * Handles legal term replacements, section number normalization,
 * voice punctuation commands, sentence capitalization, and paragraphing.
 */

// Number words to digits mapping helper
const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * Converts natural language spoken number phrases like "one forty four" or "three hundred two"
 * into digits ("144", "302").
 */
export function wordsToNumber(wordsStr: string): string | null {
  const clean = wordsStr.toLowerCase().replace(/[-]/g, " ").trim();
  const tokens = clean.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return null;

  // Direct digits check
  if (/^\d+[a-z]?$/i.test(tokens.join(""))) {
    return tokens.join("").toUpperCase();
  }

  // Handle patterns:
  // 1. "one forty four" -> 1 44 -> 144
  // 2. "three hundred two" / "three hundred and two" -> 300 + 2 -> 302
  // 3. "four twenty" -> 4 20 -> 420
  // 4. "one thirty eight" -> 1 38 -> 138
  // 5. "thirty four" -> 34

  // Check for hundred pattern
  let total = 0;
  let current = 0;
  let hasNumber = false;
  let isDigitConcat = false;
  const digitsBuffer: string[] = [];

  // Check if it's a sequence of single digits or hundreds
  const allSingleOrTens = tokens.every(
    (t) =>
      t in SMALL_NUMBERS ||
      t in TENS ||
      t === "hundred" ||
      t === "and" ||
      /^[a-z]$/i.test(t)
  );

  if (!allSingleOrTens) {
    return null;
  }

  // Special common pattern in legal speech: "one forty four" -> 144
  // If first is 1-9 and second is 20-99 (with optional third 1-9)
  if (
    tokens.length >= 2 &&
    tokens[0] in SMALL_NUMBERS &&
    SMALL_NUMBERS[tokens[0]] < 10 &&
    tokens[1] in TENS
  ) {
    const hundredsDigit = SMALL_NUMBERS[tokens[0]];
    const tensVal = TENS[tokens[1]];
    const onesVal = tokens[2] && tokens[2] in SMALL_NUMBERS ? SMALL_NUMBERS[tokens[2]] : 0;
    const suffix = tokens[3] && /^[a-z]$/i.test(tokens[3]) ? tokens[3].toUpperCase() : "";
    return `${hundredsDigit}${tensVal + onesVal}${suffix}`;
  }

  // "four twenty" -> 420
  if (
    tokens.length === 2 &&
    tokens[0] in SMALL_NUMBERS &&
    SMALL_NUMBERS[tokens[0]] < 10 &&
    tokens[1] in TENS
  ) {
    return `${SMALL_NUMBERS[tokens[0]]}${TENS[tokens[1]]}`;
  }

  // Standard hundred parser: "three hundred and two", "four hundred twenty"
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "and") continue;

    if (t === "hundred") {
      current = (current === 0 ? 1 : current) * 100;
      total += current;
      current = 0;
      hasNumber = true;
    } else if (t in TENS) {
      current += TENS[t];
      hasNumber = true;
    } else if (t in SMALL_NUMBERS) {
      current += SMALL_NUMBERS[t];
      hasNumber = true;
    } else if (/^[a-z]$/i.test(t)) {
      // Suffix like 120 B, 438 A
      digitsBuffer.push(t.toUpperCase());
    }
  }

  total += current;
  if (hasNumber && total > 0) {
    return `${total}${digitsBuffer.join("")}`;
  }

  return null;
}

/**
 * Normalizes section number expressions:
 * e.g., "section one forty four" -> "Section 144"
 * e.g., "section 144" -> "Section 144"
 */
export function normalizeSectionNumbers(text: string): string {
  // Regex to match "section <words or numbers>"
  const sectionRegex = /\bsection\s+([a-zA-Z0-9\s\-]+?)(?=[,\.\?!;\n]|\s+of\b|\s+cpc\b|\s+crpc\b|\s+ipc\b|\s+read\b|\s+and\b|$)/gi;

  return text.replace(sectionRegex, (match, words) => {
    const trimmed = words.trim();
    // If it's already digits
    if (/^\d+[a-zA-Z]?$/.test(trimmed)) {
      return `Section ${trimmed.toUpperCase()}`;
    }

    const parsed = wordsToNumber(trimmed);
    if (parsed) {
      return `Section ${parsed}`;
    }
    return `Section ${trimmed}`;
  });
}

/**
 * Replaces voice punctuation instructions with symbols:
 * "full stop" / "period" -> "."
 * "comma" -> ","
 * "colon" -> ":"
 * "semicolon" -> ";"
 * "question mark" -> "?"
 * "next paragraph" / "new paragraph" -> "\n\n"
 * "new line" -> "\n"
 */
export function normalizeVoicePunctuation(text: string): string {
  let result = text;

  // New paragraphs and lines first
  result = result.replace(/\b(?:next\s+paragraph|new\s+paragraph)\b/gi, "\n\n");
  result = result.replace(/\b(?:new\s+line|next\s+line)\b/gi, "\n");

  // Punctuation marks
  result = result.replace(/\b(?:full\s+stop|period)\b/gi, ".");
  result = result.replace(/\bcomma\b/gi, ",");
  result = result.replace(/\bcolon\b/gi, ":");
  result = result.replace(/\bsemi[\s\-]?colon\b/gi, ";");
  result = result.replace(/\bquestion\s+mark\b/gi, "?");

  return result;
}

/**
 * Deterministic legal terminology mappings.
 * Note: conservative replacement to avoid altering general English outside court context.
 */
const LEGAL_TERMS: Array<[RegExp, string]> = [
  // Courts & Honors
  [/\bhonou?rable\s+court\b/gi, "Hon'ble Court"],
  [/\bhonou?rable\s+judge\b/gi, "Hon'ble Judge"],
  [/\bhonou?rable\s+justice\b/gi, "Hon'ble Justice"],
  [/\bhonou?rable\s+mr\.?\s+justice\b/gi, "Hon'ble Mr. Justice"],
  [/\bhonou?rable\s+ms\.?\s+justice\b/gi, "Hon'ble Ms. Justice"],
  [/\bsupreme\s+court\b/gi, "Supreme Court"],
  [/\bhigh\s+court\b/gi, "High Court"],
  [/\bdistrict\s+court\b/gi, "District Court"],
  [/\bsessions\s+court\b/gi, "Sessions Court"],

  // Statutes & Codes
  [/\b(?:the\s+)?code\s+of\s+civil\s+procedure\b/gi, "CPC"],
  [/\bcivil\s+procedure\s+code\b/gi, "CPC"],
  [/\b(?:the\s+)?code\s+of\s+criminal\s+procedure\b/gi, "CrPC"],
  [/\bcriminal\s+procedure\s+code\b/gi, "CrPC"],
  [/\b(?:the\s+)?indian\s+penal\s+code\b/gi, "IPC"],
  [/\bbharatiya\s+nyaya\s+sanhita\b/gi, "BNS"],
  [/\bbharatiya\s+nagarik\s+suraksha\s+sanhita\b/gi, "BNSS"],
  [/\bbharatiya\s+sakshya\s+adhiniyam\b/gi, "BSA"],

  // Parties & Roles
  [/\bapplicant\b/gi, "Applicant"],
  [/\bapplicants\b/gi, "Applicants"],
  [/\brespondent\b/gi, "Respondent"],
  [/\brespondents\b/gi, "Respondents"],
  [/\bpetitioner\b/gi, "Petitioner"],
  [/\bpetitioners\b/gi, "Petitioners"],
  [/\bappellant\b/gi, "Appellant"],
  [/\bappellants\b/gi, "Appellants"],
  [/\bplaintiff\b/gi, "Plaintiff"],
  [/\bdefendant\b/gi, "Defendant"],

  // Legal phrasing
  [/\blearned\s+counsel\b/gi, "Learned Counsel"],
  [/\blearned\s+advocate\b/gi, "Learned Advocate"],
  [/\blearned\s+senior\s+counsel\b/gi, "Learned Senior Counsel"],
  [/\blearned\s+public\s+prosecutor\b/gi, "Learned Public Prosecutor"],
  [/\bfirst\s+information\s+report\b/gi, "FIR"],
  [/\binterim\s+application\b/gi, "IA"],
  [/\bspecial\s+leave\s+petition\b/gi, "SLP"],
  [/\bwrit\s+petition\b/gi, "Writ Petition"],
  [/\bstatus\s+quo\b/gi, "status quo"],
  [/\bprima\s+facie\b/gi, "prima facie"],
];

export function normalizeLegalTerms(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LEGAL_TERMS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Cleans up typography spacing and sentence casing:
 * - Removes whitespace before punctuation (. , ; : ? !)
 * - Ensures space after punctuation unless followed by newline/end
 * - Capitalizes sentence beginnings after periods, question marks, and newlines
 */
export function formatTypography(text: string): string {
  let result = text;

  // Remove spaces before punctuation
  result = result.replace(/\s+([,\.:;?!])/g, "$1");

  // Collapse duplicate periods or dots
  result = result.replace(/(?:[ \t]*\.)+/g, ".");
  result = result.replace(/(?:[ \t]*,)+/g, ",");

  // Ensure single space after punctuation (except if followed by newline, digit, or another punctuation)
  result = result.replace(/([,\.:;?!])(?=[^\s\n\d"'\)\]])/g, "$1 ");

  // Normalize excessive spaces within lines (preserve deliberate \n)
  result = result
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");

  // Normalize excessive blank lines (max 2 consecutive newlines)
  result = result.replace(/\n{3,}/g, "\n\n");

  // Sentence capitalization after . ! ? or start of line
  // Works with English text while preserving Unicode/Devanagari scripts
  result = result.replace(/(^|[\.\?!]\s+|\n+)([a-z])/g, (_, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });

  return result.trim();
}

/**
 * Main legal normalizer entry point.
 * @param text The input transcription text
 * @param mode "court_draft" | "verbatim"
 */
export function normalizeLegalTranscript(
  text: string,
  mode: "court_draft" | "verbatim" | "translate" = "court_draft"
): string {
  if (!text) return "";

  if (mode === "verbatim" || mode === "translate") {
    // In verbatim/translate mode, keep minimal processing: clean stray multiple spaces and basic sentence casing
    return text.replace(/[ \t]+/g, " ").trim();
  }

  // 1. Voice punctuation commands ("full stop" -> ".", "next paragraph" -> "\n\n")
  let processed = normalizeVoicePunctuation(text);

  // 2. Section number normalization ("section one forty four" -> "Section 144")
  processed = normalizeSectionNumbers(processed);

  // 3. Legal terms ("honourable court" -> "Hon'ble Court", "cpc" -> "CPC")
  processed = normalizeLegalTerms(processed);

  // 4. Clean spacing, punctuation attachments, and sentence capitalization
  processed = formatTypography(processed);

  return processed;
}
