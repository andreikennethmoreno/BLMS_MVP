import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ContractTemplateEditor from './ContractTemplateEditor';
import formTemplatesData from '../data/formTemplates.json';
import { FileText } from 'lucide-react';

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
 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage downloadable form templates</p>
        </div>
        
      </div>

      {/* Contract Templates Section */}
      {user?.role === 'property_manager' && (
        <div className="mb-8">
          <ContractTemplateEditor />
        </div>
      )}

      {/* Templates Grid */}
      

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

      {/* New Template Form Modal */}
    

     
    </div>
  );
};

export default FormTemplateSystem;