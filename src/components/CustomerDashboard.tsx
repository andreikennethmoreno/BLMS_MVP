import React, { useState } from 'react';
import { Search, Calendar, Users, MapPin, Wifi, Car, Utensils, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ReviewSystem from './ReviewSystem';
import propertiesData from '../data/properties.json';
import BookingAvailabilityCalendar from './BookingAvailabilityCalendar';
import bookingsData from '../data/bookings.json';
import usersData from '../data/users.json';

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

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const properties = propertiesData.properties.filter((p: Property) => p.status === 'approved');
  const users = usersData.users;
  const customerBookings = bookings.filter((b: Booking) => b.customerId === user?.id);

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGuests = property.maxGuests >= guests;
    
    return matchesSearch && matchesGuests;
  });

  const getOwnerName = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || 'Unknown Owner';
  };

  const calculateNights = (checkInDate: string, checkOutDate: string) => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getPropertyBookings = (propertyId: string) => {
    return bookings.filter((b: Booking) => b.propertyId === propertyId && b.status === 'confirmed');
  };

  const getBookedDatesForProperty = (propertyId: string) => {
    const propertyBookings = getPropertyBookings(propertyId);
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

  const isDateRangeAvailable = (propertyId: string, checkInDate: string, checkOutDate: string) => {
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

  const handleBookProperty = (property: Property) => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    if (!isDateRangeAvailable(property.id, checkIn, checkOut)) {
      alert('This property is not available for the selected dates');
      return;
    }

    const nights = calculateNights(checkIn, checkOut);
    const totalAmount = nights * (property.finalRate || property.proposedRate);

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      propertyId: property.id,
      customerId: user?.id || '',
      checkIn,
      checkOut,
      guests,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid',
      bookedAt: new Date().toISOString(),
      customerName: user?.name || '',
      customerEmail: user?.email || ''
    };

    setBookings([...bookings, newBooking]);
    setSelectedProperty(null);
    alert('Booking confirmed! Check your bookings section for details.');
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'parking':
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'kitchen':
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Your Perfect Stay</h1>
        <p className="text-muted-foreground mt-2">
          Discover amazing properties for your next trip
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="flex items-center">
                <Search className="w-4 h-4 mr-1" />
                Search Location
              </Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter city or property name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="checkin" className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Check-in
              </Label>
              <Input
                id="checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="checkout" className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Check-out
              </Label>
              <Input
                id="checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Guests
              </Label>
              <Select value={guests.toString()} onValueChange={(value) => setGuests(Number(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Guest{num > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Bookings Section */}
      {customerBookings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customerBookings.map((booking: Booking) => {
                const property = properties.find(
                  (p: Property) => p.id === booking.propertyId
                );
                return (
                  <Card key={booking.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={property?.images[0] || ""}
                          alt={property?.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{property?.title}</h3>
                          <p className="text-sm text-muted-foreground">{property?.address}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                              {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                            <Badge variant="secondary">${booking.totalAmount}</Badge>
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No properties found matching your criteria
            </p>
          </div>
        ) : (
          filteredProperties.map((property: Property) => {
            const rate = property.finalRate || property.proposedRate;
            const nights =
              checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
            const isAvailable =
              !checkIn ||
              !checkOut ||
              isDateRangeAvailable(property.id, checkIn, checkOut);

            return (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive">Not Available</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <CardTitle className="text-lg mb-2">{property.title}</CardTitle>
                  <CardDescription className="flex items-center mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </CardDescription>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>
                      {property.bedrooms} bed • {property.bathrooms} bath
                    </span>
                    <span>Max {property.maxGuests} guests</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">${rate}</span>
                      <span className="text-muted-foreground text-sm">/night</span>
                      {checkIn && checkOut && (
                        <div className="text-sm text-muted-foreground">
                          Total: ${rate * nights} ({nights} nights)
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedProperty(property);
                        setCurrentImageIndex(0);
                      }}
                      disabled={!isAvailable}
                    >
                      {isAvailable ? "Book Now" : "Unavailable"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Property Details Modal */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProperty.title}</DialogTitle>
                <DialogDescription>{selectedProperty.address}</DialogDescription>
              </DialogHeader>

              {/* Image Gallery */}
              <div className="relative mb-6">
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <img
                    src={selectedProperty.images[currentImageIndex]}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedProperty.images.length > 1 && (
                    <>
                      <Button
                        onClick={prevImage}
                        variant="secondary"
                        size="sm"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={nextImage}
                        variant="secondary"
                        size="sm"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {selectedProperty.images.map((_, index) => (
                          <Button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            variant={index === currentImageIndex ? "default" : "secondary"}
                            size="sm"
                            className="w-2 h-2 rounded-full p-0"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedProperty.bedrooms}
                      </div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedProperty.bathrooms}
                      </div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedProperty.maxGuests}
                      </div>
                      <div className="text-sm text-muted-foreground">Max Guests</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground">{selectedProperty.description}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Host</h3>
                    <p className="text-muted-foreground">
                      {getOwnerName(selectedProperty.ownerId)}
                    </p>
                  </div>

                  {/* Reviews Section */}
                  <div className="mb-6">
                    <ReviewSystem
                      propertyId={selectedProperty.id}
                      showAddReview={true}
                    />
                  </div>
                </div>

                {/* Booking Panel */}
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold">
                          ${selectedProperty.finalRate || selectedProperty.proposedRate}
                        </span>
                        <span className="text-muted-foreground">/ night</span>
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <Label>Select Dates</Label>
                        <Button
                          onClick={() => setShowCalendar(!showCalendar)}
                          variant="outline"
                          size="sm"
                        >
                          {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                        </Button>
                      </div>

                      {showCalendar ? (
                        <BookingAvailabilityCalendar
                          propertyId={selectedProperty.id}
                          bookedDates={getBookedDatesForProperty(selectedProperty.id)}
                          selectedCheckIn={checkIn}
                          selectedCheckOut={checkOut}
                          onDateSelect={(checkInDate, checkOutDate) => {
                            setCheckIn(checkInDate);
                            setCheckOut(checkOutDate);
                          }}
                          minNights={1}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="modal-checkin">Check-in</Label>
                            <Input
                              id="modal-checkin"
                              type="date"
                              value={checkIn}
                              onChange={(e) => setCheckIn(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div>
                            <Label htmlFor="modal-checkout">Check-out</Label>
                            <Input
                              id="modal-checkout"
                              type="date"
                              value={checkOut}
                              onChange={(e) => setCheckOut(e.target.value)}
                              min={checkIn || new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <Label>Guests</Label>
                      <Select value={guests.toString()} onValueChange={(value) => setGuests(Number(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: selectedProperty.maxGuests }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Guest{num > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {checkIn && checkOut && (
                      <Card className="mb-6">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">
                              ${selectedProperty.finalRate || selectedProperty.proposedRate} × {calculateNights(checkIn, checkOut)} nights
                            </span>
                            <span>
                              ${(selectedProperty.finalRate || selectedProperty.proposedRate) * calculateNights(checkIn, checkOut)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                            <span>Total</span>
                            <span>
                              ${(selectedProperty.finalRate || selectedProperty.proposedRate) * calculateNights(checkIn, checkOut)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={() => handleBookProperty(selectedProperty)}
                        disabled={
                          !checkIn ||
                          !checkOut ||
                          !isDateRangeAvailable(selectedProperty.id, checkIn, checkOut)
                        }
                        className="w-full"
                      >
                        {checkIn && checkOut
                          ? isDateRangeAvailable(selectedProperty.id, checkIn, checkOut)
                            ? "Confirm Booking"
                            : "Not Available for Selected Dates"
                          : "Select Dates to Book"}
                      </Button>
                      <Button
                        onClick={() => setSelectedProperty(null)}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;