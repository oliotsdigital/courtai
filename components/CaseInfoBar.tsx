import React from "react";
import { Landmark, FileText, User } from "lucide-react";

export interface CourtCaseDetails {
  courtName: string;
  courtNameMr?: string;
  caseNumber: string;
  applicant: string;
  applicantMr?: string;
  respondent: string;
  respondentMr?: string;
}

export const DEMO_CASE_DETAILS: CourtCaseDetails = {
  courtName: "Demo District Court",
  courtNameMr: "जिल्हा व सत्र न्यायालय",
  caseNumber: "AHM/2026/001",
  applicant: "Sample Applicant (अर्जदार)",
  respondent: "Sample Respondent (प्रतिवादी)",
};

export const CaseInfoBar: React.FC<{ caseDetails?: CourtCaseDetails }> = ({
  caseDetails = DEMO_CASE_DETAILS,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-court-800 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-court-700" />
          <span>Matter Details / प्रकरणाचा तपशील</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          Case Record
        </span>
      </div>

      {/* 2-column on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 block font-medium">Court / न्यायालय</span>
          <span className="font-semibold text-slate-800 truncate" title={caseDetails.courtName}>
            {caseDetails.courtName}
          </span>
        </div>
        <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 block font-medium">Case No. / प्रकरण क्र.</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
            <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{caseDetails.caseNumber}</span>
          </span>
        </div>
        <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 block font-medium">Applicant / अर्जदार</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate" title={caseDetails.applicant}>
            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{caseDetails.applicant}</span>
          </span>
        </div>
        <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 block font-medium">Respondent / प्रतिवादी</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate" title={caseDetails.respondent}>
            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{caseDetails.respondent}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
