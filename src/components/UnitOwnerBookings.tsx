import React, { useState } from 'react';
import { Calendar, User, MapPin, Building2, Clock, CheckCircle, TrendingUp, Eye, Filter, Search, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
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
}

const UnitOwnerBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const ownerProperties = properties.filter((p: Property) => p.ownerId === user?.id);
  const ownerBookings = bookings.filter((booking: Booking) => 
    ownerProperties.some((prop: Property) => prop.id === booking.propertyId)
  );

  // Get booked property IDs
  const bookedPropertyIds = new Set(
    ownerBookings
      .filter((booking: Booking) => ['confirmed', 'pending'].includes(booking.status))
      .map((booking: Booking) => booking.propertyId)
  );

  const getProperty = (propertyId: string) => {
    return properties.find((p: Property) => p.id === propertyId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
      case 'completed': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const filteredBookings = ownerBookings.filter((booking: Booking) => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getProperty(booking.propertyId)?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (dateFilter === 'all') return true;
    
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'upcoming':
        return checkInDate >= today;
      case 'current':
        const checkOutDate = new Date(booking.checkOut);
        return checkInDate <= today && checkOutDate > today;
      case 'past':
        return checkInDate < today;
      default:
        return true;
    }
  });

  const stats = {
    totalBookings: ownerBookings.length,
    bookedUnits: bookedPropertyIds.size,
    totalUnits: ownerProperties.length,
    availableUnits: ownerProperties.length - bookedPropertyIds.size,
    totalRevenue: ownerBookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0),
    thisMonth: ownerBookings.filter((b: Booking) => {
      const bookingDate = new Date(b.bookedAt);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Bookings Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your property performance and manage reservations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalBookings}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
            <p className="text-xs text-green-600 mt-1">All time reservations</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{stats.bookedUnits}</span>
                <span className="text-sm text-gray-500">/{stats.totalUnits}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Booked Units</h3>
            <p className="text-xs text-emerald-600 mt-1">
              {((stats.bookedUnits / stats.totalUnits) * 100).toFixed(0)}% occupancy rate
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.availableUnits}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Available Units</h3>
            <p className="text-xs text-orange-600 mt-1">Ready for booking</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <p className="text-xs text-purple-600 mt-1">All time earnings</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings or properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Bookings</option>
                <option value="upcoming">Upcoming</option>
                <option value="current">Active Stays</option>
                <option value="past">Past Bookings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Bookings
              </h2>
              <span className="text-sm text-gray-500">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters'
                    : dateFilter === 'all' 
                      ? 'Your properties haven\'t received any bookings yet' 
                      : `No ${dateFilter} bookings found`
                  }
                </p>
              </div>
            ) : (
              filteredBookings.map((booking: Booking) => {
                const property = getProperty(booking.propertyId);
                const nights = calculateNights(booking.checkIn, booking.checkOut);
                const checkInDate = new Date(booking.checkIn);
                const checkOutDate = new Date(booking.checkOut);

                return (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      {/* Property Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={property?.images[0] || ''}
                          alt={property?.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {property?.title}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              {property?.address}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Guest</p>
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="font-medium text-gray-900 truncate">
                                {booking.customerName}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</p>
                          </div>

                          <div>
                            <p className="text-gray-500 mb-1">Check-in</p>
                            <p className="font-medium text-gray-900">
                              {checkInDate.toLocaleDateString('en-PH', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500 mb-1">Check-out</p>
                            <p className="font-medium text-gray-900">
                              {checkOutDate.toLocaleDateString('en-PH', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{nights} night{nights > 1 ? 's' : ''}</p>
                          </div>

                          <div>
                            <p className="text-gray-500 mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-gray-900">₱{booking.totalAmount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ₱{Math.round(booking.totalAmount / nights).toLocaleString()}/night
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Booked: {new Date(booking.bookedAt).toLocaleDateString('en-PH')}
                              {booking.walkInBooking && (
                                <span className="ml-2 inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Walk-in</span>
                                </span>
                              )}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.paymentStatus === 'paid' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Property Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Property Information</h4>
                  <div className="flex items-start space-x-4">
                    <img
                      src={getProperty(selectedBooking.propertyId)?.images[0] || ''}
                      alt={getProperty(selectedBooking.propertyId)?.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {getProperty(selectedBooking.propertyId)?.title}
                      </h5>
                      <p className="text-gray-600 text-sm flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {getProperty(selectedBooking.propertyId)?.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Guest and Stay Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Guest Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedBooking.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-medium text-gray-900">{selectedBooking.guests} guest{selectedBooking.guests > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Stay Details</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedBooking.checkIn).toLocaleDateString('en-PH', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedBooking.checkOut).toLocaleDateString('en-PH', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">
                          {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} night{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        ₱{Math.round(selectedBooking.totalAmount / calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)).toLocaleString()} × {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} night{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut) > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₱{selectedBooking.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                      <span className="font-semibold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₱{selectedBooking.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.paymentStatus === 'paid' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Timeline */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Booking Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Booked on</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedBooking.bookedAt).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitOwnerBookings;