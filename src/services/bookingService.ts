/**
 * Booking Service
 * 
 * Handles all booking-related operations including creation, validation,
 * availability checking, and status management.
 * 
 * Data Flow:
 * 1. Customer selects dates -> validate availability
 * 2. Create booking -> validate against property rules
 * 3. Process payment -> confirm booking
 * 4. Store in localStorage -> trigger real-time updates
 */

import { bookingDataService, propertyDataService } from './dataService';
import { calculateBookingTotal, calculateNights } from '../utils/calculations';
import { validateBooking } from '../utils/validators';
import { doDateRangesOverlap } from '../utils/dateHelpers';
import { BOOKING_STATUS } from '../config/constants';
import type { Booking, Property } from '../types';

/**
 * Booking service class
 */
class BookingService {
  /**
   * Check if property is available for given date range
   * 
   * Process:
   * 1. Get all confirmed bookings for property
   * 2. Check if requested dates overlap with any existing booking
   * 3. Return availability status
   */
  checkAvailability(propertyId: string, checkIn: string, checkOut: string): boolean {
    const allBookings = bookingDataService.getAll();
    const propertyBookings = allBookings.filter((booking: Booking) => 
      booking.propertyId === propertyId && booking.status === BOOKING_STATUS.CONFIRMED
    );

    // Check for date conflicts
    for (const booking of propertyBookings) {
      if (doDateRangesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all booked dates for a property
   * Used by calendar components to show unavailable dates
   */
  getBookedDates(propertyId: string): string[] {
    const allBookings = bookingDataService.getAll();
    const propertyBookings = allBookings.filter((booking: Booking) => 
      booking.propertyId === propertyId && booking.status === BOOKING_STATUS.CONFIRMED
    );

    const bookedDates: string[] = [];
    
    propertyBookings.forEach((booking: Booking) => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);
      
      // Add all dates from check-in to check-out (exclusive of check-out)
      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        bookedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return bookedDates;
  }

  /**
   * Create new booking
   * 
   * Process:
   * 1. Validate booking data and availability
   * 2. Calculate total cost with fees
   * 3. Create booking record
   * 4. Store in localStorage
   */
  createBooking(bookingData: {
    propertyId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }): Booking {
    // Get property details for validation
    const properties = propertyDataService.getAll();
    const property = properties.find((p: Property) => p.id === bookingData.propertyId);
    
    if (!property) {
      throw new Error('Property not found');
    }

    // Validate booking data
    const validationErrors = validateBooking(bookingData, property);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check availability
    if (!this.checkAvailability(bookingData.propertyId, bookingData.checkIn, bookingData.checkOut)) {
      throw new Error('Property is not available for the selected dates');
    }

    // Calculate total cost
    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
    const rate = property.finalRate || property.proposedRate || 0;
    const calculation = calculateBookingTotal(rate, nights);

    // Create booking
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      propertyId: bookingData.propertyId,
      customerId: bookingData.customerId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      totalAmount: calculation.total,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'paid', // Simulated payment success
      bookedAt: new Date().toISOString(),
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail
    };

    bookingDataService.add(newBooking);
    return newBooking;
  }

  /**
   * Get bookings for a specific user based on their role
   */
  getBookingsForUser(userId: string, userRole: string): Booking[] {
    const allBookings = bookingDataService.getAll();
    
    switch (userRole) {
      case 'customer':
        return allBookings.filter((booking: Booking) => booking.customerId === userId);
      
      case 'unit_owner':
        const properties = propertyDataService.getAll();
        const ownerProperties = properties.filter((p: Property) => p.ownerId === userId);
        return allBookings.filter((booking: Booking) => 
          ownerProperties.some((prop: Property) => prop.id === booking.propertyId)
        );
      
      case 'property_manager':
        return allBookings; // Property managers see all bookings
      
      default:
        return [];
    }
  }

  /**
   * Cancel booking
   */
  cancelBooking(bookingId: string, userId: string): void {
    bookingDataService.update(bookingId, {
      status: BOOKING_STATUS.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId
    });
  }

  /**
   * Mark booking as completed
   */
  completeBooking(bookingId: string): void {
    bookingDataService.update(bookingId, {
      status: BOOKING_STATUS.COMPLETED,
      completedAt: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const bookingService = new BookingService();