/**
 * Utility functions for property rate calculations with commission
 * Updated to include maximum stay calculations
 */

import { convertMaxStayToDays, formatMaxStayDisplay, calculateTermClassification } from './calculations';

export interface PropertyRateCalculation {
  baseRate: number;
  commissionPercentage: number;
  finalRate: number;
  commissionAmount: number;
}

/**
 * Calculate final rate with commission percentage
 */
export const calculateFinalRate = (
  baseRate: number, 
  commissionPercentage: number
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
 * Update property with calculated rates
 */
export const updatePropertyWithCommission = (
  property: any,
  commissionPercentage: number = 15
) => {
  const baseRate = property.proposedRate || property.finalRate || 100;
  const calculation = calculateFinalRate(baseRate, commissionPercentage);
  
  // Calculate maximum stay fields if provided
  let maxStayFields = {};
  if (property.maxStayValue && property.maxStayUnit) {
    const maxStayDays = convertMaxStayToDays(property.maxStayValue, property.maxStayUnit);
    maxStayFields = {
      maxStayDays,
      maxStayUnit: property.maxStayUnit,
      maxStayDisplay: formatMaxStayDisplay(property.maxStayValue, property.maxStayUnit),
      termClassification: calculateTermClassification(maxStayDays)
    };
  }
  
  return {
    ...property,
    ...maxStayFields,
    baseRate: calculation.baseRate,
    finalRate: calculation.finalRate,
    commissionPercentage: calculation.commissionPercentage,
    commissionAmount: calculation.commissionAmount
  };
};

/**
 * Validate property approval status for customer visibility
 */
export const isPropertyLiveForCustomers = (property: any): boolean => {
  return (
    property.status === 'approved' &&
    property.contractApproved === true &&
    property.finalRate !== null &&
    property.finalRate > 0
  );
};

/**
 * Get display rate for property (handles fallbacks)
 */
export const getDisplayRate = (property: any): number => {
  return property.finalRate || property.proposedRate || 0;
};

/**
 * Format rate display with base rate info
 */
export const formatRateDisplay = (property: any): {
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