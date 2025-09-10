import React, { useState } from "react";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Utensils,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import TopNavigation from "./layout/TopNavigation";
import propertiesData from "../data/properties.json";
import reviewsData from "../data/reviews.json";
import bookingsData from "../data/bookings.json";
import usersData from "../data/users.json";
import BookingAvailabilityCalendar from "./BookingAvailabilityCalendar";
import CheckoutPage from "./CheckoutPage";
import BookingSuccessPage from "./BookingSuccessPage";
import ReviewSystem from "./ReviewSystem";
import {
  isPropertyLiveForCustomers,
  getDisplayRate,
} from "../utils/propertyCalculations";
import {
  validateBookingDuration,
  calculateNights,
} from "../utils/calculations";
import { Property, Booking } from "../types";

interface ListingDetailsPageProps {
  propertyId: string;
  onBack: () => void;
  onBookingAttempt: () => boolean;
  onLogin: () => void;
  isAuthenticated: boolean;
  user: any;
}

const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({
  propertyId,
  onBack,
  onBookingAttempt,
  onLogin,
  isAuthenticated,
  user,
}) => {
  const [properties] = useLocalStorage("properties", propertiesData.properties);
  const [bookings] = useLocalStorage("bookings", bookingsData.bookings);
  const [reviews] = useLocalStorage("reviews", reviewsData.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<any>(null);

  const users = usersData.users;
  const property = properties.find(
    (p: Property) => p.id === propertyId
  ) as Property;

  if (!property || !isPropertyLiveForCustomers(property)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The property you're looking for is not available.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const propertyReviews = reviews.filter(
    (r: any) => r.propertyId === propertyId
  );
  const averageRating =
    propertyReviews.length > 0
      ? propertyReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        propertyReviews.length
      : 0;

  const owner = users.find((u: any) => u.id === property.ownerId);

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

  const getBookedDatesForProperty = (propertyId: string) => {
    const propertyBookings = bookings.filter(
      (b: Booking) => b.propertyId === propertyId && b.status === "confirmed"
    );
    const bookedDates: string[] = [];

    propertyBookings.forEach((booking: Booking) => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);

      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        bookedDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return bookedDates;
  };

  const isDateRangeAvailable = (checkInDate: string, checkOutDate: string) => {
    const propertyBookings = bookings.filter(
      (b: Booking) => b.propertyId === propertyId && b.status === "confirmed"
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

  const handleBookProperty = () => {
    if (!onBookingAttempt()) {
      return; // User not authenticated, login modal will show
    }

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("Check-out date must be after check-in date");
      return;
    }

    if (!isDateRangeAvailable(checkIn, checkOut)) {
      alert("This property is not available for the selected dates");
      return;
    }

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

    setShowCheckout(true);
  };

  const handleBookingComplete = () => {
    const nights = calculateNights(checkIn, checkOut);
    const rate = getDisplayRate(property);
    const subtotal = rate * nights;
    const serviceFee = Math.round(subtotal * 0.12);
    const taxes = Math.round(subtotal * 0.08);
    const total = subtotal + serviceFee + taxes;

    const bookingDetails = {
      id: `booking-${Date.now()}`,
      propertyTitle: property.title,
      propertyAddress: property.address,
      checkIn,
      checkOut,
      guests,
      totalAmount: total,
    };

    setCompletedBooking(bookingDetails);
    setShowCheckout(false);
    setShowSuccess(true);
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="w-5 h-5" />;
      case "parking":
      case "car":
        return <Car className="w-5 h-5" />;
      case "kitchen":
        return <Utensils className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  // Handle booking flow routing
  if (showCheckout) {
    return (
      <CheckoutPage
        property={property}
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
          onBack();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
     

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Images Gallery */}
        <div className="mb-8">
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden">
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />

            {/* Image Navigation */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {property.title}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <p className="text-gray-600 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {property.address}
                </p>
                {averageRating > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-900">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({propertyReviews.length} review
                      {propertyReviews.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
              </div>

              {/* Property Specs */}
              <div className="flex items-center space-x-6 text-gray-600">
                <span className="flex items-center">
                  <Bed className="w-5 h-5 mr-2" />
                  {property.bedrooms} bedroom{property.bedrooms > 1 ? "s" : ""}
                </span>
                <span className="flex items-center">
                  <Bath className="w-5 h-5 mr-2" />
                  {property.bathrooms} bathroom
                  {property.bathrooms > 1 ? "s" : ""}
                </span>
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Up to {property.maxGuests} guests
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About this place
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What this place offers
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 text-gray-700"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Meet your host
              </h2>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {owner?.name?.charAt(0) || "H"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {owner?.name || "Host"}
                  </h3>
                  <p className="text-gray-600">Property Owner</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Verified Host
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Maximum Stay Information */}
            {property.maxStayDisplay && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Stay Duration
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">
                      Maximum Allowed Stay
                    </p>
                    <p className="text-blue-800">{property.maxStayDisplay}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.termClassification === "short-term"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {property.termClassification === "short-term"
                      ? "Short-term"
                      : "Long-term"}
                  </span>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <ReviewSystem
                propertyId={propertyId}
                showAddReview={isAuthenticated && user?.role === "customer"}
              />
            </div>
          </div>

          {/* Booking Panel - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-3xl font-bold text-blue-600">
                    ${getDisplayRate(property)}
                  </span>
                  <span className="text-gray-600">/ night</span>
                </div>
                {property.baseRate && property.commissionPercentage && (
                  <div className="text-sm text-gray-500">
                    Base rate: ${property.baseRate} +{" "}
                    {property.commissionPercentage}% commission
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="space-y-4 mb-6">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from(
                      { length: property.maxGuests },
                      (_, i) => i + 1
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num} Guest{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {showCalendar ? "Hide Calendar" : "Show Calendar"}
                  </span>
                </button>
              </div>

              {/* Calendar */}
              {showCalendar && (
                <div className="mb-6">
                  <BookingAvailabilityCalendar
                    propertyId={propertyId}
                    bookedDates={getBookedDatesForProperty(propertyId)}
                    selectedCheckIn={checkIn}
                    selectedCheckOut={checkOut}
                    onDateSelect={(checkInDate, checkOutDate) => {
                      setCheckIn(checkInDate);
                      setCheckOut(checkOutDate);
                    }}
                    minNights={1}
                    maxStayDays={property.maxStayDays}
                    maxStayDisplay={property.maxStayDisplay}
                  />
                </div>
              )}

              {/* Price Calculation */}
              {checkIn && checkOut && (
                <div className="border-t pt-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        ${getDisplayRate(property)} ×{" "}
                        {calculateNights(checkIn, checkOut)} nights
                      </span>
                      <span className="text-gray-900">
                        $
                        {getDisplayRate(property) *
                          calculateNights(checkIn, checkOut)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="text-gray-900">
                        $
                        {Math.round(
                          getDisplayRate(property) *
                            calculateNights(checkIn, checkOut) *
                            0.12
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes</span>
                      <span className="text-gray-900">
                        $
                        {Math.round(
                          getDisplayRate(property) *
                            calculateNights(checkIn, checkOut) *
                            0.08
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          $
                          {Math.round(
                            getDisplayRate(property) *
                              calculateNights(checkIn, checkOut) *
                              1.2
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookProperty}
                disabled={
                  !checkIn ||
                  !checkOut ||
                  !isDateRangeAvailable(checkIn, checkOut)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
              >
                {!isAuthenticated
                  ? "Login to Book"
                  : checkIn && checkOut
                  ? isDateRangeAvailable(checkIn, checkOut)
                    ? "Reserve Now"
                    : "Not Available for Selected Dates"
                  : "Select Dates to Book"}
              </button>

              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Login required to make a booking
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-500">
                You won't be charged yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;
