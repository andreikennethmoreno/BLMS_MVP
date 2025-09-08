/**
 * Data Helper Functions
 * 
 * This module provides utilities for working with data structures,
 * filtering, sorting, and data transformations.
 */

import type { Property, Booking, User, Contract, Concern, JobOrder } from '../types';
import { USER_ROLES } from '../config/constants';
import { getDaysAgo } from './dateHelpers';

/**
 * Find user by ID
 */
export const findUserById = (users: User[], userId: string): User | undefined => {
  return users.find(user => user.id === userId);
};

/**
 * Find property by ID
 */
export const findPropertyById = (properties: Property[], propertyId: string): Property | undefined => {
  return properties.find(property => property.id === propertyId);
};

/**
 * Get properties owned by a specific user
 */
export const getPropertiesByOwner = (properties: Property[], ownerId: string): Property[] => {
  return properties.filter(property => property.ownerId === ownerId);
};

/**
 * Get bookings for a specific property
 */
export const getBookingsByProperty = (bookings: Booking[], propertyId: string): Booking[] => {
  return bookings.filter(booking => booking.propertyId === propertyId);
};

/**
 * Get bookings for a specific customer
 */
export const getBookingsByCustomer = (bookings: Booking[], customerId: string): Booking[] => {
  return bookings.filter(booking => booking.customerId === customerId);
};

/**
 * Get bookings for properties owned by a specific user
 */
export const getBookingsByOwner = (bookings: Booking[], properties: Property[], ownerId: string): Booking[] => {
  const ownerProperties = getPropertiesByOwner(properties, ownerId);
  return bookings.filter(booking => 
    ownerProperties.some(property => property.id === booking.propertyId)
  );
};

/**
 * Get contracts for a specific owner
 */
export const getContractsByOwner = (contracts: Contract[], ownerId: string): Contract[] => {
  return contracts.filter(contract => contract.ownerId === ownerId);
};

/**
 * Get concerns for a specific user based on their role
 */
export const getConcernsByUser = (concerns: Concern[], userId: string, userRole: string): Concern[] => {
  switch (userRole) {
    case USER_ROLES.CUSTOMER:
      return concerns.filter(concern => concern.customerId === userId);
    case USER_ROLES.UNIT_OWNER:
      return concerns.filter(concern => concern.ownerId === userId);
    case USER_ROLES.PROPERTY_MANAGER:
      return concerns; // Property managers see all concerns
    default:
      return [];
  }
};

/**
 * Get job orders for a specific user based on their role
 */
export const getJobOrdersByUser = (jobOrders: JobOrder[], userId: string, userRole: string): JobOrder[] => {
  switch (userRole) {
    case USER_ROLES.PROPERTY_MANAGER:
      return jobOrders; // Property managers see all job orders
    case USER_ROLES.UNIT_OWNER:
      return jobOrders.filter(job => job.ownerId === userId);
    default:
      return [];
  }
};

/**
 * Filter properties by timeline
 */
export const filterPropertiesByTimeline = (properties: Property[], timeline: string): Property[] => {
  if (timeline === 'all') return properties;
  
  return properties.filter(property => {
    const daysAgo = getDaysAgo(property.submittedAt);
    
    switch (timeline) {
      case 'week':
        return daysAgo <= 7;
      case 'month':
        return daysAgo <= 30;
      case 'quarter':
        return daysAgo <= 90;
      default:
        return true;
    }
  });
};

/**
 * Determine property unit type based on rate
 * Now respects owner-specified rental type if available
 */
export const getPropertyUnitType = (property: Property): 'short-term' | 'long-term' => {
  // Use owner-specified rental type if available
  if (property.rentalType) {
    return property.rentalType;
  }
  
  // Fallback to rate-based classification
  const rate = property.finalRate || property.proposedRate;
  return rate < 150 ? 'short-term' : 'long-term';
};

/**
 * Sort properties by various criteria
 */
export const sortProperties = (properties: Property[], sortBy: string): Property[] => {
  const sorted = [...properties];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    case 'price-low':
      return sorted.sort((a, b) => (a.finalRate || a.proposedRate) - (b.finalRate || b.proposedRate));
    case 'price-high':
      return sorted.sort((a, b) => (b.finalRate || b.proposedRate) - (a.finalRate || a.proposedRate));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
};

/**
 * Get unique values from array of objects by key
 */
export const getUniqueValues = <T>(array: T[], key: keyof T): T[keyof T][] => {
  return [...new Set(array.map(item => item[key]))];
};

/**
 * Group array of objects by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Calculate statistics for arrays
 */
export const calculateStats = (numbers: number[]) => {
  if (numbers.length === 0) return { sum: 0, average: 0, min: 0, max: 0 };
  
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  const average = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  
  return { sum, average, min, max };
};

/**
 * Check if user has permission for action
 */
export const hasPermission = (userRole: string, action: string): boolean => {
  const permissions = {
    [USER_ROLES.PROPERTY_MANAGER]: [
      'view_all_properties',
      'approve_properties',
      'reject_properties',
      'view_all_bookings',
      'view_all_concerns',
      'create_job_orders',
      'manage_contracts',
      'view_analytics'
    ],
    [USER_ROLES.UNIT_OWNER]: [
      'view_own_properties',
      'create_properties',
      'edit_properties',
      'view_own_bookings',
      'view_own_concerns',
      'review_contracts',
      'view_own_analytics'
    ],
    [USER_ROLES.CUSTOMER]: [
      'view_approved_properties',
      'create_bookings',
      'view_own_bookings',
      'create_concerns',
      'create_reviews'
    ]
  };
  
  return permissions[userRole]?.includes(action) || false;
};