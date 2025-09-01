import React, { useState, useEffect } from 'react';
import { FileText, Download, PenTool, Eye, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PDFPreviewModal from './PDFPreviewModal';
import { generateContractPDF } from './ContractPDFGenerator';

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
  showSignatureOption = false
}) => {
  const { user } = useAuth();
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const contractData = contract || template;
  if (!contractData) return null;

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      let pdfBlob: Blob;
      
      if (contract) {
        // Generate PDF from contract data
        const templateData: ContractTemplate = {
          id: contract.templateId,
          name: contract.templateName,
          description: contract.terms,
          category: 'contracts',
          fields: contract.fields || [],
          commissionPercentage: contract.commissionPercentage,
          createdAt: contract.sentAt,
          createdBy: 'property_manager'
        };
        
        pdfBlob = await generateContractPDF(templateData, contract.ownerName, contract.ownerEmail);
      } else if (template) {
        // Generate PDF from template
        pdfBlob = await generateContractPDF(template);
      } else {
        throw new Error('No contract or template data provided');
      }

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPDFModal(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${contractData.name || 'contract'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTitle = () => {
    if (contract) return contract.templateName;
    if (template) return template.name;
    return 'Contract';
  };

  const getDocumentId = () => {
    if (contract) return contract.id;
    if (template) return template.id;
    return 'template';
  };

  return (
    <div className="space-y-4">
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

        {showSignatureOption && user?.role === 'unit_owner' && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PenTool className="w-4 h-4" />
            <span>Click "Preview PDF" to view and sign the contract</span>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {showPDFModal && pdfUrl && (
        <PDFPreviewModal
          isOpen={showPDFModal}
          onClose={() => {
            setShowPDFModal(false);
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl('');
          }}
          pdfUrl={pdfUrl}
          documentTitle={getTitle()}
          documentId={getDocumentId()}
          allowSigning={showSignatureOption && user?.role === 'unit_owner'}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
};

export default ContractPDFViewer;