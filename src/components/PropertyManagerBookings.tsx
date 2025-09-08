import React, { useState } from 'react';
import { Calendar, Search, Filter, MapPin, User, DollarSign, Clock, CheckCircle } from 'lucide-react';
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

const PropertyManagerBookings: React.FC = () => {
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const users = usersData.users;

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

  const filteredBookings = bookings.filter((booking: Booking) => {
    const property = getProperty(booking.propertyId);
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property?.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          matchesDate = checkInDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDate = checkInDate >= today && checkInDate <= weekFromNow;
          break;
        case 'this_month':
          matchesDate = checkInDate.getMonth() === today.getMonth() && 
                       checkInDate.getFullYear() === today.getFullYear();
          break;
        case 'past':
          matchesDate = checkInDate < today;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b: Booking) => b.status === 'confirmed').length,
    pending: bookings.filter((b: Booking) => b.status === 'pending').length,
    totalRevenue: bookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all property bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Bookings
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, property, or location"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="past">Past Bookings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Bookings ({filteredBookings.length})
          </h2>
        </div>

        <div className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking: Booking) => {
                const property = getProperty(booking.propertyId);
                const owner = property ? getOwner(property.ownerId) : null;
                const nights = calculateNights(booking.checkIn, booking.checkOut);

                return (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <img
                            src={property?.images[0] || ''}
                            alt={property?.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{property?.title}</h3>
                                <p className="text-gray-600 flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {property?.address}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Owner: {owner?.name || 'Unknown'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="font-medium text-gray-900 flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {booking.customerName}
                                </p>
                                <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">Check-in / Check-out</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(booking.checkIn).toLocaleDateString()}
                                </p>
                                <p className="font-medium text-gray-900">
                                  {new Date(booking.checkOut).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">{nights} nights</p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">Guests</p>
                                <p className="font-medium text-gray-900">{booking.guests}</p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold text-emerald-600">${booking.totalAmount}</p>
                                <p className="text-sm text-gray-600">
                                  ${Math.round(booking.totalAmount / nights)}/night
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <div className="text-sm text-gray-500">
                                Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.paymentStatus === 'paid' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  Payment: {booking.paymentStatus}
                                </span>
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
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
                <h3 className="text-2xl font-semibold text-gray-900">Booking Details</h3>
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h4>
                  <div className="flex items-start space-x-4">
                    <img
                      src={getProperty(selectedBooking.propertyId)?.images[0] || ''}
                      alt={getProperty(selectedBooking.propertyId)?.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {getProperty(selectedBooking.propertyId)?.title}
                      </h5>
                      <p className="text-gray-600">
                        {getProperty(selectedBooking.propertyId)?.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        Owner: {getOwner(getProperty(selectedBooking.propertyId)?.ownerId)?.name}
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
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedBooking.customerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Check-in Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedBooking.checkIn).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedBooking.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Guests</p>
                      <p className="font-medium text-gray-900">{selectedBooking.guests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Nights</p>
                      <p className="font-medium text-gray-900">
                        {calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ${selectedBooking.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.paymentStatus === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Booking Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Timeline */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Booking Timeline</h4>
                  <div className="text-sm text-gray-600">
                    <p>Booking created: {new Date(selectedBooking.bookedAt).toLocaleString()}</p>
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

export default PropertyManagerBookings;