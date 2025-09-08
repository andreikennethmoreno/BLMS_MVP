import React, { useState } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { updatePropertyWithCommission } from '../utils/propertyCalculations';

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
}

interface PropertyEditSystemProps {
  property: Property;
  onEditSubmitted: () => void;
  onCancel: () => void;
}

const PropertyEditSystem: React.FC<PropertyEditSystemProps> = ({ 
  property, 
  onEditSubmitted,
  onCancel 
}) => {
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage('properties', []);
  const [editedProperty, setEditedProperty] = useState({
    title: property.title,
    description: property.description,
    address: property.address,
    images: [...property.images],
    amenities: [...property.amenities],
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    proposedRate: property.proposedRate,
    rentalType: property.rentalType || 'short-term'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate updated rates with commission
    const updatedPropertyWithRates = updatePropertyWithCommission(editedProperty, 15);
    
    const updatedProperties = properties.map((p: Property) =>
      p.id === property.id
        ? {
            ...p,
            ...updatedPropertyWithRates,
            images: editedProperty.images.filter(img => img.trim() !== ''),
            amenities: editedProperty.amenities.filter(amenity => amenity.trim() !== ''),
            status: 'pending_review', // Reset to pending when edited
            submittedAt: new Date().toISOString(),
            rejectionReason: undefined, // Clear previous rejection reason
            contractApproved: false // Reset contract approval
          }
        : p
    );

    setProperties(updatedProperties);
    onEditSubmitted();
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
    if (editedProperty.images.length > 1) {
      setEditedProperty(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
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
    if (editedProperty.amenities.length > 1) {
      setEditedProperty(prev => ({
        ...prev,
        amenities: prev.amenities.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Important Notice</h4>
            <p className="text-yellow-800 mt-1">
              Editing your property will change its status to "Pending Review" and it will need to be approved again before becoming visible to customers.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Title
            </label>
            <input
              type="text"
              value={editedProperty.title}
              onChange={(e) => setEditedProperty(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              + Add another amenity
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes & Resubmit</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyEditSystem;