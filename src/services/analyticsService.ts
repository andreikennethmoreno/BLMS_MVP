/**
 * Analytics Service
 * 
 * Handles all analytics calculations and data aggregation.
 * Provides insights for different user roles with appropriate data filtering.
 * 
 * Data Sources:
 * - Bookings: Revenue, occupancy, customer metrics
 * - Properties: Performance, ratings, availability
 * - Reviews: Satisfaction scores, feedback trends
 */

import { bookingDataService, propertyDataService, reviewDataService } from './dataService';
import { calculatePlatformRevenue, calculateOccupancyRate } from '../utils/calculations';
import { getDaysAgo } from '../utils/dateHelpers';
import type { AnalyticsData, MonthlyRevenueData, PropertyPerformance, Booking, Property, Review } from '../types';

/**
 * Analytics service class
 */
class AnalyticsService {
  /**
   * Get analytics data for specific user role
   * 
   * Property managers see platform-wide data
   * Unit owners see only their property data
   */
  getAnalyticsForUser(userId: string, userRole: string): AnalyticsData {
    const allBookings = bookingDataService.getAll();
    const allProperties = propertyDataService.getAll();
    const allReviews = reviewDataService.getAll();

    let filteredBookings = allBookings;
    let filteredProperties = allProperties;
    let filteredReviews = allReviews;

    // Filter data based on user role
    if (userRole === 'unit_owner') {
      // Unit owners only see their own property data
      filteredProperties = allProperties.filter((p: Property) => p.ownerId === userId);
      filteredBookings = allBookings.filter((b: Booking) => 
        filteredProperties.some((p: Property) => p.id === b.propertyId)
      );
      filteredReviews = allReviews.filter((r: Review) => 
        filteredProperties.some((p: Property) => p.id === r.propertyId)
      );
    }

    return {
      totalRevenue: this.calculateTotalRevenue(filteredBookings),
      totalBookings: filteredBookings.length,
      averageRating: this.calculateAverageRating(filteredReviews),
      occupancyRate: calculateOccupancyRate(filteredBookings, filteredProperties),
      monthlyRevenue: this.getMonthlyRevenue(filteredBookings),
      topProperties: this.getTopPerformingProperties(filteredProperties, filteredBookings)
    };
  }

  /**
   * Calculate total revenue from bookings
   */
  private calculateTotalRevenue(bookings: Booking[]): number {
    return bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  }

  /**
   * Calculate average rating from reviews
   */
  private calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  /**
   * Generate monthly revenue data for charts
   * Currently generates sample data - in real app would aggregate actual bookings
   */
  private getMonthlyRevenue(bookings: Booking[]): MonthlyRevenueData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // In a real application, this would aggregate actual booking data by month
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 10000) + 5000 // Sample data
    }));
  }

  /**
   * Get top performing properties by revenue
   */
  private getTopPerformingProperties(properties: Property[], bookings: Booking[]): PropertyPerformance[] {
    const propertyPerformance = properties.map((property: Property) => {
      const propertyBookings = bookings.filter((b: Booking) => b.propertyId === property.id);
      const revenue = propertyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      
      return {
        id: property.id,
        title: property.title,
        revenue,
        bookings: propertyBookings.length,
        images: property.images
      };
    });
    
    return propertyPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  /**
   * Get platform statistics (for property managers)
   */
  getPlatformStats(): {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    platformRevenue: number;
    verifiedOwners: number;
    pendingVerifications: number;
  } {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const properties = propertyDataService.getAll();
    const bookings = bookingDataService.getAll();

    return {
      totalUsers: users.length,
      totalProperties: properties.length,
      totalBookings: bookings.length,
      platformRevenue: calculatePlatformRevenue(bookings),
      verifiedOwners: users.filter((u: any) => u.role === 'unit_owner' && u.verified).length,
      pendingVerifications: users.filter((u: any) => u.role === 'unit_owner' && !u.verified).length
    };
  }

  /**
   * Export analytics data as CSV
   */
  exportAnalyticsData(userId: string, userRole: string): string {
    const bookings = this.getBookingsForUser(userId, userRole);
    const properties = propertyDataService.getAll();
    
    const csvData = bookings.map((booking: Booking) => {
      const property = properties.find((p: Property) => p.id === booking.propertyId);
      return {
        'Booking ID': booking.id,
        'Property': property?.title || 'Unknown',
        'Customer': booking.customerName,
        'Check In': booking.checkIn,
        'Check Out': booking.checkOut,
        'Guests': booking.guests,
        'Amount': booking.totalAmount,
        'Status': booking.status,
        'Payment Status': booking.paymentStatus,
        'Booked At': booking.bookedAt
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Get bookings for user (helper method)
   */
  private getBookingsForUser(userId: string, userRole: string): Booking[] {
    const allBookings = bookingDataService.getAll();
    
    if (userRole === 'unit_owner') {
      const properties = propertyDataService.getAll();
      const ownerProperties = properties.filter((p: Property) => p.ownerId === userId);
      return allBookings.filter((booking: Booking) => 
        ownerProperties.some((prop: Property) => prop.id === booking.propertyId)
      );
    }
    
    return allBookings;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();