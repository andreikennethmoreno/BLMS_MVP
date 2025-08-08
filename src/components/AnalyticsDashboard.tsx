import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, Users, Building, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
import reviewsData from '../data/reviews.json';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [reviews] = useLocalStorage('reviews', reviewsData.reviews);
  const [dateRange, setDateRange] = useState('30');

  // Filter data based on user role
  const getUserData = () => {
    if (!user) return { bookings: [], properties: [], reviews: [] };
    
    let userProperties = properties;
    let userBookings = bookings;
    let userReviews = reviews;

    if (user.role === 'unit_owner') {
      userProperties = properties.filter((p: any) => p.ownerId === user.id);
      userBookings = bookings.filter((b: any) => 
        userProperties.some((p: any) => p.id === b.propertyId)
      );
      userReviews = reviews.filter((r: any) => 
        userProperties.some((p: any) => p.id === r.propertyId)
      );
    }

    return { 
      bookings: userBookings, 
      properties: userProperties, 
      reviews: userReviews 
    };
  };

  const { bookings: userBookings, properties: userProperties, reviews: userReviews } = getUserData();

  // Calculate analytics
  const analytics = {
    totalRevenue: userBookings.reduce((sum: number, booking: any) => sum + booking.totalAmount, 0),
    totalBookings: userBookings.length,
    averageRating: userReviews.length > 0 
      ? userReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / userReviews.length 
      : 0,
    occupancyRate: userProperties.length > 0 
      ? (userBookings.length / (userProperties.length * 30)) * 100 
      : 0,
  };

  // Monthly revenue data (simplified)
  const getMonthlyRevenue = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 10000) + 5000
    }));
  };

  // Top performing properties
  const getTopProperties = () => {
    const propertyRevenue = userProperties.map((property: any) => {
      const propertyBookings = userBookings.filter((b: any) => b.propertyId === property.id);
      const revenue = propertyBookings.reduce((sum: number, booking: any) => sum + booking.totalAmount, 0);
      return { ...property, revenue, bookings: propertyBookings.length };
    });
    
    return propertyRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Export data as CSV
  const exportData = () => {
    const csvData = userBookings.map((booking: any) => ({
      'Booking ID': booking.id,
      'Property': userProperties.find((p: any) => p.id === booking.propertyId)?.title || 'Unknown',
      'Customer': booking.customerName,
      'Check In': booking.checkIn,
      'Check Out': booking.checkOut,
      'Amount': booking.totalAmount,
      'Status': booking.status
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const monthlyRevenue = getMonthlyRevenue();
  const topProperties = getTopProperties();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'property_manager' 
              ? 'Platform-wide analytics and insights'
              : 'Your property performance insights'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+12% from last month</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{analytics.totalBookings}</p>
              <p className="text-sm text-blue-600 mt-1">+8% from last month</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-600">{analytics.averageRating.toFixed(1)}</p>
              <p className="text-sm text-yellow-600 mt-1">+0.2 from last month</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.occupancyRate.toFixed(1)}%</p>
              <p className="text-sm text-purple-600 mt-1">+5% from last month</p>
            </div>
            <Building className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {monthlyRevenue.map((data, index) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-12">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(data.revenue / 15000) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  ${data.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Properties</h3>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {topProperties.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No property data available</p>
            ) : (
              topProperties.map((property: any, index) => (
                <div key={property.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                    <p className="text-sm text-gray-600">{property.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${property.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Additional Analytics for Property Managers */}
      {user?.role === 'property_manager' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Growth</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Properties</span>
                <span className="font-semibold text-gray-900">{properties.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Unit Owners</span>
                <span className="font-semibold text-gray-900">
                  {[...new Set(properties.map((p: any) => p.ownerId))].length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-semibold text-gray-900">{reviews.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform Revenue</span>
                <span className="font-semibold text-green-600">
                  ${Math.floor(analytics.totalRevenue * 0.15).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {userBookings.slice(0, 5).map((booking: any) => {
                const property = properties.find((p: any) => p.id === booking.propertyId);
                return (
                  <div key={booking.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        New booking at {property?.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.bookedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      ${booking.totalAmount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;