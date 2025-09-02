import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import { Filter, Users, DollarSign, Building, Eye, X, MapPin, User, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

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
  address: string;
  images: string[];
  finalRate: number | null;
  proposedRate: number;
  status: string;
}

interface CalendarEvent extends Event {
  id: string;
  bookingId: string;
  propertyId: string;
  ownerId: string;
  ownerName: string;
  propertyTitle: string;
  customerName: string;
  guests: number;
  totalAmount: number;
  status: string;
  color: string;
}

interface BookingFilters {
  ownerId: string;
  propertyId: string;
  minPrice: number;
  maxPrice: number;
  minGuests: number;
  maxGuests: number;
  status: string;
}

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({
    ownerId: '',
    propertyId: '',
    minPrice: 0,
    maxPrice: 10000,
    minGuests: 1,
    maxGuests: 20,
    status: 'all'
  });

  const users = usersData.users;
  const unitOwners = users.filter(u => u.role === 'unit_owner');

  // Color palette for different owners
  const ownerColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const getOwnerColor = (ownerId: string) => {
    const index = unitOwners.findIndex(owner => owner.id === ownerId);
    return ownerColors[index % ownerColors.length];
  };

  const getOwnerName = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || 'Unknown Owner';
  };

  const getProperty = (propertyId: string) => {
    return properties.find((p: Property) => p.id === propertyId);
  };

  // Filter bookings based on user role
  const getFilteredBookings = () => {
    let filteredBookings = bookings;

    // Role-based filtering
    if (user?.role === 'unit_owner') {
      const ownerProperties = properties.filter((p: Property) => p.ownerId === user.id);
      filteredBookings = bookings.filter((booking: Booking) =>
        ownerProperties.some((prop: Property) => prop.id === booking.propertyId)
      );
    }

    // Apply additional filters
    return filteredBookings.filter((booking: Booking) => {
      const property = getProperty(booking.propertyId);
      if (!property) return false;

      const matchesOwner = !filters.ownerId || property.ownerId === filters.ownerId;
      const matchesProperty = !filters.propertyId || booking.propertyId === filters.propertyId;
      const matchesPrice = booking.totalAmount >= filters.minPrice && booking.totalAmount <= filters.maxPrice;
      const matchesGuests = booking.guests >= filters.minGuests && booking.guests <= filters.maxGuests;
      const matchesStatus = filters.status === 'all' || booking.status === filters.status;

      return matchesOwner && matchesProperty && matchesPrice && matchesGuests && matchesStatus;
    });
  };

  // Convert bookings to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const filteredBookings = getFilteredBookings();
    
    return filteredBookings.map((booking: Booking) => {
      const property = getProperty(booking.propertyId);
      const ownerColor = getOwnerColor(property?.ownerId || '');
      
      return {
        id: `event-${booking.id}`,
        bookingId: booking.id,
        propertyId: booking.propertyId,
        ownerId: property?.ownerId || '',
        ownerName: getOwnerName(property?.ownerId || ''),
        propertyTitle: property?.title || 'Unknown Property',
        customerName: booking.customerName,
        guests: booking.guests,
        totalAmount: booking.totalAmount,
        status: booking.status,
        color: ownerColor,
        title: `${property?.title} - ${booking.customerName}`,
        start: new Date(booking.checkIn),
        end: new Date(booking.checkOut),
        resource: booking
      };
    });
  }, [bookings, properties, filters, user]);

  // Get available properties for filtering
  const getAvailableProperties = () => {
    if (user?.role === 'unit_owner') {
      return properties.filter((p: Property) => p.ownerId === user.id);
    }
    return properties;
  };

  const availableProperties = getAvailableProperties();

  // Custom event style function
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="text-xs font-medium truncate">
      <div>{event.propertyTitle}</div>
      <div className="opacity-90">{event.customerName}</div>
      <div className="opacity-75">{event.guests} guests • ${event.totalAmount}</div>
    </div>
  );

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const resetFilters = () => {
    setFilters({
      ownerId: '',
      propertyId: '',
      minPrice: 0,
      maxPrice: 10000,
      minGuests: 1,
      maxGuests: 20,
      status: 'all'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'property_manager' ? 'All Bookings Calendar' : 'My Bookings Calendar'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'property_manager' 
              ? 'View all bookings across all properties and owners'
              : 'View bookings for your properties'
            }
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{calendarEvents.length}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${calendarEvents.reduce((sum, event) => sum + event.totalAmount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Properties</p>
              <p className="text-3xl font-bold text-purple-600">
                {new Set(calendarEvents.map(event => event.propertyId)).size}
              </p>
            </div>
            <Building className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guests</p>
              <p className="text-3xl font-bold text-orange-600">
                {calendarEvents.reduce((sum, event) => sum + event.guests, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filter Bookings</h3>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {user?.role === 'property_manager' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Owner
                </label>
                <select
                  value={filters.ownerId}
                  onChange={(e) => setFilters(prev => ({ ...prev, ownerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Owners</option>
                  {unitOwners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property
              </label>
              <select
                value={filters.propertyId}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Properties</option>
                {availableProperties.map((property: Property) => (
                  <option key={property.id} value={property.id}>{property.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guests Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.minGuests}
                  onChange={(e) => setFilters(prev => ({ ...prev, minGuests: Number(e.target.value) }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={filters.maxGuests}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxGuests: Number(e.target.value) }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Owner Legend (for Property Managers) */}
      {user?.role === 'property_manager' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Color Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {unitOwners.map((owner, index) => (
              <div key={owner.id} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: ownerColors[index % ownerColors.length] }}
                />
                <span className="text-sm text-gray-700">{owner.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="calendar-container" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent
            }}
            onSelectEvent={handleSelectEvent}
            popup
            showMultiDayTimes
            step={60}
            showAllEvents
            views={['month', 'week', 'day']}
            formats={{
              eventTimeRangeFormat: () => '',
              agendaTimeRangeFormat: () => '',
            }}
          />
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Property Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h4>
                  <div className="flex items-start space-x-4">
                    <img
                      src={getProperty(selectedEvent.propertyId)?.images[0] || ''}
                      alt={selectedEvent.propertyTitle}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="font-medium text-gray-900">{selectedEvent.propertyTitle}</h5>
                      <p className="text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {getProperty(selectedEvent.propertyId)?.address}
                      </p>
                      {user?.role === 'property_manager' && (
                        <p className="text-sm text-gray-500">
                          Owner: {selectedEvent.ownerName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guest Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Guest Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Guest Name</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {selectedEvent.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Guests</p>
                      <p className="font-medium text-gray-900">{selectedEvent.guests}</p>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Stay Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Check-in Date</p>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.start.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out Date</p>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.end.toLocaleDateString('en-US', {
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
                        {calculateNights(selectedEvent.start.toISOString(), selectedEvent.end.toISOString())} nights
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${selectedEvent.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Rate per Night</span>
                      <span className="font-medium text-gray-900">
                        ${Math.round(selectedEvent.totalAmount / calculateNights(selectedEvent.start.toISOString(), selectedEvent.end.toISOString()))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner Info (for Property Managers) */}
                {user?.role === 'property_manager' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Owner Information</h4>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: selectedEvent.color }}
                      />
                      <span className="font-medium text-gray-900">{selectedEvent.ownerName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;