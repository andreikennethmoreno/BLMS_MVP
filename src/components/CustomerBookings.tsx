import React, { useState } from 'react';
import { Calendar, MapPin, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';
import { calculateNights } from '../utils/calculations';

interface Booking {
  id: string;
  propertyId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookedAt: string;
  customerName: string;
  customerEmail: string;
}

const CustomerBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const properties = propertiesData.properties;
  const users = usersData.users;
  const customerBookings = bookings.filter((b: Booking) => b.customerId === user?.id);

  const getProperty = (propertyId: string) => {
    return properties.find((p: any) => p.id === propertyId);
  };

  const getOwner = (ownerId: string) => {
    return users.find((u: any) => u.id === ownerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const isUpcoming = (checkIn: string) => {
    return new Date(checkIn) > new Date();
  };

  const isPast = (checkOut: string) => {
    return new Date(checkOut) < new Date();
  };

  const isCurrent = (checkIn: string, checkOut: string) => {
    const now = new Date();
    return new Date(checkIn) <= now && new Date(checkOut) > now;
  };

  const filteredBookings = customerBookings.filter((booking: Booking) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return isUpcoming(booking.checkIn);
    if (statusFilter === 'current') return isCurrent(booking.checkIn, booking.checkOut);
    if (statusFilter === 'past') return isPast(booking.checkOut);
    return booking.status === statusFilter;
  });

  const stats = {
    total: customerBookings.length,
    upcoming: customerBookings.filter((b: Booking) => isUpcoming(b.checkIn)).length,
    current: customerBookings.filter((b: Booking) => isCurrent(b.checkIn, b.checkOut)).length,
    totalSpent: customerBookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">View and manage all your hotel bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Trips</p>
              <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Stays</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.current}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-green-600">${stats.totalSpent.toLocaleString()}</p>
            </div>
            <User className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-gray-700">
            Filter Bookings
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Bookings</option>
            <option value="upcoming">Upcoming Trips</option>
            <option value="current">Current Stays</option>
            <option value="past">Past Trips</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Bookings ({filteredBookings.length})
          </h2>
        </div>

        <div className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'You haven\'t made any bookings yet' 
                  : `No ${statusFilter} bookings found`
                }
              </p>
              {statusFilter === 'all' && (
                <p className="text-sm text-gray-400 mt-2">
                  Browse properties to make your first booking
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking: Booking) => {
                const property = getProperty(booking.propertyId);
                const owner = property ? getOwner(property.ownerId) : null;
                const nights = calculateNights(booking.checkIn, booking.checkOut);

                return (
                  <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <img
                            src={property?.images[0] || ''}
                            alt={property?.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{property?.title}</h3>
                            <p className="text-gray-600 flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {property?.address}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Host: {owner?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span>{booking.status}</span>
                          </span>
                          {isUpcoming(booking.checkIn) && (
                            <div className="mt-2 text-sm text-blue-600 font-medium">
                              Upcoming Trip
                            </div>
                          )}
                          {isCurrent(booking.checkIn, booking.checkOut) && (
                            <div className="mt-2 text-sm text-emerald-600 font-medium">
                              Current Stay
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkIn).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Check-out</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkOut).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-semibold text-gray-900">
                            {nights} night{nights > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Guests</p>
                          <p className="font-semibold text-gray-900">
                            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-2xl font-bold text-purple-600">${booking.totalAmount}</p>
                          <p className="text-sm text-gray-600">
                            ${Math.round(booking.totalAmount / nights)} per night
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.paymentStatus === 'paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            Payment: {booking.paymentStatus}
                          </span>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-500">
                        Booked on: {new Date(booking.bookedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Booking Confirmation</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Property Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Details</h4>
                  <div className="flex items-start space-x-4">
                    <img
                      src={getProperty(selectedBooking.propertyId)?.images[0] || ''}
                      alt={getProperty(selectedBooking.propertyId)?.title}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="text-xl font-semibold text-gray-900">
                        {getProperty(selectedBooking.propertyId)?.title}
                      </h5>
                      <p className="text-gray-600 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {getProperty(selectedBooking.propertyId)?.address}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Host: {getOwner(getProperty(selectedBooking.propertyId)?.ownerId)?.name}
                      </p>
                      {getProperty(selectedBooking.propertyId)?.maxStayDisplay && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <strong>Max Stay:</strong> {getProperty(selectedBooking.propertyId)?.maxStayDisplay}
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              getProperty(selectedBooking.propertyId)?.termClassification === 'short-term' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {getProperty(selectedBooking.propertyId)?.termClassification === 'short-term' ? 'Short-term' : 'Long-term'}
                            </span>
                          </p>
                        </div>
                      )}
                      <div className="mt-3">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusIcon(selectedBooking.status)}
                          <span>{selectedBooking.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Stay Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedBooking.checkIn).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedBooking.checkOut).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900">
                          {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-semibold text-gray-900">
                          {selectedBooking.guests} guest{selectedBooking.guests > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Summary</h4>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        ${Math.round(selectedBooking.totalAmount / calculateNights(selectedBooking.checkIn, selectedBooking.checkOut))} × {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights
                      </span>
                      <span className="font-medium text-gray-900">
                        ${selectedBooking.totalAmount}
                      </span>
                    </div>
                    <div className="border-t border-purple-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-purple-600">
                          ${selectedBooking.totalAmount}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.paymentStatus === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Booking Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Booking ID: {selectedBooking.id}</p>
                    <p>Booked on: {new Date(selectedBooking.bookedAt).toLocaleString()}</p>
                    <p>Guest name: {selectedBooking.customerName}</p>
                    <p>Email: {selectedBooking.customerEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;