import React, { useState } from 'react';
import { FileText, Send, Eye, Upload, Download, Calendar, User, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PDFPreviewModal from './PDFPreviewModal';
import usersData from '../data/users.json';

interface PDFDocument {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  createdBy: string;
  createdAt: string;
  sentTo: string[];
  category: 'contract' | 'form' | 'agreement' | 'notice';
  status: 'draft' | 'sent' | 'signed' | 'completed';
  signatures: DocumentSignature[];
}

interface DocumentSignature {
  id: string;
  documentId: string;
  signedBy: string;
  signerName: string;
  signedAt: string;
  signedPdfUrl: string;
}

interface SendDocumentForm {
  title: string;
  description: string;
  pdfUrl: string;
  category: string;
  recipients: string[];
}

const PDFDocumentManager: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useLocalStorage<PDFDocument[]>('pdfDocuments', []);
  const [signatures, setSignatures] = useLocalStorage<DocumentSignature[]>('documentSignatures', []);
  const [showSendForm, setShowSendForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);
  const [sendForm, setSendForm] = useState<SendDocumentForm>({
    title: '',
    description: '',
    pdfUrl: '',
    category: 'form',
    recipients: []
  });

  const users = usersData.users;
  const unitOwners = users.filter(u => u.role === 'unit_owner' && u.verified);

  // Get documents based on user role
  const getUserDocuments = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'property_manager':
        return documents.filter(doc => doc.createdBy === user.id);
      case 'unit_owner':
        return documents.filter(doc => doc.sentTo.includes(user.id));
      default:
        return [];
    }
  };

  const handleSendDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'property_manager') return;

    const newDocument: PDFDocument = {
      id: `doc-${Date.now()}`,
      title: sendForm.title,
      description: sendForm.description,
      pdfUrl: sendForm.pdfUrl,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      sentTo: sendForm.recipients,
      category: sendForm.category as any,
      status: 'sent',
      signatures: []
    };

    setDocuments([...documents, newDocument]);
    setShowSendForm(false);
    setSendForm({
      title: '',
      description: '',
      pdfUrl: '',
      category: 'form',
      recipients: []
    });

    alert(`Document "${newDocument.title}" has been sent to ${sendForm.recipients.length} recipient(s)`);
  };

  const handleSignatureComplete = (documentId: string, signedPdfBlob: Blob) => {
    if (!user) return;

    // In a real app, you would upload the signed PDF to your server
    // For demo purposes, we'll create a blob URL
    const signedPdfUrl = URL.createObjectURL(signedPdfBlob);

    const newSignature: DocumentSignature = {
      id: `sig-${Date.now()}`,
      documentId,
      signedBy: user.id,
      signerName: user.name,
      signedAt: new Date().toISOString(),
      signedPdfUrl
    };

    setSignatures([...signatures, newSignature]);

    // Update document status
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, status: 'signed' as const, signatures: [...doc.signatures, newSignature] }
        : doc
    );
    setDocuments(updatedDocuments);

    alert('Document signed successfully! The signed version has been saved.');
  };

  const toggleRecipient = (userId: string) => {
    setSendForm(prev => ({
      ...prev,
      recipients: prev.recipients.includes(userId)
        ? prev.recipients.filter(id => id !== userId)
        : [...prev.recipients, userId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'signed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.name || 'Unknown User';
  };

  const userDocuments = getUserDocuments();
  const hasSignedDocument = (documentId: string) => {
    return signatures.some(sig => sig.documentId === documentId && sig.signedBy === user?.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Documents</h2>
          <p className="text-gray-600 mt-1">
            {user?.role === 'property_manager' 
              ? 'Send and manage PDF documents for unit owners'
              : 'Review and sign documents sent to you'
            }
          </p>
        </div>
        
        {user?.role === 'property_manager' && (
          <button
            onClick={() => setShowSendForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
            <span>Send Document</span>
          </button>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.role === 'property_manager' ? 'Sent Documents' : 'Received Documents'} ({userDocuments.length})
          </h3>
        </div>

        <div className="p-6">
          {userDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {user?.role === 'property_manager' 
                  ? 'No documents sent yet'
                  : 'No documents received yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userDocuments.map((document) => {
                const isSigned = hasSignedDocument(document.id);
                const documentSignatures = signatures.filter(sig => sig.documentId === document.id);
                
                return (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{document.title}</h4>
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                            {getStatusIcon(document.status)}
                            <span className="capitalize">{document.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{document.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-2 text-gray-900 capitalize">{document.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(document.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Recipients:</span>
                            <span className="ml-2 text-gray-900">{document.sentTo.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Signatures:</span>
                            <span className="ml-2 text-gray-900">{documentSignatures.length}</span>
                          </div>
                        </div>

                        {user?.role === 'property_manager' && documentSignatures.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h5 className="font-medium text-green-900 mb-2">Signatures Received:</h5>
                            <div className="space-y-1">
                              {documentSignatures.map(sig => (
                                <div key={sig.id} className="flex items-center space-x-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-green-800">
                                    {sig.signerName} - {new Date(sig.signedAt).toLocaleDateString()}
                                  </span>
                                  <a
                                    href={sig.signedPdfUrl}
                                    download={`${document.title}-signed-${sig.signerName}.pdf`}
                                    className="text-blue-600 hover:text-blue-700 underline"
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {user?.role === 'unit_owner' && isSigned && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-900">Document Signed</span>
                            </div>
                            <p className="text-green-800 text-sm mt-1">
                              You signed this document on {new Date(documentSignatures.find(sig => sig.signedBy === user.id)?.signedAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowPreview(true);
                          }}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </button>
                        
                        {user?.role === 'unit_owner' && !isSigned && (
                          <button
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowPreview(true);
                            }}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <PenTool className="w-4 h-4" />
                            <span>Sign</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Send Document Form Modal */}
      {showSendForm && user?.role === 'property_manager' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Send PDF Document</h3>
                <button
                  onClick={() => setShowSendForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSendDocument} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={sendForm.title}
                    onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter document title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={sendForm.description}
                    onChange={(e) => setSendForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the document"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF Document URL *
                  </label>
                  <input
                    type="url"
                    value={sendForm.pdfUrl}
                    onChange={(e) => setSendForm(prev => ({ ...prev, pdfUrl: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/document.pdf"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    For demo purposes, use a publicly accessible PDF URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Category
                  </label>
                  <select
                    value={sendForm.category}
                    onChange={(e) => setSendForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="form">Form</option>
                    <option value="contract">Contract</option>
                    <option value="agreement">Agreement</option>
                    <option value="notice">Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to Unit Owners *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {unitOwners.length === 0 ? (
                      <p className="text-gray-500 text-sm">No verified unit owners available</p>
                    ) : (
                      <div className="space-y-2">
                        {unitOwners.map(owner => (
                          <label key={owner.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendForm.recipients.includes(owner.id)}
                              onChange={() => toggleRecipient(owner.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{owner.name}</div>
                              <div className="text-sm text-gray-600">{owner.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {sendForm.recipients.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one recipient</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowSendForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendForm.recipients.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Send Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreview && selectedDocument && (
        <PDFPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedDocument(null);
          }}
          pdfUrl={selectedDocument.pdfUrl}
          documentTitle={selectedDocument.title}
          documentId={selectedDocument.id}
          allowSigning={user?.role === 'unit_owner' && !hasSignedDocument(selectedDocument.id)}
          onSignatureComplete={(signedPdfBlob) => handleSignatureComplete(selectedDocument.id, signedPdfBlob)}
        />
      )}
    </div>
  );
};

export default PDFDocumentManager;