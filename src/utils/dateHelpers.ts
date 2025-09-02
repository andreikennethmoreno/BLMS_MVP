/**
 * Date Utility Functions
 * 
 * This module handles all date-related operations including formatting,
 * validation, and date range calculations used throughout the booking system.
 */

/**
 * Format date for display in various components
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date with weekday for booking displays
 */
export const formatDateWithWeekday = (date: string | Date): string => {
  return formatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format full date and time for timestamps
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US');
};

/**
 * Get today's date in YYYY-MM-DD format
 * Used for date input min values
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

/**
 * Check if a date is today
 */
export const isDateToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if a booking is currently active (guest is staying)
 */
export const isBookingActive = (checkIn: string, checkOut: string): boolean => {
  const now = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return checkInDate <= now && checkOutDate > now;
};

/**
 * Check if a booking is upcoming
 */
export const isBookingUpcoming = (checkIn: string): boolean => {
  return new Date(checkIn) > new Date();
};

/**
 * Check if a booking is completed
 */
export const isBookingCompleted = (checkOut: string): boolean => {
  return new Date(checkOut) < new Date();
};

/**
 * Generate array of dates between two dates (inclusive)
 * Used for calendar availability checking
 */
export const getDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Check if date ranges overlap
 * Used for booking conflict detection
 */
export const doDateRangesOverlap = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const startDate1 = new Date(start1);
  const endDate1 = new Date(end1);
  const startDate2 = new Date(start2);
  const endDate2 = new Date(end2);
  
  return startDate1 < endDate2 && startDate2 < endDate1;
};

/**
 * Get days ago from a date
 * Used for timeline filtering
 */
export const getDaysAgo = (date: string): number => {
  const dateObj = new Date(date);
  const now = new Date();
  const timeDiff = now.getTime() - dateObj.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
};