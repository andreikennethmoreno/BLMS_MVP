/**
 * Validation Utility Functions
 * 
 * This module contains all validation logic for forms, user input,
 * and business rules throughout the application.
 */

import { VALIDATION, BUSINESS_CONFIG } from '../config/constants';
import type { Property, Booking, User } from '../types';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

/**
 * Validate property data before submission
 */
export const validateProperty = (property: Partial<Property>): string[] => {
  const errors: string[] = [];
  
  if (!property.title || property.title.trim().length === 0) {
    errors.push('Property title is required');
  }
  
  if (property.title && property.title.length > VALIDATION.PROPERTY_TITLE_MAX_LENGTH) {
    errors.push(`Property title must be less than ${VALIDATION.PROPERTY_TITLE_MAX_LENGTH} characters`);
  }
  
  if (!property.description || property.description.trim().length === 0) {
    errors.push('Property description is required');
  }
  
  if (property.description && property.description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be less than ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`);
  }
  
  if (!property.address || property.address.trim().length === 0) {
    errors.push('Property address is required');
  }
  
  if (!property.images || property.images.filter(img => img.trim()).length === 0) {
    errors.push('At least one property image is required');
  }
  
  if (property.images && property.images.length > VALIDATION.MAX_IMAGES_PER_PROPERTY) {
    errors.push(`Maximum ${VALIDATION.MAX_IMAGES_PER_PROPERTY} images allowed`);
  }
  
  if (!property.amenities || property.amenities.filter(amenity => amenity.trim()).length === 0) {
    errors.push('At least one amenity is required');
  }
  
  if (property.amenities && property.amenities.length > VALIDATION.MAX_AMENITIES_PER_PROPERTY) {
    errors.push(`Maximum ${VALIDATION.MAX_AMENITIES_PER_PROPERTY} amenities allowed`);
  }
  
  if (!property.bedrooms || property.bedrooms < 1) {
    errors.push('Number of bedrooms must be at least 1');
  }
  
  if (!property.bathrooms || property.bathrooms < 1) {
    errors.push('Number of bathrooms must be at least 1');
  }
  
  if (!property.maxGuests || property.maxGuests < 1) {
    errors.push('Maximum guests must be at least 1');
  }
  
  if (!property.proposedRate || property.proposedRate < BUSINESS_CONFIG.MIN_PROPERTY_RATE) {
    errors.push(`Proposed rate must be at least $${BUSINESS_CONFIG.MIN_PROPERTY_RATE}`);
  }
  
  if (property.proposedRate && property.proposedRate > BUSINESS_CONFIG.MAX_PROPERTY_RATE) {
    errors.push(`Proposed rate cannot exceed $${BUSINESS_CONFIG.MAX_PROPERTY_RATE}`);
  }
  
  if (property.rentalType && !['short-term', 'long-term'].includes(property.rentalType)) {
    errors.push('Rental type must be either short-term or long-term');
  }
  
  return errors;
};

/**
 * Validate booking data before submission
 */
export const validateBooking = (booking: Partial<Booking>, property: Property): string[] => {
  const errors: string[] = [];
  
  if (!booking.checkIn) {
    errors.push('Check-in date is required');
  }
  
  if (!booking.checkOut) {
    errors.push('Check-out date is required');
  }
  
  if (booking.checkIn && booking.checkOut) {
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    if (checkInDate >= checkOutDate) {
      errors.push('Check-out date must be after check-in date');
    }
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < BUSINESS_CONFIG.MIN_NIGHTS) {
      errors.push(`Minimum stay is ${BUSINESS_CONFIG.MIN_NIGHTS} night${BUSINESS_CONFIG.MIN_NIGHTS > 1 ? 's' : ''}`);
    }
  }
  
  if (!booking.guests || booking.guests < 1) {
    errors.push('Number of guests must be at least 1');
  }
  
  if (booking.guests && booking.guests > property.maxGuests) {
    errors.push(`Maximum ${property.maxGuests} guests allowed for this property`);
  }
  
  if (booking.guests && booking.guests > BUSINESS_CONFIG.MAX_GUESTS_PER_BOOKING) {
    errors.push(`Maximum ${BUSINESS_CONFIG.MAX_GUESTS_PER_BOOKING} guests allowed per booking`);
  }
  
  return errors;
};

/**
 * Validate user registration data
 */
export const validateUserRegistration = (userData: Partial<User>): string[] => {
  const errors: string[] = [];
  
  if (!userData.name || userData.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Valid email address is required');
  }
  
  return errors;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const urlLower = url.toLowerCase();
  
  return imageExtensions.some(ext => urlLower.includes(ext)) || 
         urlLower.includes('pexels.com') || 
         urlLower.includes('unsplash.com');
};

/**
 * Validate rating value
 */
export const isValidRating = (rating: number): boolean => {
  return rating >= BUSINESS_CONFIG.MIN_RATING && rating <= BUSINESS_CONFIG.MAX_RATING;
};