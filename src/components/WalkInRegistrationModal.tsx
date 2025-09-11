import React, { useState } from 'react';
import { UserPlus, Calendar, Building, Save, X, User, Phone, Mail, CreditCard, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import BookingAvailabilityCalendar from './BookingAvailabilityCalendar';
import usersData from '../data/users.json';
import propertiesData from '../data/properties.json';
import bookingsData from '../data/bookings.json';
import { isPropertyLiveForCustomers, getDisplayRate } from '../utils/propertyCalculations';
import { calculateNights, calculateBookingTotal } from '../utils/calculations';
import { validateBookingDuration } from '../utils/calculations';
import { Property, Booking, User as UserType } from '../types';

interface WalkInRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: UserType, newBooking: Booking) => void;
}

interface WalkInData {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  
  // Booking Information
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  
  // Payment Information
  paymentMethod: string;
  notes: string;
}

const WalkInRegistrationModal: React.FC<WalkInRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useLocalStorage('users', usersData.users);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [bookings, setBookings] = useLocalStorage('bookings', bookingsData.bookings);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [walkInData, setWalkInData] = useState<WalkInData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idType: 'drivers_license',
    idNumber: '',
    address: '',
    propertyId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    paymentMethod: 'cash',
    notes: ''
  });

  // Get available properties for booking
  const availableProperties = properties.filter((p: Property) => 
    isPropertyLiveForCustomers(p)
  ) as Property[];

  const selectedProperty = availableProperties.find(p => p.id === walkInData.propertyId);

  // Get booked dates for selected property
  const getBookedDatesForProperty = (propertyId: string) => {
    const propertyBookings = bookings.filter(
      (b: Booking) => b.propertyId === propertyId && b.status === 'confirmed'
    );
    const bookedDates: string[] = [];

    propertyBookings.forEach((booking: Booking) => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);

      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        bookedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return bookedDates;
  };

  // Check if date range is available
  const isDateRangeAvailable = (checkInDate: string, checkOutDate: string) => {
    if (!walkInData.propertyId) return true;
    
    const propertyBookings = bookings.filter(
      (b: Booking) => b.propertyId === walkInData.propertyId && b.status === 'confirmed'
    );
    const requestStart = new Date(checkInDate);
    const requestEnd = new Date(checkOutDate);

    for (const booking of propertyBookings) {
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);

      if (
        (requestStart >= bookingStart && requestStart < bookingEnd) ||
        (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
        (requestStart <= bookingStart && requestEnd >= bookingEnd)
      ) {
        return false;
      }
    }
    return true;
  };

  const updateData = (field: keyof WalkInData, value: any) => {
    setWalkInData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(walkInData.firstName && walkInData.lastName && walkInData.email && walkInData.phone);
      case 2:
        return !!(walkInData.propertyId && walkInData.checkIn && walkInData.checkOut && walkInData.guests);
      case 3:
        return !!(walkInData.paymentMethod);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      alert('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user || user.role !== 'property_manager') return;
    
    setIsProcessing(true);

    try {
      // Validate booking availability
      if (!isDateRangeAvailable(walkInData.checkIn, walkInData.checkOut)) {
        throw new Error('Selected dates are not available');
      }

      // Validate booking duration if property has maximum stay
      if (selectedProperty?.maxStayDays) {
        const durationValidation = validateBookingDuration(
          walkInData.checkIn,
          walkInData.checkOut,
          selectedProperty.maxStayDays
        );
        if (!durationValidation.isValid) {
          throw new Error(durationValidation.error || 'Booking duration exceeds maximum allowed stay');
        }
      }

      // Check for duplicate email
      const existingUser = users.find((u: UserType) => u.email === walkInData.email);
      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Create new user
      const newUser: UserType = {
        id: `user-${Date.now()}`,
        email: walkInData.email,
        password: 'walkin123', // Default password for walk-in users
        role: 'customer',
        name: `${walkInData.firstName} ${walkInData.lastName}`,
        verified: true, // Auto-verify walk-in users
        createdAt: new Date().toISOString(),
        walkInRegistration: {
          registeredBy: user.id,
          registeredAt: new Date().toISOString(),
          idType: walkInData.idType,
          idNumber: walkInData.idNumber,
          address: walkInData.address,
          phone: walkInData.phone
        }
      };

      // Calculate booking total
      const nights = calculateNights(walkInData.checkIn, walkInData.checkOut);
      const rate = getDisplayRate(selectedProperty!);
      const calculation = calculateBookingTotal(rate, nights);

      // Create booking
      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        propertyId: walkInData.propertyId,
        customerId: newUser.id,
        checkIn: walkInData.checkIn,
        checkOut: walkInData.checkOut,
        guests: walkInData.guests,
        totalAmount: calculation.total,
        status: 'confirmed',
        paymentStatus: 'paid', // Walk-in bookings are paid immediately
        bookedAt: new Date().toISOString(),
        customerName: newUser.name,
        customerEmail: newUser.email,
        walkInBooking: {
          registeredBy: user.id,
          paymentMethod: walkInData.paymentMethod,
          notes: walkInData.notes
        }
      };

      // Save to localStorage
      setUsers([...users, newUser]);
      setBookings([...bookings, newBooking]);

      // Call success callback
      onSuccess(newUser, newBooking);
      
      // Reset form and close
      setWalkInData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idType: 'drivers_license',
        idNumber: '',
        address: '',
        propertyId: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
        paymentMethod: 'cash',
        notes: ''
      });
      setCurrentStep(1);
      onClose();

    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Customer Information</h3>
              <p className="text-gray-600">Enter the walk-in customer's details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={walkInData.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={walkInData.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={walkInData.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={walkInData.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type *
                </label>
                <select
                  value={walkInData.idType}
                  onChange={(e) => updateData('idType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="drivers_license">Driver's License</option>
                  <option value="passport">Passport</option>
                  <option value="state_id">State ID</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={walkInData.idNumber}
                  onChange={(e) => updateData('idNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter ID number"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={walkInData.address}
                  onChange={(e) => updateData('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter customer's address"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Property & Booking Details</h3>
              <p className="text-gray-600">Select property and booking dates</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property *
                </label>
                <select
                  value={walkInData.propertyId}
                  onChange={(e) => updateData('propertyId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a property...</option>
                  {availableProperties.map((property: Property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} - ${getDisplayRate(property)}/night
                    </option>
                  ))}
                </select>
              </div>

              {selectedProperty && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{selectedProperty.title}</h4>
                      <p className="text-gray-600 text-sm flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedProperty.address}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{selectedProperty.bedrooms} bed</span>
                        <span>{selectedProperty.bathrooms} bath</span>
                        <span>Max {selectedProperty.maxGuests} guests</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          ${getDisplayRate(selectedProperty)}/night
                        </span>
                        {selectedProperty.maxStayDisplay && (
                          <span className="ml-4 text-sm text-gray-600">
                            Max stay: {selectedProperty.maxStayDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={walkInData.checkIn}
                    onChange={(e) => updateData('checkIn', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={walkInData.checkOut}
                    onChange={(e) => updateData('checkOut', e.target.value)}
                    min={walkInData.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <select
                    value={walkInData.guests}
                    onChange={(e) => updateData('guests', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {selectedProperty ? 
                      Array.from({ length: selectedProperty.maxGuests }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      )) :
                      [1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {walkInData.propertyId && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Availability Calendar
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                    </button>
                  </div>

                  {showCalendar && (
                    <BookingAvailabilityCalendar
                      propertyId={walkInData.propertyId}
                      bookedDates={getBookedDatesForProperty(walkInData.propertyId)}
                      selectedCheckIn={walkInData.checkIn}
                      selectedCheckOut={walkInData.checkOut}
                      onDateSelect={(checkInDate, checkOutDate) => {
                        updateData('checkIn', checkInDate);
                        updateData('checkOut', checkOutDate);
                      }}
                      minNights={1}
                      maxStayDays={selectedProperty?.maxStayDays}
                      maxStayDisplay={selectedProperty?.maxStayDisplay}
                    />
                  )}
                </div>
              )}

              {/* Price Calculation */}
              {walkInData.checkIn && walkInData.checkOut && selectedProperty && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rate per night:</span>
                      <span>${getDisplayRate(selectedProperty)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of nights:</span>
                      <span>{calculateNights(walkInData.checkIn, walkInData.checkOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${getDisplayRate(selectedProperty) * calculateNights(walkInData.checkIn, walkInData.checkOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service fee (12%):</span>
                      <span>${Math.round(getDisplayRate(selectedProperty) * calculateNights(walkInData.checkIn, walkInData.checkOut) * 0.12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes (8%):</span>
                      <span>${Math.round(getDisplayRate(selectedProperty) * calculateNights(walkInData.checkIn, walkInData.checkOut) * 0.08)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-lg text-blue-600">
                        ${Math.round(getDisplayRate(selectedProperty) * calculateNights(walkInData.checkIn, walkInData.checkOut) * 1.2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Payment & Confirmation</h3>
              <p className="text-gray-600">Finalize the walk-in booking</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={walkInData.paymentMethod}
                  onChange={(e) => updateData('paymentMethod', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={walkInData.notes}
                  onChange={(e) => updateData('notes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any special requests or notes about this booking..."
                />
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{walkInData.firstName} {walkInData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{walkInData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{walkInData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{selectedProperty?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{new Date(walkInData.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{new Date(walkInData.checkOut).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{walkInData.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{walkInData.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  {selectedProperty && walkInData.checkIn && walkInData.checkOut && (
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${Math.round(getDisplayRate(selectedProperty) * calculateNights(walkInData.checkIn, walkInData.checkOut) * 1.2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Walk-in Registration Notice</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Customer will be registered with default password: "walkin123"</li>
                  <li>• Account will be automatically verified</li>
                  <li>• Customer can change password after first login</li>
                  <li>• Booking will be immediately confirmed as paid</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between text-white mb-4">
            <h1 className="text-2xl font-bold">Walk-in Registration & Booking</h1>
            <div className="flex items-center space-x-4">
              <span className="text-blue-100">Step {currentStep} of 3</span>
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
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
                  <span>← Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !validateStep(currentStep) || !isDateRangeAvailable(walkInData.checkIn, walkInData.checkOut)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Complete Registration & Booking</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInRegistrationModal;