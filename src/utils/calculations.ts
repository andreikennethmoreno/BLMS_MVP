/**
 * Business Calculation Utilities
 * 
 * This module handles all financial and business logic calculations
 * including property rates, booking totals, commissions, and analytics.
 * 
 * Data Flow:
 * 1. Property rates: proposedRate -> baseRate -> finalRate (with commission)
 * 2. Booking totals: rate * nights + fees + taxes = total
 * 3. Commission: baseRate * commissionPercentage = commissionAmount
 * 
 * Key Functions:
 * - calculateFinalRate(): Adds commission to base rate
 * - calculateBookingTotal(): Computes total cost with fees/taxes
 * - isPropertyLiveForCustomers(): Checks if property is bookable
 */

import { BUSINESS_CONFIG } from '../config/constants';
import type { Property, PropertyRateCalculation, BookingCalculation } from '../types';

/**
 * Calculate final rate with commission percentage
 * 
 * Process:
 * 1. Calculate commission amount from base rate
 * 2. Add commission to base rate for final customer-facing rate
 * 3. Return complete calculation breakdown
 * 
 * Used when: Property managers approve properties with adjusted rates
 */
export const calculateFinalRate = (
  baseRate: number, 
  commissionPercentage: number = BUSINESS_CONFIG.DEFAULT_COMMISSION_PERCENTAGE
): PropertyRateCalculation => {
  const commissionAmount = Math.round(baseRate * (commissionPercentage / 100));
  const finalRate = baseRate + commissionAmount;
  
  return {
    baseRate,
    commissionPercentage,
    finalRate,
    commissionAmount
  };
};

/**
 * Calculate booking total with fees and taxes
 * 
 * Process:
 * 1. Calculate subtotal (rate × nights)
 * 2. Add service fee (12% of subtotal)
 * 3. Add taxes (8% of subtotal)
 * 4. Return complete breakdown for checkout display
 * 
 * Used in: Checkout process and booking confirmations
 */
export const calculateBookingTotal = (
  ratePerNight: number,
  nights: number
): BookingCalculation => {
  const subtotal = ratePerNight * nights;
  const serviceFee = Math.round(subtotal * (BUSINESS_CONFIG.SERVICE_FEE_PERCENTAGE / 100));
  const taxes = Math.round(subtotal * (BUSINESS_CONFIG.TAX_PERCENTAGE / 100));
  const total = subtotal + serviceFee + taxes;

  return {
    subtotal,
    serviceFee,
    taxes,
    total,
    nights,
    ratePerNight
  };
};

/**
 * Update property with calculated commission rates
 * 
 * Process:
 * 1. Use proposed rate as base rate
 * 2. Calculate final rate with commission
 * 3. Return property with all rate fields populated
 * 
 * Used when: Creating or updating properties
 */
export const updatePropertyWithCommission = (
  property: Partial<Property>,
  commissionPercentage: number = BUSINESS_CONFIG.DEFAULT_COMMISSION_PERCENTAGE
): Partial<Property> => {
  const baseRate = property.proposedRate || property.finalRate || BUSINESS_CONFIG.MIN_PROPERTY_RATE;
  const calculation = calculateFinalRate(baseRate, commissionPercentage);
  
  return {
    ...property,
    baseRate: calculation.baseRate,
    finalRate: calculation.finalRate,
    commissionPercentage: calculation.commissionPercentage,
    commissionAmount: calculation.commissionAmount
  };
};

/**
 * Calculate number of nights between two dates
 * 
 * Used throughout: Booking system, pricing calculations, calendar displays
 */
export const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Get display rate for property (handles fallbacks)
 * 
 * Priority: finalRate > proposedRate > 0
 * Used in: Property listings, booking displays, search results
 */
export const getDisplayRate = (property: Property): number => {
  return property.finalRate || property.proposedRate || 0;
};

/**
 * Validate property approval status for customer visibility
 * 
 * Requirements for customer visibility:
 * 1. Status must be "approved"
 * 2. Contract must be accepted by owner
 * 3. Final rate must be set and > 0
 * 
 * Used to: Filter properties that customers can see and book
 */
export const isPropertyLiveForCustomers = (property: Property): boolean => {
  return (
    property.status === 'approved' &&
    property.contractApproved === true &&
    property.finalRate !== null &&
    property.finalRate > 0
  );
};

/**
 * Format rate display with base rate info
 * 
 * Returns display information including whether commission is applied
 * Used in: Property cards, details views, pricing displays
 */
export const formatRateDisplay = (property: Property): {
  displayRate: number;
  hasCommission: boolean;
  baseRate?: number;
  commissionPercentage?: number;
} => {
  const displayRate = getDisplayRate(property);
  const hasCommission = !!(property.baseRate && property.commissionPercentage);
  
  return {
    displayRate,
    hasCommission,
    baseRate: property.baseRate,
    commissionPercentage: property.commissionPercentage
  };
};

/**
 * Calculate platform revenue from bookings
 * 
 * Calculates total commission earned by platform from all bookings
 * Used in: Analytics dashboard, financial reporting
 */
export const calculatePlatformRevenue = (bookings: any[], commissionRate: number = 0.15): number => {
  return Math.floor(
    bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) * commissionRate
  );
};

/**
 * Calculate occupancy rate for properties
 * 
 * Formula: (total booked nights / total possible nights) × 100
 * Used in: Analytics dashboard, performance metrics
 */
export const calculateOccupancyRate = (bookings: any[], properties: Property[], days: number = 30): number => {
  if (properties.length === 0) return 0;
  
  const totalPossibleNights = properties.length * days;
  const bookedNights = bookings.reduce((sum, booking) => {
    return sum + calculateNights(booking.checkIn, booking.checkOut);
  }, 0);
  
  return (bookedNights / totalPossibleNights) * 100;
};