import React from "react";
import { CourtCaseDetails } from "./CaseInfoBar";

interface DocumentPrintViewProps {
  transcript: string;
  caseDetails: CourtCaseDetails;
}

export const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({
  transcript,
  caseDetails,
}) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-only">
      <div className="court-doc-header">
        <h1 className="court-doc-title">
          IN THE COURT OF {caseDetails.courtName.toUpperCase()}
        </h1>
        <p className="court-doc-case">CASE NO. {caseDetails.caseNumber}</p>
      </div>

      <div className="court-doc-parties">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6pt" }}>
          <span><strong>{caseDetails.applicant}</strong></span>
          <span>... Applicant / Petitioner</span>
        </div>
        <div style={{ textAlign: "center", margin: "10pt 0", fontWeight: "bold" }}>
          VERSUS
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span><strong>{caseDetails.respondent}</strong></span>
          <span>... Respondent</span>
        </div>
      </div>

      <div className="court-doc-section-heading">
        ORDER / RECORD OF PROCEEDINGS
      </div>

      <div className="court-doc-body font-serif">
        {transcript || "[No transcript content recorded]"}
      </div>

      <div className="court-doc-footer" style={{ marginTop: "48pt", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ fontStyle: "italic", fontSize: "11pt" }}>
            Date of Dictation: {currentDate}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: "bold", fontSize: "12pt" }}>
            (Presiding Officer)
          </p>
          <p style={{ fontSize: "11pt" }}>
            District & Sessions Judge
          </p>
          <p style={{ fontSize: "10pt", color: "#444" }}>
            {caseDetails.courtName}
          </p>
        </div>
      </div>
    </div>
  );
};
