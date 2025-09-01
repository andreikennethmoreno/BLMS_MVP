import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ContractTemplateEditor from './ContractTemplateEditor';
import PDFDocumentManager from './PDFDocumentManager';
import formTemplatesData from '../data/formTemplates.json';
import { FileText, File } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  createdAt: string;
  createdBy: string;
}

const FormTemplateSystem: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useLocalStorage('formTemplates', formTemplatesData.formTemplates);
  const [activeTab, setActiveTab] = useState<'templates' | 'documents'>('templates');
 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms & Documents</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'property_manager' 
              ? 'Create templates and send PDF documents to unit owners'
              : 'Review contracts, forms, and sign documents'
            }
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Contract Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'documents'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <File className="w-5 h-5" />
            <span>PDF Documents</span>
          </button>
        </div>
      </div>
      {/* Tab Content */}
      {activeTab === 'templates' ? (
        <div>
          {/* Contract Templates Section */}
          {user?.role === 'property_manager' && (
            <div className="mb-8">
              <ContractTemplateEditor />
            </div>
          )}

          {templates.filter((t: FormTemplate) => t.category !== 'contracts').length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No form templates created yet</p>
              {user?.role === 'property_manager' && (
                <p className="text-sm text-gray-400 mt-2">
                  Create your first template to get started
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* PDF Documents Section */}
          <PDFDocumentManager />
        </div>
      )}
    </div>
  );
};

export default FormTemplateSystem;