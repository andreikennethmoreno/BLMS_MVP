import React from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ContractField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  value?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: ContractField[];
  commissionPercentage: number;
  createdAt: string;
  createdBy: string;
}

interface ContractPDFGeneratorProps {
  template: ContractTemplate;
  ownerName?: string;
  ownerEmail?: string;
}

export const generateContractPDF = async (
  template: ContractTemplate,
  ownerName?: string,
  ownerEmail?: string
): Promise<Blob> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard letter size
  const { width, height } = page.getSize();

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 20;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, fontSize: number, fontType = font, maxWidth = width - 2 * margin) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = fontType.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && line) {
        page.drawText(line, { x, y: currentY, size: fontSize, font: fontType, color: rgb(0, 0, 0) });
        line = word;
        currentY -= lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font: fontType, color: rgb(0, 0, 0) });
      currentY -= lineHeight;
    }

    return currentY;
  };

  // Header
  yPosition = addText('PROPERTY RENTAL CONTRACT', margin, yPosition, 18, boldFont);
  yPosition -= 10;
  yPosition = addText(template.name, margin, yPosition, 14, boldFont);
  yPosition -= 30;

  // Contract details
  yPosition = addText('Contract Details:', margin, yPosition, 12, boldFont);
  yPosition -= 5;
  yPosition = addText(`Template: ${template.name}`, margin + 20, yPosition, 10);
  yPosition = addText(`Description: ${template.description}`, margin + 20, yPosition, 10);
  yPosition = addText(`Commission Rate: ${template.commissionPercentage}%`, margin + 20, yPosition, 10);
  yPosition = addText(`Created: ${new Date(template.createdAt).toLocaleDateString()}`, margin + 20, yPosition, 10);
  yPosition -= 20;

  // Owner information (if provided)
  if (ownerName || ownerEmail) {
    yPosition = addText('Property Owner Information:', margin, yPosition, 12, boldFont);
    yPosition -= 5;
    if (ownerName) {
      yPosition = addText(`Name: ${ownerName}`, margin + 20, yPosition, 10);
    }
    if (ownerEmail) {
      yPosition = addText(`Email: ${ownerEmail}`, margin + 20, yPosition, 10);
    }
    yPosition -= 20;
  }

  // Contract fields
  yPosition = addText('Contract Terms and Fields:', margin, yPosition, 12, boldFont);
  yPosition -= 10;

  template.fields.forEach((field) => {
    yPosition = addText(`${field.label}${field.required ? ' *' : ''}:`, margin + 20, yPosition, 10, boldFont);
    yPosition -= 5;
    yPosition = addText(`Type: ${field.type}`, margin + 40, yPosition, 9);
    if (field.value) {
      yPosition = addText(`Value: ${field.value}`, margin + 40, yPosition, 9);
    }
    yPosition -= 15;
  });

  // Terms and conditions
  yPosition -= 10;
  yPosition = addText('Terms and Conditions:', margin, yPosition, 12, boldFont);
  yPosition -= 10;

  const terms = [
    `1. The property owner agrees to list their property on the platform with a ${template.commissionPercentage}% commission rate.`,
    '2. The platform will handle all booking management, payment processing, and customer service.',
    '3. The owner is responsible for maintaining the property in good condition and ensuring availability as listed.',
    '4. Commission will be deducted from each booking payment before transfer to the owner.',
    '5. Either party may terminate this agreement with 30 days written notice.',
    '6. This agreement is governed by the laws of the jurisdiction where the property is located.'
  ];

  terms.forEach((term) => {
    yPosition = addText(term, margin + 20, yPosition, 9);
    yPosition -= 10;
  });

  // Signature section
  yPosition -= 30;
  yPosition = addText('Signatures:', margin, yPosition, 12, boldFont);
  yPosition -= 20;

  // Property Owner signature line
  yPosition = addText('Property Owner:', margin, yPosition, 10, boldFont);
  yPosition -= 30;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width / 2 - 20, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition = addText('Signature', margin, yPosition - 15, 8);
  yPosition = addText('Date: _______________', margin, yPosition - 5, 8);

  // Platform representative signature line
  yPosition += 50;
  yPosition = addText('Platform Representative:', width / 2 + 20, yPosition, 10, boldFont);
  yPosition -= 30;
  page.drawLine({
    start: { x: width / 2 + 20, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition = addText('Signature', width / 2 + 20, yPosition - 15, 8);
  yPosition = addText('Date: _______________', width / 2 + 20, yPosition - 5, 8);

  // Footer
  const footerY = 50;
  page.drawText(
    'This contract is legally binding. Please read all terms carefully before signing.',
    margin,
    footerY,
    { size: 8, font, color: rgb(0.5, 0.5, 0.5) }
  );

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

const ContractPDFGenerator: React.FC<ContractPDFGeneratorProps> = ({ template, ownerName, ownerEmail }) => {
  // This component is just for type exports, the actual PDF generation is handled by the function above
  return null;
};

export default ContractPDFGenerator;