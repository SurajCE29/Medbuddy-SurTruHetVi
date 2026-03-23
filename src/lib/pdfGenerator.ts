import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalysisResult {
  diagnosis: string;
  medicines: string[];
  frequency: string[];
  side_effects: string[];
  disease_explanation: string;
  follow_up: string;
  risk_level: string;
  reminders: { medicine: string; times: string[] }[];
}

interface ReportData {
  patientAge: string;
  patientGender: string;
  language: string;
  fileName: string;
  result: AnalysisResult;
  remindersEnabled: boolean;
}

export const generateMedicalReport = (data: ReportData) => {
  const { patientAge, patientGender, language, fileName, result, remindersEnabled } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 30;
  const marginY = 40;
  let currentY = marginY;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginY) {
      doc.addPage();
      currentY = marginY;
      return true;
    }
    return false;
  };

  const addDivider = () => {
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 10;
  };

  // --- HEADER SECTION ---
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.text('AetherMed AI', marginX, currentY);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Medical Intelligence', marginX, currentY + 7);

  doc.setFontSize(16);
  doc.setTextColor(59, 130, 246); // Primary Blue
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH ANALYSIS REPORT', pageWidth - marginX, currentY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - marginX, currentY + 7, { align: 'right' });
  
  currentY += 20;
  addDivider();
  currentY += 10;

  // --- PATIENT DETAILS ---
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', marginX, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    body: [
      ['Age:', patientAge],
      ['Gender:', patientGender],
      ['Language:', language],
      ['Report ID:', `AM-${Math.floor(Math.random() * 1000000)}`]
    ],
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 40 },
      1: { cellWidth: 100 }
    },
    margin: { left: marginX }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 20;

  // --- UPLOADED DOCUMENTS ---
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SOURCE DOCUMENTS', marginX, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`• ${fileName || 'Medical Document'}`, marginX + 5, currentY);
  
  currentY += 20;
  addDivider();

  // --- DIAGNOSIS SUMMARY ---
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('DIAGNOSIS SUMMARY', marginX, currentY);
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  
  const diagnosisLines = doc.splitTextToSize(`• ${result.diagnosis}`, pageWidth - (marginX * 2) - 10);
  
  // Background for diagnosis
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, currentY - 5, pageWidth - (marginX * 2), (diagnosisLines.length * 7) + 10, 'F');
  
  doc.text(diagnosisLines, marginX + 5, currentY + 5);
  currentY += (diagnosisLines.length * 7) + 25;
  addDivider();

  // --- DISEASE EXPLANATION ---
  const explanationTitleHeight = 15;
  const explanationText = result.disease_explanation;
  const explanationLines = doc.splitTextToSize(explanationText, pageWidth - (marginX * 2));
  const explanationTotalHeight = (explanationLines.length * 6) + explanationTitleHeight + 20;

  checkPageBreak(Math.min(explanationTotalHeight, 100)); // Check at least some space
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CLINICAL EXPLANATION', marginX, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  // Handle long text wrapping and page breaks manually if needed, 
  // but doc.text with array handles wrapping. For page breaks within text:
  explanationLines.forEach((line: string) => {
    if (checkPageBreak(10)) {
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, marginX, currentY);
    currentY += 7; // Line height 1.4 approx
  });
  
  currentY += 15;
  addDivider();

  // --- PRESCRIBED MEDICINES TABLE ---
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PRESCRIBED MEDICATIONS', marginX, currentY);
  
  currentY += 10;
  const medicineData = result.medicines.map((med, i) => [
    med, 
    'As analyzed', 
    result.frequency[i] || 'As prescribed',
    'Follow instructions'
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Medicine Name', 'Dosage', 'Frequency', 'Notes']],
    body: medicineData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 8,
      overflow: 'linebreak',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - 2 * marginX) * 0.25 },
      1: { cellWidth: (pageWidth - 2 * marginX) * 0.20 },
      2: { cellWidth: (pageWidth - 2 * marginX) * 0.35 },
      3: { cellWidth: (pageWidth - 2 * marginX) * 0.20 }
    },
    margin: { left: marginX, right: marginX },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 20;
  addDivider();

  // --- SIDE EFFECTS ---
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('POTENTIAL SIDE EFFECTS', marginX, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  result.side_effects.forEach((effect) => {
    const effectLines = doc.splitTextToSize(`• ${effect}`, pageWidth - (marginX * 2) - 5);
    if (checkPageBreak(effectLines.length * 7)) {
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(effectLines, marginX + 5, currentY);
    currentY += (effectLines.length * 7) + 3;
  });
  
  currentY += 15;
  addDivider();

  // --- FOLLOW-UP RECOMMENDATIONS ---
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('FOLLOW-UP & RECOMMENDATIONS', marginX, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  const followUpLines = doc.splitTextToSize(result.follow_up, pageWidth - (marginX * 2));
  followUpLines.forEach((line: string) => {
    if (checkPageBreak(10)) {
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, marginX, currentY);
    currentY += 7;
  });

  // --- FOOTER / DISCLAIMER ---
  const disclaimer = "DISCLAIMER: This report is generated by AetherMed AI using advanced machine learning models. It is intended for informational purposes only and DOES NOT constitute professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - (marginX * 2));
  const disclaimerHeight = disclaimerLines.length * 5;
  
  const footerY = pageHeight - marginY - disclaimerHeight;
  
  // If we are already past the footer start, add a new page
  if (currentY > footerY - 10) {
    doc.addPage();
  }
  
  const finalFooterY = pageHeight - marginY - disclaimerHeight;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, finalFooterY - 5, pageWidth - marginX, finalFooterY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text(disclaimerLines, pageWidth / 2, finalFooterY + 5, { align: 'center', lineHeightFactor: 1.2 });

  doc.save(`AetherMed_Report_${new Date().getTime()}.pdf`);
};
