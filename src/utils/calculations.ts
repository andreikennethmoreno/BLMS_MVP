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
 */

import { BUSINESS_CONFIG } from '../config/constants';
import type { Property, PropertyRateCalculation, BookingCalculation } from '../types';

/**
 * Calculate final rate with commission percentage
 * Used when property managers approve properties with adjusted rates
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
 * Update property with calculated commission rates
 * Used when creating or updating properties
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
 * Calculate booking total with fees and taxes
 * Used in checkout process and booking confirmations
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
 * Calculate number of nights between two dates
 * Used throughout booking system
 */
export const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Get display rate for property (handles fallbacks)
 * Used in property listings and booking displays
 */
export const getDisplayRate = (property: Property): number => {
  return property.finalRate || property.proposedRate || 0;
};

/**
 * Validate property approval status for customer visibility
 * Used to filter properties that customers can see and book
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
 * Used in property cards and details
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
 * Used in analytics dashboard
 */
export const calculatePlatformRevenue = (bookings: any[], commissionRate: number = 0.15): number => {
  return Math.floor(
    bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) * commissionRate
  );
};

/**
 * Calculate occupancy rate for properties
 * Used in analytics dashboard
 */
export const calculateOccupancyRate = (bookings: any[], properties: Property[], days: number = 30): number => {
  if (properties.length === 0) return 0;
  
  const totalPossibleNights = properties.length * days;
  const bookedNights = bookings.reduce((sum, booking) => {
    return sum + calculateNights(booking.checkIn, booking.checkOut);
  }, 0);
  
  return (bookedNights / totalPossibleNights) * 100;
};