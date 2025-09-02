/**
 * Property Card Component
 * 
 * Reusable card for displaying property information.
 * Used in property lists, search results, and dashboards.
 * 
 * Features:
 * - Image gallery with navigation
 * - Status badges and pricing display
 * - Amenity tags and property details
 * - Action buttons based on user role and property status
 * 
 * Data Flow:
 * 1. Receives property data as props
 * 2. Calculates display rate using utility functions
 * 3. Renders appropriate actions based on user permissions
 */

import React, { useState } from 'react';
import { MapPin, Users, Bed, Bath, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import { getDisplayRate, formatRateDisplay } from '../../../utils/calculations';
import { getPropertyUnitType } from '../../../utils/dataHelpers';
import type { Property } from '../../../types';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  showActions?: boolean;
  showOwnerInfo?: boolean;
  actionLabel?: string;
  isAvailable?: boolean;
  className?: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
  showOwnerInfo = false,
  actionLabel = 'View Details',
  isAvailable = true,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Calculate display values
  const displayRate = getDisplayRate(property);
  const rateInfo = formatRateDisplay(property);
  const unitType = getPropertyUnitType(property);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Image Gallery */}
      <div className="relative">
        <img
          src={property.images[currentImageIndex]}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Image Navigation */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Status and Type Badges */}
        <div className="absolute top-3 left-3 space-y-2">
          <StatusBadge status={property.status} size="sm" />
          <span className={`block px-2 py-1 rounded-full text-xs font-medium ${
            unitType === 'short-term' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {unitType === 'short-term' ? 'Short-term' : 'Long-term'}
          </span>
        </div>

        {/* Availability Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
              Not Available
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {property.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {property.address}
        </p>

        {/* Property Specs */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms}
            </span>
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {property.maxGuests}
            </span>
          </div>
        </div>

        {/* Amenities Preview */}
        <div className="flex flex-wrap gap-2 mb-4">
          {property.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
            >
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="text-xs text-gray-500">
              +{property.amenities.length - 3} more
            </span>
          )}
        </div>

        {/* Pricing and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-purple-600">
              ${displayRate}
            </span>
            <span className="text-gray-500 text-sm">/night</span>
            {rateInfo.hasCommission && (
              <div className="text-xs text-gray-500">
                Base: ${rateInfo.baseRate} + {rateInfo.commissionPercentage}%
              </div>
            )}
          </div>
          
          {showActions && onSelect && (
            <button
              onClick={() => onSelect(property)}
              disabled={!isAvailable}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAvailable
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Owner Info (for property managers) */}
        {showOwnerInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Owner: {/* Owner name would be passed as prop or fetched */}
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {property.status === 'rejected' && property.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Rejection Reason:</strong> {property.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;