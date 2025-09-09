// Here are the main issues and fixes for your PDF preview:

// 1. CORS Issues - Most common problem
// When loading PDFs from external URLs, CORS policies often block the preview
// but downloads work because they don't require cross-origin access

// 2. PDF.js Worker Configuration Issue
// The current worker setup might not work reliably

// 3. Error Handling - Need better error reporting

// Here's the corrected PDFPreviewModal with fixes:

import React, { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  X,
  PenTool,
  Save,
  AlertCircle,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { PDFDocument, rgb } from "pdf-lib";

// Fix 1: Better PDF.js worker configuration
// Try multiple worker sources for better compatibility
const workerSources = [
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
];

// Set the first available worker source
pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0];

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentTitle: string;
  documentId: string;
  onSignatureComplete?: (signedPdfBlob: Blob) => void;
  allowSigning?: boolean;
}

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  documentTitle,
  documentId,
  onSignatureComplete,
  allowSigning = false,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [signaturePosition, setSignaturePosition] =
    useState<SignaturePosition | null>(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setError("");
    },
    []
  );

  // Fix 2: Better error handling with specific error messages
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error);
    setIsLoading(false);

    // Provide specific error messages based on error type
    if (
      error.message.includes("CORS") ||
      error.message.includes("cross-origin")
    ) {
      setError(
        "CORS Error: Cannot preview this PDF due to cross-origin restrictions. You can still download it."
      );
    } else if (
      error.message.includes("fetch") ||
      error.message.includes("network")
    ) {
      setError(
        "Network Error: Cannot load PDF. Please check the URL or try downloading instead."
      );
    } else if (
      error.message.includes("Invalid PDF") ||
      error.message.includes("corrupted")
    ) {
      setError(
        "Invalid PDF: The file appears to be corrupted or not a valid PDF."
      );
    } else if (
      error.message.includes("worker") ||
      error.message.includes("PDF.js")
    ) {
      setError(
        "PDF.js Error: There was an issue with the PDF viewer. You can still download the PDF."
      );
    } else {
      setError(
        `Preview Error: ${error.message}. You can still download the PDF.`
      );
    }
  }, []);

  // Fix 3: Add options to handle CORS and other issues
  const documentOptions = {
    // Add CORS handling options
    httpHeaders: {},
    withCredentials: false,
    // Handle different URL types
    url: pdfUrl,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingSignature) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setSignaturePosition({
      x: x / scale,
      y: y / scale,
      page: currentPage,
      width: 200,
      height: 60,
    });

    setIsPlacingSignature(false);
    setShowSignatureModal(true);
  };

  const handleSignatureSave = () => {
    if (signatureCanvasRef.current) {
      const dataUrl = signatureCanvasRef.current.toDataURL();
      setSignatureDataUrl(dataUrl);
      setShowSignatureModal(false);
    }
  };

  const handleSignatureClear = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const handleApplySignature = async () => {
    if (!signatureDataUrl || !signaturePosition || !onSignatureComplete) return;

    setIsProcessing(true);

    try {
      let pdfBytes: ArrayBuffer;

      // Fix 4: Better handling of different URL types
      if (pdfUrl.startsWith("blob:") || pdfUrl.startsWith("data:")) {
        const response = await fetch(pdfUrl);
        pdfBytes = await response.arrayBuffer();
      } else {
        // For external URLs, try with CORS mode first, then no-cors
        try {
          const response = await fetch(pdfUrl, { mode: "cors" });
          pdfBytes = await response.arrayBuffer();
        } catch (corsError) {
          // If CORS fails, try no-cors mode
          const response = await fetch(pdfUrl, { mode: "no-cors" });
          pdfBytes = await response.arrayBuffer();
        }
      }

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[signaturePosition.page - 1];

      const signatureResponse = await fetch(signatureDataUrl);
      const signatureImageBytes = await signatureResponse.arrayBuffer();
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      const { height: pageHeight } = page.getSize();

      const signatureX = signaturePosition.x;
      const signatureY =
        pageHeight - signaturePosition.y - signaturePosition.height;

      page.drawImage(signatureImage, {
        x: signatureX,
        y: signatureY,
        width: signaturePosition.width,
        height: signaturePosition.height,
      });

      const now = new Date();
      page.drawText(`Digitally signed by: Unit Owner`, {
        x: signatureX,
        y: signatureY - 15,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(
        `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        {
          x: signatureX,
          y: signatureY - 25,
          size: 8,
          color: rgb(0.5, 0.5, 0.5),
        }
      );

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], {
        type: "application/pdf",
      });

      onSignatureComplete(blob);
      onClose();
    } catch (error) {
      console.error("Error applying signature:", error);
      alert("Error applying signature. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${documentTitle}.pdf`;
    link.target = "_blank"; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fix 5: Add retry mechanism for failed PDF loads
  const retryLoad = () => {
    setIsLoading(true);
    setError("");
    // Force re-render of Document component
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {documentTitle}
              </h2>
              <p className="text-sm text-gray-600">PDF Document Preview</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {allowSigning && !error && (
              <>
                <button
                  onClick={() => setIsPlacingSignature(!isPlacingSignature)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isPlacingSignature
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>
                    {isPlacingSignature
                      ? "Click to Place Signature"
                      : "Add Signature"}
                  </span>
                </button>

                {signatureDataUrl && signaturePosition && (
                  <button
                    onClick={handleApplySignature}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Apply Signature</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar - Only show if no error */}
        {!error && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={scale >= 3.0}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleRotate}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, numPages))
                  }
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  disabled={currentPage >= numPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div
          className="flex-1 overflow-auto bg-gray-100 p-4"
          ref={containerRef}
        >
          <div className="flex justify-center">
            {/* Error Display */}
            {error && (
              <div className="max-w-2xl w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Preview Not Available
                    </h3>
                    <p className="text-yellow-700 mb-4">{error}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={retryLoad}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={downloadPDF}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Download PDF Instead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Document */}
            {!error && (
              <div
                className={`relative bg-white shadow-lg ${
                  isPlacingSignature ? "cursor-crosshair" : ""
                }`}
                onClick={handlePageClick}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white min-h-[600px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-600">Loading PDF...</span>
                    </div>
                  </div>
                )}

                <Document
                  file={documentOptions}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                  error=""
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {/* Signature Overlay */}
                {signatureDataUrl &&
                  signaturePosition &&
                  signaturePosition.page === currentPage && (
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-50 rounded"
                      style={{
                        left: signaturePosition.x * scale,
                        top: signaturePosition.y * scale,
                        width: signaturePosition.width * scale,
                        height: signaturePosition.height * scale,
                      }}
                    >
                      <img
                        src={signatureDataUrl}
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSignaturePosition(null);
                          setSignatureDataUrl("");
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}

                {/* Placement Instructions */}
                {isPlacingSignature && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">
                      Click where you want to place your signature
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>Document ID: {documentId}</div>
            <div>
              {signatureDataUrl && signaturePosition && (
                <span className="text-green-600 font-medium">
                  ✓ Signature ready to apply
                </span>
              )}
              {error && (
                <span className="text-red-600 font-medium">
                  Preview unavailable - download to view
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Creation Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Create Your Signature
                </h3>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw your signature below:
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg">
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: "signature-canvas w-full h-full",
                      }}
                      backgroundColor="rgb(255, 255, 255)"
                      penColor="rgb(0, 0, 0)"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use your mouse or touch to draw your signature
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSignatureClear}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignatureSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFPreviewModal;
