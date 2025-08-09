import React, { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import formTemplatesData from '../data/formTemplates.json';

interface ContractField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue?: string;
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

interface ContractTemplateEditorProps {
  onSelectTemplate?: (template: ContractTemplate) => void;
  showSelector?: boolean;
}

const ContractTemplateEditor: React.FC<ContractTemplateEditorProps> = ({ 
  onSelectTemplate, 
  showSelector = false 
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useLocalStorage('contractTemplates', formTemplatesData.formTemplates);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    commissionPercentage: 15,
    fields: [
      { id: 'property_name', label: 'Property Name', type: 'text', required: true },
      { id: 'owner_name', label: 'Owner Name', type: 'text', required: true },
      { id: 'rental_rate', label: 'Rental Rate (per night)', type: 'number', required: true },
      { id: 'terms', label: 'Additional Terms', type: 'textarea', required: false }
    ]
  });

  const contractTemplates = templates.filter((t: any) => t.category === 'contracts');

  const handleSaveTemplate = (template: ContractTemplate) => {
    if (editingTemplate) {
      // Update existing template
      const updatedTemplates = templates.map((t: any) =>
        t.id === template.id ? template : t
      );
      setTemplates(updatedTemplates);
    } else {
      // Create new template
      const newTemplateWithId = {
        ...template,
        id: `template-${Date.now()}`,
        category: 'contracts',
        createdAt: new Date().toISOString(),
        createdBy: user?.id || ''
      };
      setTemplates([...templates, newTemplateWithId]);
    }
    setEditingTemplate(null);
    setShowNewTemplateForm(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t: any) => t.id !== templateId));
  };

  const addField = (template: ContractTemplate) => {
    const newField = {
      id: `field-${Date.now()}`,
      label: '',
      type: 'text',
      required: false
    };
    return {
      ...template,
      fields: [...template.fields, newField]
    };
  };

  const updateField = (template: ContractTemplate, fieldIndex: number, field: Partial<ContractField>) => {
    return {
      ...template,
      fields: template.fields.map((f, i) => i === fieldIndex ? { ...f, ...field } : f)
    };
  };

  const removeField = (template: ContractTemplate, fieldIndex: number) => {
    return {
      ...template,
      fields: template.fields.filter((_, i) => i !== fieldIndex)
    };
  };

  if (showSelector) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Contract Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractTemplates.map((template: ContractTemplate) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">
                  {template.commissionPercentage}% Commission
                </span>
                <button
                  onClick={() => onSelectTemplate?.(template)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contract Templates</h2>
        <button
          onClick={() => setShowNewTemplateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractTemplates.map((template: ContractTemplate) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Commission: {template.commissionPercentage}%
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingTemplate(template)}
                className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/New Template Modal */}
      {(editingTemplate || showNewTemplateForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Contract Template' : 'Create Contract Template'}
                </h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowNewTemplateForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <TemplateForm
                template={editingTemplate || newTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => {
                  setEditingTemplate(null);
                  setShowNewTemplateForm(false);
                }}
                addField={addField}
                updateField={updateField}
                removeField={removeField}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TemplateFormProps {
  template: any;
  onSave: (template: ContractTemplate) => void;
  onCancel: () => void;
  addField: (template: ContractTemplate) => ContractTemplate;
  updateField: (template: ContractTemplate, fieldIndex: number, field: Partial<ContractField>) => ContractTemplate;
  removeField: (template: ContractTemplate, fieldIndex: number) => ContractTemplate;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSave,
  onCancel,
  addField,
  updateField,
  removeField
}) => {
  const [currentTemplate, setCurrentTemplate] = useState(template);

  const handleSave = () => {
    onSave(currentTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={currentTemplate.name}
            onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commission Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={currentTemplate.commissionPercentage}
              onChange={(e) => setCurrentTemplate(prev => ({ ...prev, commissionPercentage: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <span className="absolute right-3 top-3 text-gray-500">%</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={currentTemplate.description}
          onChange={(e) => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          required
        />
      </div>

      {/* Fields */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Contract Fields
          </label>
          <button
            type="button"
            onClick={() => setCurrentTemplate(addField(currentTemplate))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Add Field
          </button>
        </div>

        <div className="space-y-4">
          {currentTemplate.fields.map((field: ContractField, index: number) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => setCurrentTemplate(updateField(currentTemplate, index, { label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter field label"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => setCurrentTemplate(updateField(currentTemplate, index, { type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => setCurrentTemplate(updateField(currentTemplate, index, { required: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentTemplate(removeField(currentTemplate, index))}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    disabled={currentTemplate.fields.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4 inline mr-2" />
          Save Template
        </button>
      </div>
    </div>
  );
};

export default ContractTemplateEditor;