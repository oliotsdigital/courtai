import React from "react";
import { Landmark, FileText, User } from "lucide-react";

export interface CourtCaseDetails {
  courtName: string;
  caseNumber: string;
  applicant: string;
  respondent: string;
}

export const DEMO_CASE_DETAILS: CourtCaseDetails = {
  courtName: "Demo District Court",
  caseNumber: "AHM/2026/001",
  applicant: "Sample Applicant",
  respondent: "Sample Respondent",
};

export const CaseInfoBar: React.FC<{ caseDetails?: CourtCaseDetails }> = ({
  caseDetails = DEMO_CASE_DETAILS,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-court-700 mb-2 flex items-center gap-1.5">
        <Landmark className="w-3.5 h-3.5" />
        <span>Matter Details (Demo Fallback)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
          <span className="text-xs text-slate-500 block font-medium">Court</span>
          <span className="font-semibold text-slate-800">{caseDetails.courtName}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
          <span className="text-xs text-slate-500 block font-medium">Case Number</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {caseDetails.caseNumber}
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
          <span className="text-xs text-slate-500 block font-medium">Applicant / Petitioner</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {caseDetails.applicant}
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
          <span className="text-xs text-slate-500 block font-medium">Respondent</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {caseDetails.respondent}
          </span>
        </div>
      </div>
    </div>
  );
};
