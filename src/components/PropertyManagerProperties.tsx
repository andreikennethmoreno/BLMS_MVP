import React, { useState } from 'react';
import { Building, Search, Filter, XCircle, Eye, Calendar } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';
import { Property } from '../types';

const PropertyManagerProperties: React.FC = () => {
  const [properties] = useLocalStorage<Property[]>(
    'properties',
    propertiesData.properties as Property[]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitTypeFilter, setUnitTypeFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const users = usersData.users;

  // Determine if property is short-term or long-term based on rate
  const getUnitType = (property: Property) => {
    // Use owner-specified rental type if available
    if (property.rentalType) {
      return property.rentalType;
    }
    
    // Fallback to rate-based classification
    const rate = property.finalRate || property.proposedRate;
    return rate < 150 ? 'short-term' : 'long-term';
  };

  const getOwnerName = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || 'Unknown Owner';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-emerald-600 bg-emerald-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending_contract': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_review': return 'Pending Review';
      case 'approved': return 'Live Booking';
      case 'rejected': return 'Rejected';
      case 'pending_contract': return 'Contract Pending';
      default: return status;
    }
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getOwnerName(property.ownerId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesUnitType = unitTypeFilter === 'all' || getUnitType(property) === unitTypeFilter;
    
    let matchesTimeline = true;
    if (timelineFilter !== 'all') {
      const submittedDate = new Date(property.submittedAt);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (timelineFilter) {
        case 'week':
          matchesTimeline = daysAgo <= 7;
          break;
        case 'month':
          matchesTimeline = daysAgo <= 30;
          break;
        case 'quarter':
          matchesTimeline = daysAgo <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesUnitType && matchesTimeline;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'price-low':
        return (a.finalRate || a.proposedRate) - (b.finalRate || b.proposedRate);
      case 'price-high':
        return (b.finalRate || b.proposedRate) - (a.finalRate || a.proposedRate);
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: properties.length,
    pending_review: properties.filter((p) => p.status === 'pending_review').length,
    approved: properties.filter((p) => p.status === 'approved').length,
    rejected: properties.filter((p) => p.status === 'rejected').length,
    pending_contract: properties.filter((p) => p.status === 'pending_contract').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Properties</h1>
        <p className="text-gray-600 mt-2">Manage and review all property listings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total Properties</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.pending_review}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{statusCounts.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.pending_contract}</div>
            <div className="text-sm text-gray-600">Contract Pending</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Properties
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, address, or owner name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Properties</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending_contract">Contract Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Type
            </label>
            <select
              value={unitTypeFilter}
              onChange={(e) => setUnitTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="short-term">Short-term (&lt;$150/night)</option>
              <option value="long-term">Long-term ($150+/night)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Timeline
            </label>
            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {sortedProperties.length} properties found
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Properties ({sortedProperties.length})
          </h2>
        </div>

        <div className="p-6">
          {sortedProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No properties found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProperties.map((property: Property) => {
                const unitType = getUnitType(property);
                return (
                <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 space-y-2">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                          {getStatusText(property.status)}
                        </span>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          unitType === 'short-term' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {unitType === 'short-term' ? 'Short-term' : 'Long-term'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{property.address}</p>
                    <p className="text-gray-500 text-sm mb-3">Owner: {getOwnerName(property.ownerId)}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                      <span className="font-medium text-blue-600">
                        ${property.finalRate || property.proposedRate}/night
                        {property.baseRate && property.finalRate && property.baseRate !== property.finalRate && (
                          <span className="text-xs text-gray-500 block">
                            (Base: ${property.baseRate} + {property.commissionPercentage || 15}%)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(property.submittedAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>

                    {property.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {property.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedProperty.title}</h3>
                  <p className="text-gray-600">{selectedProperty.address}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProperty.status)}`}>
                    {getStatusText(selectedProperty.status)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProperty.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedProperty.title} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 mt-1">{selectedProperty.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Bedrooms:</span>
                        <p className="text-gray-900">{selectedProperty.bedrooms}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Bathrooms:</span>
                        <p className="text-gray-900">{selectedProperty.bathrooms}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Max Guests:</span>
                        <p className="text-gray-900">{selectedProperty.maxGuests}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Owner:</span>
                        <p className="text-gray-900">{getOwnerName(selectedProperty.ownerId)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maximum Stay:</span>
                        <p className="text-gray-900">
                          {selectedProperty.maxStayDisplay || 'Not specified'}
                          {selectedProperty.termClassification && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              selectedProperty.termClassification === 'short-term' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedProperty.termClassification === 'short-term' ? 'Short-term' : 'Long-term'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Amenities:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProperty.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Status</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Proposed Rate:</span>
                      <p className="text-2xl font-bold text-gray-900">${selectedProperty.proposedRate}/night</p>
                    </div>
                    
                    {selectedProperty.finalRate && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Final Rate:</span>
                        <p className="text-2xl font-bold text-emerald-600">${selectedProperty.finalRate}/night</p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium text-gray-700">Submitted:</span>
                      <p className="text-gray-900">{new Date(selectedProperty.submittedAt).toLocaleDateString()}</p>
                    </div>

                    {selectedProperty.rejectionReason && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Rejection Reason:</span>
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800">{selectedProperty.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagerProperties;