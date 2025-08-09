import React, { useState } from 'react';
import { FileText, Plus, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ContractTemplateEditor from './ContractTemplateEditor';
import formTemplatesData from '../data/formTemplates.json';

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
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'contracts',
    fields: [{ id: 'field-1', label: '', type: 'text', required: false }]
  });

  const handleSubmitTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const template: FormTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      fields: newTemplate.fields.filter(field => field.label.trim() !== ''),
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    setTemplates([...templates, template]);
    setShowNewTemplateForm(false);
    setNewTemplate({
      name: '',
      description: '',
      category: 'contracts',
      fields: [{ id: 'field-1', label: '', type: 'text', required: false }]
    });
  };

  const addField = () => {
    setNewTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, {
        id: `field-${Date.now()}`,
        label: '',
        type: 'text',
        required: false
      }]
    }));
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    setNewTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  const removeField = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const generatePDF = (template: FormTemplate) => {
    // Create a simple HTML structure for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .field { margin-bottom: 20px; }
          .field label { font-weight: bold; display: block; margin-bottom: 5px; }
          .field input, .field textarea { width: 100%; padding: 8px; border: 1px solid #ccc; }
          .required { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${template.name}</h1>
          <p>${template.description}</p>
        </div>
        ${template.fields.map(field => `
          <div class="field">
            <label>
              ${field.label}
              ${field.required ? '<span class="required">*</span>' : ''}
            </label>
            ${field.type === 'textarea' 
              ? '<textarea rows="4"></textarea>' 
              : `<input type="${field.type}" />`
            }
          </div>
        `).join('')}
        <div style="margin-top: 40px;">
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t: FormTemplate) => t.id !== templateId));
  };

  const categories = ['contracts', 'inspections', 'maintenance', 'legal', 'other'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage downloadable form templates</p>
        </div>
        
        {user?.role === 'property_manager' && (
          <button
            onClick={() => setShowNewTemplateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Template</span>
          </button>
        )}
      </div>

      {/* Contract Templates Section */}
      {user?.role === 'property_manager' && (
        <div className="mb-8">
          <ContractTemplateEditor />
        </div>
      )}

      {/* Templates Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Other Form Templates</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.filter((t: FormTemplate) => t.category !== 'contracts').map((template: FormTemplate) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {template.category}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {template.fields.length} fields
                  </span>
                </div>
                
                <p className="text-gray-500 text-xs">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowPreview(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={() => generatePDF(template)}
                className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              {user?.role === 'property_manager' && (
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
      {showNewTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Create Form Template</h3>
                <button
                  onClick={() => setShowNewTemplateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitTemplate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Form Fields
                    </label>
                    <button
                      type="button"
                      onClick={addField}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add Field
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newTemplate.fields.map((field, index) => (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(index, { label: e.target.value })}
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
                              onChange={(e) => updateField(index, { type: e.target.value })}
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
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                          </div>

                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                              disabled={newTemplate.fields.length === 1}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTemplateForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>
                
                {selectedTemplate.fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        disabled
                      />
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        disabled
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => generatePDF(selectedTemplate)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormTemplateSystem;