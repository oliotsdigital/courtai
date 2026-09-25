/**
 * Deterministic legal normalization layer for Court AI.
 * Specialized for English, Marathi (मराठी), and mixed bilingual legal dictation.
 * Handles legal term replacements, section number normalization,
 * voice punctuation commands in English & Marathi, sentence capitalization, and paragraphing.
 */

// Number words to digits mapping helper (English)
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

// Common Marathi spoken number phrases in legal contexts (including Criminal & Sessions trials)
const MARATHI_LEGAL_SECTIONS: Record<string, string> = {
  "एकशे चव्वेचाळीस": "144",
  "एकशे चव्वेचाळीस अ": "144A",
  "एकशे त्रेचाळीस": "143",
  "एकशे अडतीस": "138",
  "तीनशे दोन": "302",
  "तीनशे चार": "304",
  "तीनशे चार ब": "304B",
  "तीनशे सत्त्याण्णव": "397",
  "तीनशे सत्याण्णव": "397",
  "तीनशे चौऱ्याण्णव": "394",
  "तीनशे चौर्याण्णव": "394",
  "चारशे वीस": "420",
  "चारशे ब्याऐंशी": "482",
  "चारशे ब्यांशी": "482",
  "चारशे अठ्ठ्याण्णव अ": "498A",
  "तीनशे चौऱ्यात्तर": "376",
  "चौतीस": "34",
  "पंचवीस": "25",
  "सत्तावीस": "27",
  "साठ": "60",
  "एकशे शेचाळीस": "146",
  "एकशे सेहेचाळीस": "146",
  "एकशे एकसष्ठ": "161",
  "एकशे एकसष्ट": "161",
  "एकशे त्र्याहत्तर": "173",
  "शंभर": "100",
  "चव्वेचाळीस": "44",
  "नऊ": "9",
  "बारा": "12",
  "तेरा": "13",
  "एकशे सत्तावीस": "127",
  "एकशे पंचवीस": "125",
};

// Common Hindi spoken number phrases in legal contexts
const HINDI_LEGAL_SECTIONS: Record<string, string> = {
  "एक सौ चौवालीस": "144",
  "एक सौ चौवालीस ए": "144A",
  "एक सौ तैंतालीस": "143",
  "एक सौ अड़तीस": "138",
  "तीन सौ दो": "302",
  "तीन सौ चार": "304",
  "तीन सौ चार बी": "304B",
  "तीन सौ सत्तानवे": "397",
  "तीन सौ चौरानवे": "394",
  "चार सौ बीस": "420",
  "चार सौ बयासी": "482",
  "चार सौ अठानवे ए": "498A",
  "तीन सौ छिहत्तर": "376",
  "चौंतीस": "34",
  "पच्चीस": "25",
  "सत्ताईस": "27",
  "साठ": "60",
  "एक सौ छियालीस": "146",
  "एक सौ इकसठ": "161",
  "एक सौ तिहत्तर": "173",
  "सौ": "100",
  "चवालीस": "44",
  "नौ": "9",
  "बारह": "12",
  "तेरह": "13",
  "एक सौ सत्ताईस": "127",
  "एक सौ पच्चीस": "125",
};

/**
 * Converts Devanagari numerals (०-९) to Latin digits (0-9)
 */
export function devanagariToLatinDigits(str: string): string {
  const devanagariDigits = "०१२३४५६७८९";
  return str.replace(/[०-९]/g, (char) => {
    const index = devanagariDigits.indexOf(char);
    return index !== -1 ? String(index) : char;
  });
}

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

  // Handle English patterns
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
  let total = 0;
  let current = 0;
  let hasNumber = false;
  const digitsBuffer: string[] = [];

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
 * Normalizes section number expressions in English, Marathi, and Hindi:
 * e.g., "section one forty four" -> "Section 144"
 * e.g., "कलम एकशे चव्वेचाळीस" -> "Section 144 (कलम 144)"
 * e.g., "धारा एक सौ चौवालीस" -> "Section 144 (धारा 144)"
 */
export function normalizeSectionNumbers(text: string): string {
  let result = text;

  // 1. Convert any Devanagari numerals after 'कलम', 'धारा', or 'section'
  result = result.replace(/(कलम\s+)([०-९]+)/gi, (_, prefix, digits) => {
    const latin = devanagariToLatinDigits(digits);
    return `Section ${latin} (कलम ${latin})`;
  });

  result = result.replace(/(धारा\s+)([०-९]+)/gi, (_, prefix, digits) => {
    const latin = devanagariToLatinDigits(digits);
    return `Section ${latin} (धारा ${latin})`;
  });

  // 2. Marathi spoken section names
  for (const [marathiPhrase, sectionNum] of Object.entries(MARATHI_LEGAL_SECTIONS)) {
    const reg = new RegExp(`कलम\\s+${marathiPhrase}`, "gi");
    result = result.replace(reg, `Section ${sectionNum} (कलम ${sectionNum})`);
  }

  // 3. Hindi spoken section names
  for (const [hindiPhrase, sectionNum] of Object.entries(HINDI_LEGAL_SECTIONS)) {
    const reg = new RegExp(`धारा\\s+${hindiPhrase}`, "gi");
    result = result.replace(reg, `Section ${sectionNum} (धारा ${sectionNum})`);
  }

  // 4. Hindi & Marathi digits after धारा or कलम
  result = result.replace(/\bधारा\s+(\d+[a-zA-Z]?)/gi, (_, num) => {
    return `Section ${num} (धारा ${num})`;
  });

  result = result.replace(/\bकलम\s+(\d+[a-zA-Z]?)/gi, (_, num) => {
    return `Section ${num} (कलम ${num})`;
  });

  // 5. English "section <words or numbers>"
  const sectionRegex = /\bsection\s+([a-zA-Z0-9\s\-]+?)(?=[,\.\?!;\n]|\s+of\b|\s+cpc\b|\s+crpc\b|\s+ipc\b|\s+read\b|\s+and\b|\s+अन्वये\b|\s+के\s+तहत\b|$)/gi;

  result = result.replace(sectionRegex, (match, words) => {
    const trimmed = words.trim();
    if (/^\d+[a-zA-Z]?$/.test(trimmed)) {
      return `Section ${trimmed.toUpperCase()}`;
    }

    const parsed = wordsToNumber(trimmed);
    if (parsed) {
      return `Section ${parsed}`;
    }
    return `Section ${trimmed}`;
  });

  return result;
}

/**
 * Replaces voice punctuation instructions in English, Marathi, and Hindi with symbols:
 * English: "full stop", "comma", "colon", "semicolon", "next paragraph", "new line"
 * Marathi: "पूर्णविराम", "पूर्ण विराम", "स्वल्पविराम", "नवीन परिच्छेद", "पुढील परिच्छेद", "नवीन ओळ"
 * Hindi: "पूर्ण विराम", "पूर्णविराम", "अल्पविराम", "अगला पैराग्राफ", "नया पैराग्राफ", "अगली पंक्ति"
 */
export function normalizeVoicePunctuation(text: string): string {
  let result = text;

  // New paragraphs and lines (English, Marathi & Hindi)
  result = result.replace(
    /\b(?:next\s+paragraph|new\s+paragraph)\b|(?:नवीन\s+परिच्छेद|पुढील\s+परिच्छेद|नवीन\s+पॅरा|अगला\s+पैराग्राफ|नया\s+पैराग्राफ|नवीन\s+पैराग्राफ)/gi,
    "\n\n"
  );
  result = result.replace(
    /\b(?:new\s+line|next\s+line)\b|(?:नवीन\s+ओळ|पुढील\s+ओळ|अगली\s+पंक्ति|नई\s+लाइन)/gi,
    "\n"
  );

  // Full stop / पूर्णविराम
  result = result.replace(
    /\b(?:full\s+stop|period)\b|(?:पूर्ण\s*विराम|पूर्णविराम)/gi,
    "."
  );

  // Comma / स्वल्पविराम / अल्पविराम
  result = result.replace(/\bcomma\b|(?:स्वल्प\s*विराम|स्वल्पविराम|अल्प\s*विराम|अल्पविराम)/gi, ",");

  // Colon / विसर्ग
  result = result.replace(/\bcolon\b|(?:विसर्ग)/gi, ":");

  // Semicolon
  result = result.replace(/\bsemi[\s\-]?colon\b|(?:अर्धविराम)/gi, ";");

  // Question mark / प्रश्नचिन्ह
  result = result.replace(/\bquestion\s+mark\b|(?:प्रश्न\s*चिन्ह|प्रश्नचिन्ह|प्रश्नवाचक\s*चिन्ह)/gi, "?");

  return result;
}

/**
 * Deterministic legal terminology mappings for English and Marathi.
 */
const LEGAL_TERMS: Array<[RegExp, string]> = [
  // Courts & Honors (English)
  [/\bhonou?rable\s+court\b/gi, "Hon'ble Court"],
  [/\bhonou?rable\s+judge\b/gi, "Hon'ble Judge"],
  [/\bhonou?rable\s+justice\b/gi, "Hon'ble Justice"],
  [/\bhonou?rable\s+mr\.?\s+justice\b/gi, "Hon'ble Mr. Justice"],
  [/\bhonou?rable\s+ms\.?\s+justice\b/gi, "Hon'ble Ms. Justice"],
  [/\bsupreme\s+court\b/gi, "Supreme Court"],
  [/\bhigh\s+court\b/gi, "High Court"],
  [/\bdistrict\s+court\b/gi, "District Court"],
  [/\bsessions\s+court\b/gi, "Sessions Court"],

  // Courts & Honors (Marathi & Hindi)
  [/(?:मा\.\s*न्यायालय|माननीय\s+न्यायालय|मा\.\s*कोर्ट|माननीय\s+कोर्ट)/gi, "Hon'ble Court (मा. न्यायालय)"],
  [/(?:मा\.\s*उच्च\s+न्यायालय|माननीय\s+उच्च\s+न्यायालय)/gi, "Hon'ble High Court (मा. उच्च न्यायालय)"],
  [/(?:मा\.\s*सर्वोच्च\s+न्यायालय|माननीय\s+सर्वोच्च\s+न्यायालय)/gi, "Hon'ble Supreme Court (मा. सर्वोच्च न्यायालय)"],
  [/(?:मा\.\s*जिल्हा\s+न्यायालय|माननीय\s+जिल्हा\s+न्यायालय)/gi, "District Court (मा. जिल्हा न्यायालय)"],

  // Statutes & Codes (English)
  [/\b(?:the\s+)?code\s+of\s+civil\s+procedure\b/gi, "CPC"],
  [/\bcivil\s+procedure\s+code\b/gi, "CPC"],
  [/\b(?:the\s+)?code\s+of\s+criminal\s+procedure\b/gi, "CrPC"],
  [/\bcriminal\s+procedure\s+code\b/gi, "CrPC"],
  [/\b(?:the\s+)?indian\s+penal\s+code\b/gi, "IPC"],
  [/\b(?:the\s+)?indian\s+evidence\s+act\b/gi, "Indian Evidence Act"],
  [/\bevidence\s+act\b/gi, "Evidence Act"],
  [/\b(?:the\s+)?arms\s+act\b/gi, "Arms Act"],
  [/\bnegotiable\s+instruments\s+act\b/gi, "Negotiable Instruments Act"],
  [/\bni\s+act\b/gi, "NI Act"],
  [/\bpolice\s+act\b/gi, "Police Act"],
  [/\bbharatiya\s+nyaya\s+sanhita\b/gi, "BNS"],
  [/\bbharatiya\s+nagarik\s+suraksha\s+sanhita\b/gi, "BNSS"],
  [/\bbharatiya\s+sakshya\s+adhiniyam\b/gi, "BSA"],

  // Statutes & Codes (Marathi & Hindi)
  [/दिवाणी\s+प्रक्रिया\s+संहिता/gi, "CPC (दिवाणी प्रक्रिया संहिता)"],
  [/सिविल\s+प्रक्रिया\s+संहिता/gi, "CPC (सिविल प्रक्रिया संहिता)"],
  [/फौजदारी\s+प्रक्रिया\s+संहिता/gi, "CrPC (फौजदारी प्रक्रिया संहिता)"],
  [/दंड\s+प्रक्रिया\s+संहिता/gi, "CrPC (दंड प्रक्रिया संहिता)"],
  [/भारतीय\s+दंड\s+संहिता/gi, "IPC (भारतीय दंड संहिता)"],
  [/भारतीय\s+पुरावा\s+कायदा/gi, "Indian Evidence Act (भारतीय पुरावा कायदा)"],
  [/भारतीय\s+शस्त्र\s+कायदा/gi, "Arms Act (भारतीय शस्त्र कायदा)"],
  [/निगोशिएबल\s+इन्स्ट्रुमेंट\s+ॲक्ट/gi, "NI Act (निगोशिएबल इन्स्ट्रुमेंट ॲक्ट)"],
  [/पोलीस\s+कायदा/gi, "Police Act (पोलीस कायदा)"],

  // Parties & Roles (English)
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
  [/\bcomplainant\b/gi, "Complainant"],
  [/\bprosecution\s+witness\b/gi, "Prosecution Witness"],
  [/\bjudicial\s+magistrate\s+first\s+class\b/gi, "Judicial Magistrate First Class (JMFC)"],
  [/\bexecutive\s+magistrate\b/gi, "Executive Magistrate"],
  [/\bcasualty\s+medical\s+officer\b/gi, "Casualty Medical Officer (CMO)"],
  [/\binvestigating\s+officer\b/gi, "Investigating Officer (IO)"],
  [/\bstenographer\b/gi, "Stenographer"],
  [/\bcourt\s+master\b/gi, "Court Master"],

  // Parties & Roles (Marathi & Hindi)
  [/अर्जदार(?=[\s\.,]|$)/gi, "Applicant (अर्जदार)"],
  [/आवेदक(?=[\s\.,]|$)/gi, "Applicant (आवेदक)"],
  [/(?:सामनावाला|गैरअर्जदार|प्रतिवादी|अनावेदक)(?=[\s\.,]|$)/gi, "Respondent (प्रतिवादी)"],
  [/याचिकाकर्ता(?=[\s\.,]|$)/gi, "Petitioner (याचिकाकर्ता)"],
  [/अपीलकर्ता(?=[\s\.,]|$)/gi, "Appellant (अपीलकर्ता)"],
  [/फिर्यादी(?=[\s\.,]|$)/gi, "Complainant (फिर्यादी)"],
  [/मयत(?=[\s\.,]|$)/gi, "Deceased (मयत)"],
  [/शिरस्तेदार(?=[\s\.,]|$)/gi, "Court Master (शिरस्तेदार)"],
  [/तपासी\s+अधिकारी(?=[\s\.,]|$)/gi, "Investigating Officer (तपासी अधिकारी)"],
  [/कार्यकारी\s+दंडाधिकारी(?=[\s\.,]|$)/gi, "Executive Magistrate (कार्यकारी दंडाधिकारी)"],
  [/प्रथम\s+वर्ग\s+न्यायदंडाधिकारी(?=[\s\.,]|$)/gi, "JMFC (प्रथम वर्ग न्यायदंडाधिकारी)"],

  // Legal Counsel & Phrasing (English & Marathi)
  [/\blearned\s+additional\s+public\s+prosecutor\b/gi, "Learned APP"],
  [/\blearned\s+app\b/gi, "Learned APP"],
  [/\badditional\s+public\s+prosecutor\b/gi, "Additional Public Prosecutor"],
  [/\bpublic\s+prosecutor\b/gi, "Public Prosecutor"],
  [/\blearned\s+defense\s+counsel\b/gi, "Learned Defense Counsel"],
  [/\bdefense\s+counsel\b/gi, "Defense Counsel"],
  [/\blearned\s+counsel\b/gi, "Learned Counsel"],
  [/\blearned\s+advocate\b/gi, "Learned Advocate"],
  [/(?:सरकारी\s+वकील)/gi, "Public Prosecutor (सरकारी वकील)"],
  [/(?:अतिरिक्त\s+सरकारी\s+वकील)/gi, "Learned APP (अतिरिक्त सरकारी वकील)"],
  [/(?:बचाव\s+पक्षाचे\s+वकील)/gi, "Defense Counsel (बचाव पक्षाचे वकील)"],
  [/(?:विद्वान\s+वकील|विद्वान\s+अधिवक्ता)/gi, "Learned Advocate"],

  // Courtroom Trial & Evidentiary Procedure
  [/\bexamination[\s\-]in[\s\-]chief\b/gi, "Examination-in-Chief"],
  [/\bcross[\s\-]examination\b/gi, "Cross-Examination"],
  [/\bre[\s\-]examination\b/gi, "Re-examination"],
  [/सरतपासणी(?=[\s\.,\-]|$)/gi, "Examination-in-Chief (सरतपासणी)"],
  [/उलटतपासणी(?=[\s\.,\-]|$)/gi, "Cross-Examination (उलटतपासणी)"],
  [/फेरतपासणी(?=[\s\.,\-]|$)/gi, "Re-examination (फेरतपासणी)"],

  [/\bobjection\s+overruled\b/gi, "Objection Overruled"],
  [/\bobjection\s+sustained\b/gi, "Objection Sustained"],
  [/आक्षेप\s+फेटाळण्यात\s+आला/gi, "Objection Overruled (आक्षेप फेटाळण्यात आला)"],

  [/\bjudicial\s+custody\b/gi, "Judicial Custody"],
  [/\bpolice\s+custody\s+remand\b/gi, "Police Custody Remand (PCR)"],
  [/\bpolice\s+custody\b/gi, "Police Custody"],
  [/न्यायालयीन\s+कोठडी/gi, "Judicial Custody (न्यायालयीन कोठडी)"],
  [/पोलीस\s+कोठडी/gi, "Police Custody (पोलीस कोठडी)"],

  [/\bbail\s+bond\b/gi, "Bail Bond"],
  [/जामीन\s+मुचलका/gi, "Bail Bond (जामीन मुचलका)"],
  [/\bbailable\s+warrant\b/gi, "Bailable Warrant"],
  [/जामीनपात्र\s+वॉरंट/gi, "Bailable Warrant (जामीनपात्र वॉरंट)"],
  [/\bnon[\s\-]bailable\s+warrant\b/gi, "Non-Bailable Warrant"],
  [/अजामीनपात्र\s+वॉरंट/gi, "Non-Bailable Warrant (अजामीनपात्र वॉरंट)"],

  [/\bspot\s+panchnama\b/gi, "Spot Panchnama"],
  [/घटनास्थळ\s+पंचनामा/gi, "Spot Panchnama (घटनास्थळ पंचनामा)"],
  [/\bseizure\s+panchnama\b/gi, "Seizure Panchnama"],
  [/जप्ती\s+पंचनामा/gi, "Seizure Panchnama (जप्ती पंचनामा)"],
  [/\brecovery\s+panchnama\b/gi, "Recovery Panchnama"],
  [/\bdisclosure\s+statement\b/gi, "Disclosure Statement"],
  [/प्रकटीकरण\s+जबाब/gi, "Disclosure Statement (प्रकटीकरण जबाब)"],

  [/\btest\s+identification\s+parade\b/gi, "Test Identification Parade (TIP)"],
  [/\btip\s+memo\b/gi, "TIP Memo"],
  [/ओळख\s+परेड/gi, "TIP (ओळख परेड)"],

  [/\bchargesheet\b|\bcharge[\s\-]sheet\b/gi, "Charge-Sheet"],
  [/दोषारोपपत्र/gi, "Charge-Sheet (दोषारोपपत्र)"],

  [/\bfirst\s+information\s+report\b/gi, "FIR"],
  [/(?:प्रथम\s+खबरी\s+अहवाल|एफआयआर|एफ\.आय\.आर\.)/gi, "FIR"],
  [/\bforensic\s+science\s+laboratory\b/gi, "FSL"],
  [/न्यायवैद्यक\s+विज्ञान\s+प्रयोगशाळा/gi, "FSL (न्यायवैद्यक विज्ञान प्रयोगशाळा)"],
  [/\bballistics?\s+report\b/gi, "Ballistics Report"],
  [/बॅलेस्टिक्स\s+अहवाल|बॅलेस्टिक्स\s+रिपोर्ट/gi, "Ballistics Report (बॅलेस्टिक्स अहवाल)"],
  [/\bpost[\s\-]mortem\s+report\b/gi, "Post-Mortem Report"],
  [/शवविच्छेदन\s+अहवाल/gi, "Post-Mortem Report (शवविच्छेदन अहवाल)"],

  [/\bmalkhana\b/gi, "Malkhana"],
  [/मालखाना/gi, "Malkhana (मालखाना)"],
  [/\bchain\s+of\s+custody\b/gi, "Chain of Custody"],
  [/ताब्याची\s+साखळी/gi, "Chain of Custody (ताब्याची साखळी)"],

  [/\bsessions\s+case\s+number\b|\bsessions\s+case\s+no\.?\b/gi, "Sessions Case No."],
  [/सत्र\s+खटला\s+क्रमांक/gi, "Sessions Case No. (सत्र खटला क्रमांक)"],

  [/\binterim\s+application\b/gi, "IA"],
  [/(?:अंतरिम\s+अर्ज|आय\.ए\.)/gi, "IA (Interim Application)"],
  [/\bspecial\s+leave\s+petition\b/gi, "SLP"],
  [/\bwrit\s+petition\b/gi, "Writ Petition"],
  [/(?:रिट\s+याचिका)/gi, "Writ Petition"],
  [/\bstatus\s+quo\b/gi, "status quo"],
  [/(?:यथास्थिती)/gi, "Status Quo (यथास्थिती)"],
  [/\bprima\s+facie\b/gi, "prima facie"],
  [/(?:प्रथमदर्शनी)/gi, "Prima Facie (प्रथमदर्शनी)"],
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
 * - Collapses duplicate periods or commas
 * - Ensures space after punctuation
 * - Capitalizes sentence beginnings after periods and newlines
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

  // Sentence capitalization after . ! ? or start of line (English text while preserving Devanagari)
  result = result.replace(/(^|[\.\?!]\s+|\n+)([a-z])/g, (_, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });

  return result.trim();
}

/**
 * Main legal normalizer entry point.
 * @param text The input transcription text
 * @param mode "court_draft" | "verbatim" | "translate"
 */
export function normalizeLegalTranscript(
  text: string,
  mode: "court_draft" | "verbatim" | "translate" = "court_draft"
): string {
  if (!text) return "";

  if (mode === "verbatim" || mode === "translate") {
    // In verbatim/translate mode, keep minimal processing
    return text.replace(/[ \t]+/g, " ").trim();
  }

  // 1. Voice punctuation commands in English & Marathi ("full stop" / "पूर्णविराम" -> ".")
  let processed = normalizeVoicePunctuation(text);

  // 2. Section number normalization ("section one forty four" / "कलम १४४" -> "Section 144")
  processed = normalizeSectionNumbers(processed);

  // 3. Legal terms ("honourable court" / "मा. न्यायालय" -> "Hon'ble Court", "cpc" -> "CPC")
  processed = normalizeLegalTerms(processed);

  // 4. Clean spacing, punctuation attachments, and sentence capitalization
  processed = formatTypography(processed);

  return processed;
}
