import React, { useState } from "react";
import { Download, PenTool, Eye, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PDFPreviewModal from "./PDFPreviewModal";
import { generateContractPDF } from "./ContractPDFGenerator";

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

interface Contract {
  id: string;
  templateId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  templateName: string;
  terms: string;
  commissionPercentage: number;
  fields?: ContractField[];
  status: string;
  sentAt: string;
  reviewedAt?: string;
  agreedAt?: string;
  disagreedAt?: string;
  disagreementReason?: string;
}

interface ContractPDFViewerProps {
  contract?: Contract;
  template?: ContractTemplate;
  onSignatureComplete?: (signedPdfBlob: Blob) => void;
  showSignatureOption?: boolean;
}

const ContractPDFViewer: React.FC<ContractPDFViewerProps> = ({
  contract,
  template,
  onSignatureComplete,
  showSignatureOption = false,
}) => {
  const { user } = useAuth();
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [showFallbackPreview, setShowFallbackPreview] = useState(false);

  const contractData = contract || template;
  if (!contractData) return null;

  const generatePDF = async () => {
    setIsGenerating(true);
    setError("");
    try {
      console.log("Starting PDF generation...");
      console.log("Contract data:", contract);
      console.log("Template data:", template);

      let pdfBlob: Blob;

      if (contract) {
        // Generate PDF from contract data
        const templateData: ContractTemplate = {
          id: contract.templateId,
          name: contract.templateName,
          description: contract.terms,
          category: "contracts",
          fields: contract.fields || [],
          commissionPercentage: contract.commissionPercentage,
          createdAt: contract.sentAt,
          createdBy: "property_manager",
        };

        console.log(
          "Generating PDF from contract with template data:",
          templateData
        );
        pdfBlob = await generateContractPDF(
          templateData,
          contract.ownerName,
          contract.ownerEmail
        );
      } else if (template) {
        // Generate PDF from template
        console.log("Generating PDF from template:", template);
        pdfBlob = await generateContractPDF(template);
      } else {
        throw new Error("No contract or template data provided");
      }

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Generated PDF is empty or invalid");
      }

      console.log("PDF generated successfully, size:", pdfBlob.size, "bytes");
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPDFModal(true);
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignatureComplete = (signedPdfBlob: Blob) => {
    if (onSignatureComplete) {
      onSignatureComplete(signedPdfBlob);
    }
    setShowPDFModal(false);
  };

  const downloadPDF = async () => {
    if (!pdfUrl) {
      await generatePDF();
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    const fileName = contract
      ? contract.templateName
      : template?.name || "contract";
    link.download = `${fileName || "contract"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTitle = () => {
    if (contract) return contract.templateName;
    if (template) return template.name;
    return "Contract";
  };

  const getDocumentId = () => {
    if (contract) return contract.id;
    if (template) return template.id;
    return "template";
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                PDF Generation Error
              </h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <div className="text-xs text-red-600">
                <p>
                  You can still download the PDF or try again. If the issue
                  persists, check the browser console for more details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Preview PDF</span>
            </>
          )}
        </button>

        <button
          onClick={downloadPDF}
          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        {error && (
          <button
            onClick={() => setShowFallbackPreview(!showFallbackPreview)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{showFallbackPreview ? "Hide" : "Show"} Text Preview</span>
          </button>
        )}

        {showSignatureOption && user?.role === "unit_owner" && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PenTool className="w-4 h-4" />
            <span>Click "Preview PDF" to view and sign the contract</span>
          </div>
        )}
      </div>

      {/* Fallback Text Preview */}
      {showFallbackPreview && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contract Preview
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">Contract Name:</h4>
              <p className="text-gray-700">{getTitle()}</p>
            </div>

            {contract && (
              <>
                <div>
                  <h4 className="font-medium text-gray-900">Owner:</h4>
                  <p className="text-gray-700">
                    {contract.ownerName} ({contract.ownerEmail})
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Commission:</h4>
                  <p className="text-gray-700">
                    {contract.commissionPercentage}%
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Terms:</h4>
                  <p className="text-gray-700">{contract.terms}</p>
                </div>
              </>
            )}

            {template && (
              <>
                <div>
                  <h4 className="font-medium text-gray-900">Description:</h4>
                  <p className="text-gray-700">{template.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Commission:</h4>
                  <p className="text-gray-700">
                    {template.commissionPercentage}%
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Fields:</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {template.fields.map((field, index) => (
                      <li key={index}>
                        {field.label} ({field.type}) {field.required && "*"}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFModal && pdfUrl && (
        <PDFPreviewModal
          isOpen={showPDFModal}
          onClose={() => {
            setShowPDFModal(false);
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl("");
          }}
          pdfUrl={pdfUrl}
          documentTitle={getTitle()}
          documentId={getDocumentId()}
          allowSigning={showSignatureOption && user?.role === "unit_owner"}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
};

export default ContractPDFViewer;
