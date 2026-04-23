import { NextResponse } from "next/server";

export async function GET() {
  // Generate a simple PDF checklist
  const pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 2500 >>
stream
BT
/F1 24 Tf
50 750 Td
(EUDR Compliance Checklist) Tj
ET
BT
/F1 12 Tf
50 720 Td
(Essential Steps to Get EUDR-Ready by December 30, 2026) Tj
ET
BT
/F1 14 Tf
50 680 Td
(For Large & Medium Producers) Tj
ET
BT
/F1 11 Tf
50 650 Td
[(Phase 1: Documentation & Data Collection) -100] TJ
ET
BT
/F1 10 Tf
70 630 Td
[(✓ Gather all plot-level data: GPS coordinates, size, commodity)] -100] TJ
ET
BT
70 615 Td
[(✓ Collect deforestation baseline references (2020 satellite maps)] -100] TJ
ET
BT
70 600 Td
[(✓ Document land acquisition dates and ownership changes)] -100] TJ
ET
BT
70 585 Td
[(✓ Obtain supplier compliance certificates and sustainability claims)] -100] TJ
ET
BT
/F1 11 Tf
50 550 Td
[(Phase 2: System Setup & Integration) -100] TJ
ET
BT
/F1 10 Tf
70 530 Td
[(✓ Set up GPS boundary capture system or manual plot registration)] -100] TJ
ET
BT
70 515 Td
[(✓ Integrate with TRACES NT if applicable to your commodity)] -100] TJ
ET
BT
70 500 Td
[(✓ Configure GS1 EPCIS data exchange protocols)] -100] TJ
ET
BT
70 485 Td
[(✓ Test data accuracy and completeness)] -100] TJ
ET
BT
/F1 11 Tf
50 450 Td
[(Phase 3: Due Diligence Statements (DDS) & Audit Trail) -100] TJ
ET
BT
/F1 10 Tf
70 430 Td
[(✓ Generate DDS documents for all commodities)] -100] TJ
ET
BT
70 415 Td
[(✓ Create audit trails showing traceability end-to-end)] -100] TJ
ET
BT
70 400 Td
[(✓ Document risk assessment and mitigation measures)] -100] TJ
ET
BT
70 385 Td
[(✓ Prepare for third-party audits and verification)] -100] TJ
ET
BT
/F1 11 Tf
50 350 Td
[(Phase 4: Training & Compliance Management) -100] TJ
ET
BT
/F1 10 Tf
70 330 Td
[(✓ Train farmers/suppliers on data submission)] -100] TJ
ET
BT
70 315 Td
[(✓ Set up regular compliance monitoring and updates)] -100] TJ
ET
BT
70 300 Td
[(✓ Create documentation archive for regulatory inspections)] -100] TJ
ET
BT
70 285 Td
[(✓ Establish contingency plans for supply chain disruptions)] -100] TJ
ET
BT
/F1 12 Tf
50 245 Td
[(Key Deadlines to Remember) -100] TJ
ET
BT
/F1 10 Tf
50 225 Td
[(Dec 30, 2026: Large & Medium producers begin compliance)] -100] TJ
ET
BT
50 210 Td
[(Jun 30, 2027: Micro & Small producers must be compliant)] -100] TJ
ET
BT
/F1 11 Tf
50 170 Td
[(Next Step: Schedule a 15-minute call with our team)] -100] TJ
ET
BT
/F1 10 Tf
50 150 Td
[(We'll assess your current readiness and create a customized roadmap.)] -100] TJ
ET
BT
50 130 Td
[(Visit: www.tracebud.com)] -100] TJ
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000293 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2843
%%EOF
`;

  return new NextResponse(pdfContent, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="EUDR-Compliance-Checklist.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
