import React, { useState } from "react";
import { Sparkles, Copy, Check, BookOpen, Layers } from "lucide-react";

export interface DemoScriptOption {
  id: string;
  label: string;
  badge: string;
  category: "trial" | "order" | "quick";
  script: string;
  description: string;
}

export const DEMO_SCRIPTS: DemoScriptOption[] = [
  {
    id: "sessions_case_en",
    label: "Sessions Trial (English)",
    badge: "Case No. 412/2021",
    category: "trial",
    script:
      "Court Master: Sessions Case Number 412 of 2021. State versus Ramesh Kumar alias Billu. Offence under Sections 302, 397, and 34 of the Indian Penal Code, 1860, read with Sections 25 and 27 of the Arms Act. Accused Ramesh Kumar produced from judicial custody. Accused Suresh is present on bail. Learned Additional Public Prosecutor Shri Anand Verma present for the State. Learned Advocate Shri R.K. Deshmukh present for both accused persons.",
    description:
      "Realistic courtroom trial opening: sessions case numbering, IPC sections, Arms Act, judicial custody, and appearances.",
  },
  {
    id: "sessions_case_mr",
    label: "सत्र खटला साक्ष (मराठी)",
    badge: "सत्र खटला ४१२/२०२१",
    category: "trial",
    script:
      "सत्र खटला क्रमांक ४१२/२०२१. महाराष्ट्र शासन विरुद्ध रमेश कुमार ऊर्फ बिल्लू. भारतीय दंड संहिता कलम ३०२, ३९७, आणि ३४, सहवाचन भारतीय शस्त्र कायदा कलम २५ आणि २७ अंतर्गत दाखल गुन्हा. आरोपी क्रमांक एक रमेश कुमार याला न्यायालयीन कोठडीतून हजर करण्यात आले आहे. आरोपी क्रमांक दोन सुरेश हा जामिनावर हजर आहे. सरकार पक्षातर्फे अतिरिक्त सरकारी वकील श्री. आनंद वर्मा हजर. दोन्ही आरोपींतर्फे बचाव पक्षाचे वकील श्री. आर. के. देशमुख हजर.",
    description:
      "Authentic Marathi sessions case opening: कलम ३०२, ३९७, ३४ भा.दं.सं., शस्त्र कायदा, आणि न्यायालयीन कोठडी.",
  },
  {
    id: "order_adjournment_en",
    label: "Judge Order & Adjournment (English)",
    badge: "Judicial Order",
    category: "order",
    script:
      "PW-3 Vikram Singh examined, cross-examined, and discharged. PW-4 Sub-Inspector Mahendra Patil examined, cross-examined, and discharged. Exhibits P-18, P-19, and P-22 duly marked. Prosecution gives up listed witnesses numbers 5 and 6. Issue bailable warrant in the sum of five thousand rupees against Dr. S.K. Roy, CMO, Government Medical College, to secure his presence for marking the Post-Mortem Report on the next date of hearing. Summons be also issued to the Investigating Officer Inspector Deshmukh. Accused Ramesh Kumar remanded to judicial custody till the next date. Accused Suresh's bail bond extended on same terms. Matter is adjourned for further prosecution evidence to 12th October 2021.",
    description:
      "Real-world judge's dictation to the Stenographer: marking exhibits, bailable warrants, CMO, bail extensions, and adjournment.",
  },
  {
    id: "order_adjournment_mr",
    label: "न्यायालयीन आदेश व तहकूब (मराठी)",
    badge: "न्यायालयीन आदेश",
    category: "order",
    script:
      "पीडब्लू-३ विक्रम सिंग यांची सरतपासणी आणि उलटतपासणी पूर्ण झाली, त्यांना मुक्त करण्यात आले. पीडब्लू-४ उपनिरीक्षक महेंद्र पाटील यांची सरतपासणी आणि उलटतपासणी पूर्ण झाली, त्यांना मुक्त करण्यात आले. निशानी पी-१८, पी-१९ आणि पी-२२ रीतसर चिन्हांकित करण्यात आले. सरकारी पक्षाने यादीतील साक्षीदार क्रमांक ५ आणि ६ यांना वगळले आहे. पुढील तारखेला शवविच्छेदन अहवाल दाखल करण्यासाठी शासकीय वैद्यकीय महाविद्यालयाचे सीएमओ डॉ. एस. के. रॉय यांच्याविरुद्ध पाच हजार रुपयांचे जामीनपात्र वॉरंट जारी करण्यात यावे. आरोपी रमेश कुमार याला पुढील तारखेपर्यंत न्यायालयीन कोठडीत पाठवण्यात येत आहे. पुढील सरकारी पुराव्यासाठी खटल्याचे कामकाज १२ ऑक्टोबर २०२१ पर्यंत तहकूब करण्यात येत आहे.",
    description:
      "Marathi judge's formal dictation: सरतपासणी, उलटतपासणी, निशानी पी-१८, जामीनपात्र वॉरंट, आणि कामकाज तहकूब.",
  },
  {
    id: "cross_exam_en",
    label: "Cross-Examination & Section 161 (English)",
    badge: "Section 161 CrPC",
    category: "trial",
    script:
      "Defense Counsel: You stated before the Court today that Accused Number 1 fired from a point-blank range of less than three feet. Did you state this fact to the police in your statement recorded under Section 161 of the Code of Criminal Procedure? Your Honour, I crave leave to confront the witness with his previous statement recorded under Section 161 CrPC, marked as Document D-2 for identification. Judge: Leave granted. Hand over the certified copy of the Section 161 statement to the witness.",
    description:
      "Evidentiary cross-examination: confrontation with Section 161 CrPC police statement and Document D-2 marking.",
  },
  {
    id: "quick_english",
    label: "Standard Dictation (Sec 144)",
    badge: "Quick Demo",
    category: "quick",
    script:
      "The Applicant has filed an application under Section one forty four of the CPC. Full stop. Next paragraph. The Respondent is directed to appear before the Court.",
    description:
      "Tests spoken number normalization ('Section one forty four' -> Section 144) and voice punctuation.",
  },
  {
    id: "quick_marathi",
    label: "मराठी नमुना (कलम १४४)",
    badge: "मराठी Quick",
    category: "quick",
    script:
      "अर्जदाराने कलम एकशे चव्वेचाळीस अन्वये अर्ज दाखल केला आहे. पूर्णविराम. पुढील परिच्छेद. प्रतिवादीला मा. न्यायालयासमोर उपस्थित राहण्याचे आदेश देण्यात येत आहेत.",
    description: "Tests Marathi spoken number 'कलम एकशे चव्वेचाळीस' -> Section 144, and 'पूर्णविराम'.",
  },
  {
    id: "quick_hindi",
    label: "हिंदी नमुना (धारा १४४)",
    badge: "हिंदी Quick",
    category: "quick",
    script:
      "आवेदक ने धारा एक सौ चौवालीस के अंतर्गत आवेदन प्रस्तुत किया है। पूर्णविराम। अगला पैराग्राफ। प्रतिवादी को न्यायालय के समक्ष उपस्थित होने का निर्देश दिया जाता है।",
    description: "Tests Hindi legal speech recognition, 'धारा एक सौ चौवालीस' -> Section 144, and 'पूर्णविराम'.",
  },
];

