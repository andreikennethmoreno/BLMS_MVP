import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, User, Building, FileText, CheckCircle, Upload, Shield, CreditCard } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import usersData from '../data/users.json';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSwitchToLogin: () => void;
}

interface OnboardingData {
  // Step 1: Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  // Step 2: Identity Verification
  identity: {
    idType: string;
    idNumber: string;
    idDocument: string;
    selfieDocument: string;
  };
  // Step 3: Business Information
  business: {
    businessType: string;
    businessName: string;
    taxId: string;
    businessAddress: string;
  };
  // Step 4: Financial Information
  financial: {
    bankAccount: string;
    routingNumber: string;
    accountType: string;
  };
  // Step 5: Property Information
  property: {
    propertyCount: string;
    propertyTypes: string[];
    totalValue: string;
  };
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSwitchToLogin }) => {
  const [users, setUsers] = useLocalStorage('users', usersData.users);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    },
    identity: {
      idType: 'drivers_license',
      idNumber: '',
      idDocument: '',
      selfieDocument: ''
    },
    business: {
      businessType: 'individual',
      businessName: '',
      taxId: '',
      businessAddress: '',
    },
    financial: {
      bankAccount: '',
      routingNumber: '',
      accountType: 'checking',
    },
    property: {
      propertyCount: '',
      propertyTypes: [],
      totalValue: '',
    }
  });

  const totalSteps = 6;

  const steps = [
    { id: 1, title: 'Personal Information', icon: User, description: 'Basic personal details' },
    { id: 2, title: 'Identity Verification', icon: Shield, description: 'Verify your identity' },
    { id: 3, title: 'Business Information', icon: Building, description: 'Business details' },
    { id: 4, title: 'Financial Information', icon: CreditCard, description: 'Banking and financial info' },
    { id: 5, title: 'Property Portfolio', icon: FileText, description: 'Your property experience' },
    { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Review your application' }
  ];

  const updateData = (section: keyof OnboardingData, field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const { firstName, lastName, email, phone, dateOfBirth } = onboardingData.personalInfo;
        return !!(firstName && lastName && email && phone && dateOfBirth);
      case 2:
        const { idNumber, idDocument, selfieDocument } = onboardingData.identity;
        return !!(idNumber && idDocument && selfieDocument);
      case 3:
        const { businessAddress } = onboardingData.business;
        return !!businessAddress;
      case 4:
        const { bankAccount, routingNumber } = onboardingData.financial;
        return !!(bankAccount && routingNumber);
      case 5:
        const { propertyCount } = onboardingData.property;
        return !!(propertyCount );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      alert('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newUser = {
      id: `user-${Date.now()}`,
      email: onboardingData.personalInfo.email,
      password: 'tempPassword123', // In real app, this would be set separately
      role: 'unit_owner',
      name: `${onboardingData.personalInfo.firstName} ${onboardingData.personalInfo.lastName}`,
      verified: false, // Will be reviewed by property manager
      createdAt: new Date().toISOString(),
      onboardingData: onboardingData // Store all onboarding data for review
    };

    setUsers([...users, newUser]);
    setIsLoading(false);
    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={onboardingData.personalInfo.firstName}
                  onChange={(e) => updateData('personalInfo', 'firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={onboardingData.personalInfo.lastName}
                  onChange={(e) => updateData('personalInfo', 'lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={onboardingData.personalInfo.email}
                  onChange={(e) => updateData('personalInfo', 'email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={onboardingData.personalInfo.phone}
                  onChange={(e) => updateData('personalInfo', 'phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={onboardingData.personalInfo.dateOfBirth}
                  onChange={(e) => updateData('personalInfo', 'dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
              <p className="text-gray-600">We need to verify your identity for security purposes</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type *
                </label>
                <select
                  value={onboardingData.identity.idType}
                  onChange={(e) => updateData('identity', 'idType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="drivers_license">Driver's License</option>
                  <option value="passport">Passport</option>
                  <option value="state_id">State ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={onboardingData.identity.idNumber}
                  onChange={(e) => updateData('identity', 'idNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your ID number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID Document *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="url"
                    value={onboardingData.identity.idDocument}
                    onChange={(e) => updateData('identity', 'idDocument', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/id-document.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-2">Upload a clear photo of your ID</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selfie with ID *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="url"
                    value={onboardingData.identity.selfieDocument}
                    onChange={(e) => updateData('identity', 'selfieDocument', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/selfie-with-id.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-2">Take a selfie holding your ID</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
              <p className="text-gray-600">Tell us about your business structure</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={onboardingData.business.businessType}
                  onChange={(e) => updateData('business', 'businessType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="individual">Individual/Sole Proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>

              {onboardingData.business.businessType !== 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={onboardingData.business.businessName}
                    onChange={(e) => updateData('business', 'businessName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID / SSN
                </label>
                <input
                  type="text"
                  value={onboardingData.business.taxId}
                  onChange={(e) => updateData('business', 'taxId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXX-XX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address *
                </label>
                <textarea
                  value={onboardingData.business.businessAddress}
                  onChange={(e) => updateData('business', 'businessAddress', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your business address"
                />
              </div>

              
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Financial Information</h2>
              <p className="text-gray-600">Secure banking details for payouts</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Your information is secure</h4>
                  <p className="text-blue-800 text-sm">All financial data is encrypted and stored securely</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  value={onboardingData.financial.bankAccount}
                  onChange={(e) => updateData('financial', 'bankAccount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={onboardingData.financial.routingNumber}
                  onChange={(e) => updateData('financial', 'routingNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9-digit routing number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  value={onboardingData.financial.accountType}
                  onChange={(e) => updateData('financial', 'accountType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="business">Business</option>
                </select>
              </div>

             
              
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Property Portfolio</h2>
              <p className="text-gray-600">Tell us about your property experience</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many properties do you plan to list? *
                </label>
                <select
                  value={onboardingData.property.propertyCount}
                  onChange={(e) => updateData('property', 'propertyCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select number</option>
                  <option value="1">1 property</option>
                  <option value="2-5">2-5 properties</option>
                  <option value="6-10">6-10 properties</option>
                  <option value="10+">10+ properties</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Types (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Apartment', 'House', 'Condo', 'Villa', 'Cabin', 'Loft'].map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={onboardingData.property.propertyTypes.includes(type)}
                        onChange={(e) => {
                          const types = onboardingData.property.propertyTypes;
                          if (e.target.checked) {
                            updateData('property', 'propertyTypes', [...types, type]);
                          } else {
                            updateData('property', 'propertyTypes', types.filter(t => t !== type));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Total Property Value
                </label>
                <select
                  value={onboardingData.property.totalValue}
                  onChange={(e) => updateData('property', 'totalValue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select range</option>
                  <option value="under-500k">Under $500,000</option>
                  <option value="500k-1m">$500,000 - $1,000,000</option>
                  <option value="1m-5m">$1,000,000 - $5,000,000</option>
                  <option value="5m+">$5,000,000+</option>
                </select>
              </div>

            
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
              <p className="text-gray-600">Please review your information before submitting</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {onboardingData.personalInfo.firstName} {onboardingData.personalInfo.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900">{onboardingData.personalInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 text-gray-900">{onboardingData.personalInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="ml-2 text-gray-900">{onboardingData.personalInfo.dateOfBirth}</span>
                  </div>
                </div>
              </div>

              {/* Business Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business Type:</span>
                    <span className="ml-2 text-gray-900 capitalize">{onboardingData.business.businessType}</span>
                  </div>
                 
                </div>
              </div>

              {/* Property Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Property Portfolio</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Properties to list:</span>
                    <span className="ml-2 text-gray-900">{onboardingData.property.propertyCount}</span>
                  </div>
                  
                </div>
                {onboardingData.property.propertyTypes.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-600">Property Types:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {onboardingData.property.propertyTypes.map((type) => (
                        <span key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">What happens next?</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Your application will be reviewed by our team</li>
                  <li>• We'll verify your identity and business information</li>
                  <li>• You'll receive an email within 2-3 business days</li>
                  <li>• Once approved, you can start listing your properties</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between text-white mb-4">
              <h1 className="text-2xl font-bold">Unit Owner Onboarding</h1>
              <span className="text-blue-100">Step {currentStep} of {totalSteps}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="px-8 py-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={onSwitchToLogin}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Already have an account? Sign in
                </button>

                {currentStep < totalSteps ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;