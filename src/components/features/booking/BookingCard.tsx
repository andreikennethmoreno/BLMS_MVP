/**
 * Booking Card Component
 * 
 * Reusable card for displaying booking information.
 * Used in booking lists, dashboards, and management views.
 * 
 * Features:
 * - Property image and details
 * - Guest information and stay duration
 * - Payment status and total amount
 * - Action buttons based on user role
 * 
 * Data Flow:
 * 1. Receives booking data and related property info
 * 2. Calculates nights and rate per night
 * 3. Displays appropriate actions based on booking status
 */

import React from 'react';
import { MapPin, User, Calendar, DollarSign } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import { calculateNights } from '../../../utils/calculations';
import { formatDate } from '../../../utils/dateHelpers';
import type { Booking, Property } from '../../../types';

interface BookingCardProps {
  booking: Booking;
  property: Property;
  onViewDetails?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  showCustomerInfo?: boolean;
  showPropertyOwner?: boolean;
  className?: string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  property,
  onViewDetails,
  onCancel,
  showCustomerInfo = false,
  showPropertyOwner = false,
  className = ''
}) => {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const ratePerNight = Math.round(booking.totalAmount / nights);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          {/* Property Image */}
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-20 h-20 rounded-lg object-cover"
          />
          
          {/* Booking Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                <p className="text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.address}
                </p>
                {showPropertyOwner && (
                  <p className="text-sm text-gray-500 mt-1">
                    {/* Owner info would be passed as prop */}
                  </p>
                )}
              </div>
              <StatusBadge status={booking.status} showIcon />
            </div>

            {/* Stay Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {showCustomerInfo && (
                <div>
                  <p className="text-sm text-gray-500">Guest</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {booking.customerName}
                  </p>
                  <p className="text-sm text-gray-600">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.checkIn)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.checkOut)}
                </p>
                <p className="text-sm text-gray-600">{nights} night{nights > 1 ? 's' : ''}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-emerald-600">${booking.totalAmount}</p>
                <p className="text-sm text-gray-600">${ratePerNight}/night</p>
              </div>
            </div>

            {/* Payment Status and Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.paymentStatus === 'paid' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  Payment: {booking.paymentStatus}
                </span>
                <span className="text-sm text-gray-500">
                  Booked: {formatDate(booking.bookedAt)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(booking)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    View Details
                  </button>
                )}
                {onCancel && booking.status === 'confirmed' && (
                  <button
                    onClick={() => onCancel(booking)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel
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

export default BookingCard;