export const DemoScript: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "trial" | "order" | "quick">("all");
  const [selectedId, setSelectedId] = useState<string>("sessions_case_en");
  const [copied, setCopied] = useState(false);

  const filteredScripts = selectedCategory === "all"
    ? DEMO_SCRIPTS
    : DEMO_SCRIPTS.filter((s) => s.category === selectedCategory);

  const current = DEMO_SCRIPTS.find((s) => s.id === selectedId) || DEMO_SCRIPTS[0];

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(current.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-court-800">
          <Sparkles className="w-4 h-4 text-court-600 flex-shrink-0" />
          <span>Court Trial &amp; Deposition Demo Scripts / न्यायालयीन चाचणी संवाद</span>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedCategory === "all"
                ? "bg-court-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Scripts
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("trial")}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedCategory === "trial"
                ? "bg-court-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Trial Depositions
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("order")}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedCategory === "order"
                ? "bg-court-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Judge Orders
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("quick")}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedCategory === "quick"
                ? "bg-court-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quick Tests
          </button>
        </div>
      </div>

      {/* Script Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {filteredScripts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center gap-1.5 ${
              selectedId === item.id
                ? "bg-court-700 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BookOpen className="w-3 h-3 opacity-80" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Script Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 text-slate-800 font-serif text-sm sm:text-base leading-relaxed relative shadow-2xs">
        <div className="flex items-center justify-between mb-2 not-italic">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-court-700 bg-court-50 px-2 py-0.5 rounded border border-court-200">
              {current.badge}
            </span>
            <span className="text-xs text-slate-500 font-sans">
              (Read aloud clearly after clicking Start Dictation)
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="text-xs font-semibold text-court-700 hover:text-court-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors flex items-center gap-1 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        <p className="italic text-slate-900 font-medium">
          &ldquo;{current.script}&rdquo;
        </p>

        <p className="text-xs text-slate-500 font-sans mt-2.5 pt-2 border-t border-slate-100">
          {current.description}
        </p>
      </div>

      {/* Educational Courtroom Highlights */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Sessions Case Vocabulary:</span>
          Identifies Section 302, 397 IPC, Arms Act 25 &amp; 27, and judicial custody accurately.
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Procedural Depositions:</span>
          Handles Section 161 CrPC, Spot/Seizure Panchnama, and Exhibits (P-18, P-19, P-22).
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800 block mb-0.5">Bilingual Indian Legal Terms:</span>
          Preserves Marathi and English legal nomenclature without distortion or hallucination.
        </div>
      </div>
    </div>
  );
};
