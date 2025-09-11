/**
 * Walk-in Registration Service
 * 
 * Handles walk-in customer registration and immediate booking creation.
 * This service is exclusively for property managers to register customers
 * who visit in person and want to book immediately.
 * 
 * Data Flow:
 * 1. Property manager enters customer details
 * 2. Service validates data and checks availability
 * 3. Creates user account with walk-in flag
 * 4. Creates confirmed booking with payment
 * 5. Updates localStorage and triggers real-time sync
 */

import { userDataService, bookingDataService, propertyDataService } from './dataService';
import { calculateBookingTotal, calculateNights } from '../utils/calculations';
import { validateBookingDuration } from '../utils/calculations';
import { isValidEmail } from '../utils/validators';
import { BOOKING_STATUS } from '../config/constants';
import type { User, Booking, Property } from '../types';

interface WalkInRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: string;
  notes: string;
}

interface WalkInResult {
  user: User;
  booking: Booking;
}

/**
 * Walk-in registration service class
 */
class WalkInService {
  /**
   * Register walk-in customer and create booking
   * 
   * Process:
   * 1. Validate customer data and booking details
   * 2. Check property availability for selected dates
   * 3. Create user account with walk-in metadata
   * 4. Create confirmed booking with payment
   * 5. Return both user and booking objects
   */
  async registerWalkInCustomer(
    data: WalkInRegistrationData,
    registeredBy: string
  ): Promise<WalkInResult> {
    // Validate input data
    this.validateWalkInData(data);

    // Check for duplicate email
    const existingUsers = userDataService.getAll();
    const existingUser = existingUsers.find((u: User) => u.email === data.email);
    if (existingUser) {
      throw new Error('A customer with this email already exists in the system');
    }

    // Get property details
    const properties = propertyDataService.getAll();
    const property = properties.find((p: Property) => p.id === data.propertyId);
    if (!property) {
      throw new Error('Selected property not found');
    }

    // Validate property is available for booking
    if (!this.isPropertyAvailable(property)) {
      throw new Error('Selected property is not available for booking');
    }

    // Check date availability
    if (!this.checkDateAvailability(data.propertyId, data.checkIn, data.checkOut)) {
      throw new Error('Selected dates are not available for this property');
    }

    // Validate booking duration against property limits
    if (property.maxStayDays) {
      const durationValidation = validateBookingDuration(
        data.checkIn,
        data.checkOut,
        property.maxStayDays
      );
      if (!durationValidation.isValid) {
        throw new Error(durationValidation.error || 'Booking duration exceeds maximum allowed stay');
      }
    }

    // Validate guest capacity
    if (data.guests > property.maxGuests) {
      throw new Error(`Maximum ${property.maxGuests} guests allowed for this property`);
    }

    // Create new user account
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      password: 'walkin123', // Default password for walk-in users
      role: 'customer',
      name: `${data.firstName} ${data.lastName}`,
      verified: true, // Auto-verify walk-in customers
      createdAt: new Date().toISOString(),
      walkInRegistration: {
        registeredBy,
        registeredAt: new Date().toISOString(),
        idType: data.idType,
        idNumber: data.idNumber,
        address: data.address,
        phone: data.phone
      }
    };

    // Calculate booking cost
    const nights = calculateNights(data.checkIn, data.checkOut);
    const rate = property.finalRate || property.proposedRate || 0;
    const calculation = calculateBookingTotal(rate, nights);

    // Create booking
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      propertyId: data.propertyId,
      customerId: newUser.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      totalAmount: calculation.total,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'paid', // Walk-in bookings are paid immediately
      bookedAt: new Date().toISOString(),
      customerName: newUser.name,
      customerEmail: newUser.email,
      walkInBooking: {
        registeredBy,
        paymentMethod: data.paymentMethod,
        notes: data.notes
      }
    };

    // Save to data stores
    userDataService.add(newUser);
    bookingDataService.add(newBooking);

    return { user: newUser, booking: newBooking };
  }

  /**
   * Validate walk-in registration data
   */
  private validateWalkInData(data: WalkInRegistrationData): void {
    const errors: string[] = [];

    // Customer information validation
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!isValidEmail(data.email)) errors.push('Valid email address is required');
    if (!data.phone?.trim()) errors.push('Phone number is required');
    if (!data.idNumber?.trim()) errors.push('ID number is required');

    // Booking information validation
    if (!data.propertyId) errors.push('Property selection is required');
    if (!data.checkIn) errors.push('Check-in date is required');
    if (!data.checkOut) errors.push('Check-out date is required');
    if (data.guests < 1) errors.push('At least 1 guest is required');

    // Date validation
    if (data.checkIn && data.checkOut) {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      
      if (checkInDate >= checkOutDate) {
        errors.push('Check-out date must be after check-in date');
      }
      
      if (checkInDate < new Date()) {
        errors.push('Check-in date cannot be in the past');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if property is available for booking
   */
  private isPropertyAvailable(property: Property): boolean {
    return (
      property.status === 'approved' &&
      property.contractApproved === true &&
      property.finalRate !== null &&
      property.finalRate > 0
    );
  }

  /**
   * Check if dates are available for property
   */
  private checkDateAvailability(propertyId: string, checkIn: string, checkOut: string): boolean {
    const allBookings = bookingDataService.getAll();
    const propertyBookings = allBookings.filter((booking: Booking) => 
      booking.propertyId === propertyId && booking.status === BOOKING_STATUS.CONFIRMED
    );

    const requestStart = new Date(checkIn);
    const requestEnd = new Date(checkOut);

    // Check for conflicts with existing bookings
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
  }

  /**
   * Get available properties for walk-in booking
   */
  getAvailableProperties(): Property[] {
    const properties = propertyDataService.getAll();
    return properties.filter((property: Property) => this.isPropertyAvailable(property));
  }

  /**
   * Get walk-in customers (for reporting)
   */
  getWalkInCustomers(): User[] {
    const users = userDataService.getAll();
    return users.filter((user: User) => user.walkInRegistration);
  }

  /**
   * Get walk-in bookings (for reporting)
   */
  getWalkInBookings(): Booking[] {
    const bookings = bookingDataService.getAll();
    return bookings.filter((booking: Booking) => booking.walkInBooking);
  }

  /**
   * Get walk-in statistics
   */
  getWalkInStats(): {
    totalWalkInCustomers: number;
    totalWalkInBookings: number;
    walkInRevenue: number;
    averageWalkInBookingValue: number;
  } {
    const walkInCustomers = this.getWalkInCustomers();
    const walkInBookings = this.getWalkInBookings();
    const walkInRevenue = walkInBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      totalWalkInCustomers: walkInCustomers.length,
      totalWalkInBookings: walkInBookings.length,
      walkInRevenue,
      averageWalkInBookingValue: walkInBookings.length > 0 ? walkInRevenue / walkInBookings.length : 0
    };
  }
}

// Export singleton instance
export const walkInService = new WalkInService();