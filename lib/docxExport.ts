/**
 * Browser-side DOCX export generator using the docx package.
 * Produces a professionally styled court record document.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";

export interface CourtCaseMeta {
  courtName: string;
  caseNumber: string;
  applicant: string;
  respondent: string;
  dateStr?: string;
  presidingOfficer?: string;
}

export async function exportToDocx(
  transcript: string,
  meta: CourtCaseMeta
): Promise<Blob> {
  const paragraphs = transcript.split("\n\n").map((paraText) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 360, before: 120, after: 120 }, // 1.5 line spacing
      children: [
        new TextRun({
          text: paraText.replace(/\n/g, " "),
          font: "Times New Roman",
          size: 24, // 12pt
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Court Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `IN THE COURT OF ${meta.courtName.toUpperCase()}`,
                bold: true,
                font: "Times New Roman",
                size: 28, // 14pt
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: `CASE NO. ${meta.caseNumber}`,
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),

          // Parties
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `${meta.applicant} `,
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "... Applicant / Petitioner",
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: "VERSUS",
                bold: true,
                font: "Times New Roman",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: `${meta.respondent} `,
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
              new TextRun({
                text: "... Respondent",
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),

          // Section Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 240 },
            children: [
              new TextRun({
                text: "RECORD OF PROCEEDINGS / DRAFT ORDER",
                bold: true,
                underline: {},
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),

          // Transcript Content
          ...(paragraphs.length > 0
            ? paragraphs
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "[No transcript recorded]",
                      italics: true,
                      font: "Times New Roman",
                      size: 24,
                    }),
                  ],
                }),
              ]),

          // Date & Presiding Officer Signoff
          new Paragraph({
            spacing: { before: 480 },
            children: [
              new TextRun({
                text: `Date of Dictation: ${meta.dateStr || new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
                font: "Times New Roman",
                size: 22,
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: meta.presidingOfficer || "Presiding Judge",
                bold: true,
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: meta.courtName,
                font: "Times New Roman",
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
