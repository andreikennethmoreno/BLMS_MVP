/**
 * Customer Dashboard Component
 *
 * Main interface for customers to browse and book properties.
 *
 * Features:
 * - Property search with filters (location, dates, guests, type, timeline)
 * - Real-time availability checking
 * - Booking flow integration (browse -> select -> checkout -> success)
 * - Personal booking history display
 *
 * Data Flow:
 * 1. Loads approved properties from localStorage
 * 2. Filters properties based on search criteria and availability
 * 3. Handles booking flow: selection -> calendar -> checkout -> confirmation
 * 4. Updates bookings in localStorage when booking is completed
 *
 * State Management:
 * - Properties: Read from localStorage, filtered for customer visibility
 * - Bookings: Read/write to localStorage for booking history
 * - Search filters: Local component state
 * - Booking flow: Local state for current booking process
 */
import React, { useState } from "react";
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import ReviewSystem from "./ReviewSystem";
import propertiesData from "../data/properties.json";
import BookingAvailabilityCalendar from "./BookingAvailabilityCalendar";
import CheckoutPage from "./CheckoutPage";
import BookingSuccessPage from "./BookingSuccessPage";
import bookingsData from "../data/bookings.json";
import usersData from "../data/users.json";
import {
  isPropertyLiveForCustomers,
  getDisplayRate,
} from "../utils/propertyCalculations";
import { validateBookingDuration } from "../utils/calculations";
import { Property, Booking } from "../types";

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Data Management: Properties and bookings with real-time sync
  const [bookings] = useLocalStorage("bookings", bookingsData.bookings);
  const [properties] = useLocalStorage("properties", propertiesData.properties);

  // Cast persisted data to app types
  const bookingsTyped = bookings as unknown as Booking[];
  const propertiesTyped = properties as unknown as Property[];

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Booking Flow State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<any>(null);

  /**
   * Property Filtering Logic
   *
   * Only show properties that are:
   * 1. Approved by property manager
   * 2. Have accepted contracts
   * 3. Have final rates set
   */
  const approvedProperties: Property[] = propertiesTyped.filter((p) =>
    isPropertyLiveForCustomers(p)
  ) as unknown as Property[];
  const users = usersData.users;
  const customerBookings = bookingsTyped.filter(
    (b) => b.customerId === user?.id
  );

  /**
   * Property Classification
   *
   * Classify properties as short-term or long-term based on owner preference or rate
   * This helps customers filter by stay type preference
   */
  const getUnitType = (property: Property) => {
    // Use owner-specified rental type if available
    if (property.rentalType) {
      return property.rentalType;
    }

    // Fallback to rate-based classification
    const rate = getDisplayRate(property);
    return rate < 150 ? "short-term" : "long-term";
  };

  /**
   * Property Search and Filtering
   *
   * Applies multiple filters:
   * - Text search (title, address)
   * - Guest capacity validation
   * - Unit type (short/long-term)
   * - Timeline (when property was added)
   */
  const filteredProperties = approvedProperties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGuests = property.maxGuests >= guests;
    const matchesUnitType =
      unitTypeFilter === "all" || getUnitType(property) === unitTypeFilter;

    let matchesTimeline = true;
    if (timelineFilter !== "all") {
      const submittedDate = new Date(property.submittedAt);
      const now = new Date();
      const daysAgo = Math.floor(
        (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (timelineFilter) {
        case "week":
          matchesTimeline = daysAgo <= 7;
          break;
        case "month":
          matchesTimeline = daysAgo <= 30;
          break;
        case "quarter":
          matchesTimeline = daysAgo <= 90;
          break;
      }
    }

    return matchesSearch && matchesGuests && matchesUnitType && matchesTimeline;
  });

  /**
   * Property Sorting Logic
   *
   * Supports multiple sort criteria for better user experience
   */
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        );
      case "price-low":
        return (
          (a.finalRate || a.proposedRate) - (b.finalRate || b.proposedRate)
        );
      case "price-high":
        return (
          (b.finalRate || b.proposedRate) - (a.finalRate || a.proposedRate)
        );
      default:
        return 0;
    }
  });

  const getOwnerName = (ownerId: string) => {
    const owner = users.find((u) => u.id === ownerId);
    return owner?.name || "Unknown Owner";
  };

  const calculateNights = (checkInDate: string, checkOutDate: string) => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  /**
   * Availability Checking
   *
   * Process:
   * 1. Get all confirmed bookings for property
   * 2. Check if requested dates overlap with existing bookings
   * 3. Return availability status
   */
  const getPropertyBookings = (propertyId: string) => {
    return bookingsTyped.filter(
      (b) => b.propertyId === propertyId && b.status === "confirmed"
    );
  };

  const getBookedDatesForProperty = (propertyId: string) => {
    const propertyBookings = getPropertyBookings(propertyId);
    const bookedDates: string[] = [];

    propertyBookings.forEach((booking: Booking) => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);

      // Add all dates from check-in to check-out (exclusive of check-out)
      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        bookedDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return bookedDates;
  };

  const isDateRangeAvailable = (
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ) => {
    const propertyBookings = getPropertyBookings(propertyId);
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

  /**
   * Booking Validation
   *
   * Validates booking request before proceeding to checkout:
   * 1. Ensures dates are selected
   * 2. Validates date order (checkout after checkin)
   * 3. Checks property availability for selected dates
   * 4. Validates booking duration against property maximum stay
   */
  const handleBookProperty = (property: Property) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("Check-out date must be after check-in date");
      return;
    }

    if (!isDateRangeAvailable(property.id, checkIn, checkOut)) {
      alert("This property is not available for the selected dates");
      return;
    }

    // Validate against maximum stay if specified
    if (property.maxStayDays) {
      const durationValidation = validateBookingDuration(
        checkIn,
        checkOut,
        property.maxStayDays
      );
      if (!durationValidation.isValid) {
        alert(
          durationValidation.error ||
            "Booking duration exceeds maximum allowed stay"
        );
        return;
      }
    }

    // Proceed to checkout flow
    setShowCheckout(true);
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "parking":
      case "car":
        return <Car className="w-4 h-4" />;
      case "kitchen":
        return <Utensils className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const nextImage = () => {
    if (selectedProperty) {
      setCurrentImageIndex((prev) =>
        prev === selectedProperty.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProperty) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedProperty.images.length - 1 : prev - 1
      );
    }
  };

  /**
   * Booking Completion Handler
   *
   * Called when checkout process is completed successfully.
   * Calculates final booking details and transitions to success page.
   */
  const handleBookingComplete = () => {
    const nights = calculateNights(checkIn, checkOut);
    const rate =
      selectedProperty?.finalRate || selectedProperty?.proposedRate || 0;
    const subtotal = rate * nights;
    const serviceFee = Math.round(subtotal * 0.12);
    const taxes = Math.round(subtotal * 0.08);
    const total = subtotal + serviceFee + taxes;

    const bookingDetails = {
      id: `booking-${Date.now()}`,
      propertyTitle: selectedProperty?.title || "",
      propertyAddress: selectedProperty?.address || "",
      checkIn,
      checkOut,
      guests,
      totalAmount: total,
    };

    setCompletedBooking(bookingDetails);
    setShowCheckout(false);
    setShowSuccess(true);
    setSelectedProperty(null);
  };

  /**
   * Booking Flow Routing
   *
   * Handles transitions between different stages of the booking process
   */
  if (showCheckout && selectedProperty) {
    return (
      <CheckoutPage
        property={selectedProperty}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        onBack={() => setShowCheckout(false)}
        onComplete={handleBookingComplete}
      />
    );
  }

  if (showSuccess && completedBooking) {
    return (
      <BookingSuccessPage
        booking={completedBooking}
        onContinue={() => {
          setShowSuccess(false);
          setCompletedBooking(null);
          setCheckIn("");
          setCheckOut("");
          setGuests(1);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Find Your Perfect Stay
        </h1>
        <p className="text-gray-600 mt-2">
          Discover amazing properties for your next trip
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Location
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter city or property name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} Guest{num > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Unit Type
            </label>
            <select
              value={unitTypeFilter}
              onChange={(e) => setUnitTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="short-term">Short-term (&lt;$150/night)</option>
              <option value="long-term">Long-term ($150+/night)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Timeline
            </label>
            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>

        {/* Sort and Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {sortedProperties.length} properties found
          </div>
        </div>
      </div>

      {/* Customer's Booking History */}
      {customerBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">My Bookings</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customerBookings.map((booking: Booking) => {
                const property = approvedProperties.find(
                  (p: Property) => p.id === booking.propertyId
                );
                return (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={property?.images[0] || ""}
                        alt={property?.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {property?.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {property?.address}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                            {new Date(booking.checkOut).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-purple-600">
                            ${booking.totalAmount}
                          </span>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Available Properties Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProperties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No properties found matching your criteria
            </p>
          </div>
        ) : (
          sortedProperties.map((property) => {
            const nights =
              checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
            const isAvailable =
              !checkIn ||
              !checkOut ||
              isDateRangeAvailable(property.id, checkIn, checkOut);
            const unitType = getUnitType(property);

            return (
              <div
                key={property.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        unitType === "short-term"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {unitType === "short-term" ? "Short-term" : "Long-term"}
                    </span>
                  </div>
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                        Not Available
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>
                      {property.bedrooms} bed • {property.bathrooms} bath
                    </span>
                    <span>Max {property.maxGuests} guests</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">
                        ${getDisplayRate(property)}
                      </span>
                      <span className="text-gray-500 text-sm">/night</span>
                      {checkIn && checkOut && (
                        <div className="text-sm text-gray-600">
                          Total: ${getDisplayRate(property) * nights} ({nights}{" "}
                          nights)
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProperty(property);
                        setCurrentImageIndex(0);
                      }}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isAvailable
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={!isAvailable}
                    >
                      {isAvailable ? "Book Now" : "Unavailable"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Property Details Modal - Shows full property information and booking interface */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header with Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Property Image Gallery with Navigation */}
              <div className="relative mb-6">
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <img
                    src={selectedProperty.images[currentImageIndex]}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedProperty.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {selectedProperty.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? "bg-white"
                                : "bg-white bg-opacity-50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Property Information and Booking Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedProperty.title}
                  </h2>
                  <p className="text-gray-600 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {selectedProperty.address}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedProperty.bedrooms}
                      </div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedProperty.bathrooms}
                      </div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedProperty.maxGuests}
                      </div>
                      <div className="text-sm text-gray-600">Max Guests</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600">
                      {selectedProperty.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-gray-700"
                        >
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Host
                    </h3>
                    <p className="text-gray-600">
                      {getOwnerName(selectedProperty.ownerId)}
                    </p>
                  </div>

                  {/* Maximum Stay Information */}
                  {selectedProperty.maxStayDisplay && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Stay Limits
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">
                              Maximum Allowed Stay
                            </p>
                            <p className="text-blue-800">
                              {selectedProperty.maxStayDisplay}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedProperty.termClassification ===
                              "short-term"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {selectedProperty.termClassification ===
                            "short-term"
                              ? "Short-term"
                              : "Long-term"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Property Reviews and Ratings */}
                  <div className="mb-6">
                    <ReviewSystem
                      propertyId={selectedProperty.id}
                      showAddReview={true}
                    />
                  </div>
                </div>

                {/* Booking Interface Panel */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-purple-600">
                        ${getDisplayRate(selectedProperty)}
                      </span>
                      <span className="text-gray-600">/ night</span>
                      {selectedProperty.baseRate &&
                        selectedProperty.commissionPercentage && (
                          <div className="text-sm text-gray-500">
                            (Base: ${selectedProperty.baseRate} +{" "}
                            {selectedProperty.commissionPercentage}%)
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Date Selection Interface */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Dates
                      </label>
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        {showCalendar ? "Hide Calendar" : "Show Calendar"}
                      </button>
                    </div>

                    {showCalendar ? (
                      /* Interactive Calendar for Date Selection */
                      <BookingAvailabilityCalendar
                        propertyId={selectedProperty.id}
                        bookedDates={getBookedDatesForProperty(
                          selectedProperty.id
                        )}
                        selectedCheckIn={checkIn}
                        selectedCheckOut={checkOut}
                        onDateSelect={(checkInDate, checkOutDate) => {
                          setCheckIn(checkInDate);
                          setCheckOut(checkOutDate);
                        }}
                        minNights={1}
                        maxStayDays={selectedProperty.maxStayDays}
                        maxStayDisplay={selectedProperty.maxStayDisplay}
                      />
                    ) : (
                      /* Simple Date Input Fields */
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in
                          </label>
                          <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-out
                          </label>
                          <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            min={
                              checkIn || new Date().toISOString().split("T")[0]
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Guest Selection */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guests
                      </label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {Array.from(
                          { length: selectedProperty.maxGuests },
                          (_, i) => i + 1
                        ).map((num) => (
                          <option key={num} value={num}>
                            {num} Guest{num > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price Calculation Display */}
                  {checkIn && checkOut && (
                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">
                          ${getDisplayRate(selectedProperty)} ×{" "}
                          {calculateNights(checkIn, checkOut)} nights
                        </span>
                        <span className="text-gray-900">
                          $
                          {getDisplayRate(selectedProperty) *
                            calculateNights(checkIn, checkOut)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>
                          $
                          {getDisplayRate(selectedProperty) *
                            calculateNights(checkIn, checkOut)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Booking Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleBookProperty(selectedProperty)}
                      disabled={
                        !checkIn ||
                        !checkOut ||
                        !isDateRangeAvailable(
                          selectedProperty.id,
                          checkIn,
                          checkOut
                        )
                      }
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      {checkIn && checkOut
                        ? isDateRangeAvailable(
                            selectedProperty.id,
                            checkIn,
                            checkOut
                          )
                          ? (() => {
                              // Check maximum stay validation
                              if (selectedProperty.maxStayDays) {
                                const durationValidation =
                                  validateBookingDuration(
                                    checkIn,
                                    checkOut,
                                    selectedProperty.maxStayDays
                                  );
                                if (!durationValidation.isValid) {
                                  return `Exceeds ${selectedProperty.maxStayDisplay} limit`;
                                }
                              }
                              return "Proceed to Checkout";
                            })()
                          : "Not Available for Selected Dates"
                        : "Select Dates to Book"}
                    </button>
                    <button
                      onClick={() => setSelectedProperty(null)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
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

export default CustomerDashboard;
