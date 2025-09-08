import React, { useState } from 'react';
import { RefreshCw, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { updatePropertyWithCommission } from '../utils/propertyCalculations';
import { convertMaxStayToDays, formatMaxStayDisplay, calculateTermClassification } from '../utils/calculations';

interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  address: string;
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  proposedRate: number;
  finalRate: number | null;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
  appealCount?: number;
}

interface PropertyAppealSystemProps {
  property: Property;
  onAppealSubmitted: () => void;
}

const PropertyAppealSystem: React.FC<PropertyAppealSystemProps> = ({ 
  property, 
  onAppealSubmitted 
}) => {
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage('properties', []);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [editedProperty, setEditedProperty] = useState({
    title: property.title,
    description: property.description,
    address: property.address,
    images: property.images,
    amenities: property.amenities,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    proposedRate: property.proposedRate,
    rentalType: property.rentalType || 'short-term',
    maxStayValue: property.maxStayDays ? Math.round(property.maxStayDays / (property.maxStayUnit === 'years' ? 365 : property.maxStayUnit === 'months' ? 30 : 1)) : 6,
    maxStayUnit: property.maxStayUnit || 'months'
  });

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate maximum stay in days and term classification
    const maxStayDays = convertMaxStayToDays(editedProperty.maxStayValue, editedProperty.maxStayUnit);
    const maxStayDisplay = formatMaxStayDisplay(editedProperty.maxStayValue, editedProperty.maxStayUnit);
    const termClassification = calculateTermClassification(maxStayDays);
    
    // Calculate updated rates with commission
    const updatedPropertyWithRates = updatePropertyWithCommission(editedProperty, 15);
    
    const updatedProperties = properties.map((p: Property) =>
      p.id === property.id
        ? {
            ...p,
            ...updatedPropertyWithRates,
            maxStayDays,
            maxStayUnit: editedProperty.maxStayUnit,
            maxStayDisplay,
            termClassification,
            images: editedProperty.images.filter(img => img.trim() !== ''),
            amenities: editedProperty.amenities.filter(amenity => amenity.trim() !== ''),
            status: 'pending_review',
            submittedAt: new Date().toISOString(),
            appealCount: (property.appealCount || 0) + 1,
            rejectionReason: undefined, // Clear previous rejection reason
            contractApproved: false // Reset contract approval
          }
        : p
    );

    setProperties(updatedProperties);
    setShowAppealForm(false);
    onAppealSubmitted();
  };

  const addImageField = () => {
    setEditedProperty(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImage = (index: number, value: string) => {
    setEditedProperty(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const removeImage = (index: number) => {
    setEditedProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addAmenityField = () => {
    setEditedProperty(prev => ({
      ...prev,
      amenities: [...prev.amenities, '']
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setEditedProperty(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => i === index ? value : amenity)
    }));
  };

  const removeAmenity = (index: number) => {
    setEditedProperty(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  if (property.status !== 'rejected') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Rejection Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900">Property Rejected</h4>
            <p className="text-red-800 mt-1">{property.rejectionReason}</p>
            {property.appealCount && property.appealCount > 0 && (
              <p className="text-sm text-red-600 mt-2">
                Appeals submitted: {property.appealCount}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Appeal Button */}
      <button
        onClick={() => setShowAppealForm(true)}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Appeal & Resubmit</span>
      </button>

      {/* Appeal Form Modal */}
      {showAppealForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Appeal Property Rejection</h3>
                  <p className="text-gray-600 mt-1">
                    Edit your property details to address the rejection reason and resubmit for review
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Allowed Stay
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={editedProperty.maxStayValue}
                        onChange={(e) =>
                          setEditedProperty((prev) => ({
                            ...prev,
                            maxStayValue: Number(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter number"
                      />
                    </div>
                    <div>
                      <select
                        value={editedProperty.maxStayUnit}
                        onChange={(e) =>
                          setEditedProperty((prev) => ({
                            ...prev,
                            maxStayUnit: e.target.value as "days" | "months" | "years",
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum duration guests can stay at your property
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Classification:</strong> {calculateTermClassification(convertMaxStayToDays(editedProperty.maxStayValue, editedProperty.maxStayUnit)) === 'short-term' ? 'Short-term' : 'Long-term'} 
                      ({formatMaxStayDisplay(editedProperty.maxStayValue, editedProperty.maxStayUnit)} maximum)
                    </p>
                  </div>
                <button
                  onClick={() => setShowAppealForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Rejection Reason Reminder */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-900 mb-2">Address This Issue:</h4>
                <p className="text-red-800">{property.rejectionReason}</p>
              </div>

              <form onSubmit={handleAppealSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title
                    </label>
                    <input
                      type="text"
                      value={editedProperty.title}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editedProperty.description}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editedProperty.address}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editedProperty.bedrooms}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editedProperty.bathrooms}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editedProperty.maxGuests}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, maxGuests: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Rate (per night)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1"
                        value={editedProperty.proposedRate}
                        onChange={(e) => setEditedProperty(prev => ({ ...prev, proposedRate: Number(e.target.value) }))}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Type
                    </label>
                    <select
                      value={editedProperty.rentalType}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, rentalType: e.target.value as 'short-term' | 'long-term' }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="short-term">Short-term Rental</option>
                      <option value="long-term">Long-term Rental</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the intended rental duration for your property
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Type
                    </label>
                    <select
                      value={editedProperty.rentalType}
                      onChange={(e) => setEditedProperty(prev => ({ ...prev, rentalType: e.target.value as 'short-term' | 'long-term' }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="short-term">Short-term Rental</option>
                      <option value="long-term">Long-term Rental</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the intended rental duration for your property
                    </p>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Images (URLs)
                  </label>
                  <div className="space-y-2">
                    {editedProperty.images.map((image, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => updateImage(index, e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {editedProperty.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add another image
                    </button>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {editedProperty.amenities.map((amenity, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={amenity}
                          onChange={(e) => updateAmenity(index, e.target.value)}
                          placeholder="e.g., WiFi, Kitchen, Pool"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {editedProperty.amenities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAmenity(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAmenityField}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add another amenity
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAppealForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Submit Appeal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAppealSystem;