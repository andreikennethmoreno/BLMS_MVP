import { useState, useCallback } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

interface UsePDFSignatureReturn {
  isProcessing: boolean;
  applySignatureToPDF: (
    pdfUrl: string,
    signatureDataUrl: string,
    position: SignaturePosition,
    signerName: string
  ) => Promise<Blob>;
}

export const usePDFSignature = (): UsePDFSignatureReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const applySignatureToPDF = useCallback(async (
    pdfUrl: string,
    signatureDataUrl: string,
    position: SignaturePosition,
    signerName: string
  ): Promise<Blob> => {
    setIsProcessing(true);

    try {
      // Fetch the original PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF document');
      }
      const pdfBytes = await response.arrayBuffer();

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      if (position.page > pages.length) {
        throw new Error('Invalid page number');
      }
      
      const page = pages[position.page - 1];

      // Convert signature data URL to PNG bytes
      const signatureResponse = await fetch(signatureDataUrl);
      const signatureImageBytes = await signatureResponse.arrayBuffer();
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      // Get page dimensions
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate signature position (PDF coordinates are from bottom-left)
      const signatureX = position.x;
      const signatureY = pageHeight - position.y - position.height;

      // Ensure signature fits within page bounds
      const adjustedWidth = Math.min(position.width, pageWidth - signatureX);
      const adjustedHeight = Math.min(position.height, Math.max(signatureY, 0));

      if (adjustedWidth <= 0 || adjustedHeight <= 0) {
        throw new Error('Signature position is outside page bounds');
      }

      // Draw the signature on the PDF
      page.drawImage(signatureImage, {
        x: signatureX,
        y: Math.max(signatureY, 0),
        width: adjustedWidth,
        height: adjustedHeight,
      });

      // Add signature metadata
      const now = new Date();
      const metadataY = Math.max(signatureY - 15, 10);
      
      page.drawText(`Signed by: ${signerName}`, {
        x: signatureX,
        y: metadataY,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(`Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, {
        x: signatureX,
        y: Math.max(metadataY - 10, 5),
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error applying signature to PDF:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    applySignatureToPDF
  };
};