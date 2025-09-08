import React, { useState } from 'react';
import { Building, Plus, Calendar, DollarSign, Users, CheckCircle, Clock, XCircle, Eye, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PropertySubmissionForm from './PropertySubmissionForm';
import PropertyEditSystem from './PropertyEditSystem';
import ContractReviewSystem from './ContractReviewSystem';
import propertiesData from '../data/properties.json';
import bookingsData from '../data/bookings.json';
import contractsData from '../data/contracts.json';
import { getDisplayRate } from '../utils/propertyCalculations';

interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  address: string;
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  proposedRate: number;
  finalRate: number | null;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
  maxStayDays?: number;
  maxStayUnit?: 'days' | 'months' | 'years';
  maxStayDisplay?: string;
  termClassification?: 'short-term' | 'long-term';
}

const UnitOwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [contracts] = useLocalStorage('contracts', contractsData.contracts);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const ownerProperties = properties.filter((p: Property) => p.ownerId === user?.id);
  const ownerBookings = bookings.filter((booking: any) => 
    ownerProperties.some((prop: Property) => prop.id === booking.propertyId)
  );
  const ownerContracts = contracts.filter((contract: any) => contract.ownerId === user?.id);

  const stats = {
    totalProperties: ownerProperties.length,
    approvedProperties: ownerProperties.filter((p: Property) => p.status === 'approved').length,
    pendingProperties: ownerProperties.filter((p: Property) => p.status === 'pending_review').length,
    totalBookings: ownerBookings.length,
    totalRevenue: ownerBookings.reduce((sum: number, booking: any) => sum + booking.totalAmount, 0),
    pendingContracts: ownerContracts.filter((c: any) => c.status === 'sent').length,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review': return <Clock className="w-5 h-5" />;
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'pending_contract': return <Clock className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unit Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your properties and track performance</p>
        </div>
        <button
          onClick={() => setShowPropertyForm(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.totalProperties}</p>
            </div>
            <Building className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Live & Bookable</p>
              <p className="text-3xl font-bold text-green-600">{stats.approvedProperties}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingProperties}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Contracts</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingContracts}</p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Pending Contracts Alert */}
      {stats.pendingContracts > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">
              You have {stats.pendingContracts} contract{stats.pendingContracts > 1 ? 's' : ''} awaiting your review
            </span>
          </div>
        </div>
      )}

      {/* Contract Review Section */}
      <div className="mb-8">
        <ContractReviewSystem />
      </div>

      {/* Recent Properties */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">My Properties</h2>
            <button
              onClick={() => setShowPropertyForm(true)}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Add New Property
            </button>
          </div>
        </div>

        <div className="p-6">
          {ownerProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't listed any properties yet</p>
              <button
                onClick={() => setShowPropertyForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                List Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {ownerProperties.slice(0, 6).map((property: Property) => (
                <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 space-y-2">
                      <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                        {getStatusIcon(property.status)}
                        <span>{property.status.replace('_', ' ')}</span>
                      </span>
                      {property.termClassification && (
                        <span className={`block px-3 py-1 rounded-full text-xs font-medium ${
                          property.termClassification === 'short-term' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {property.termClassification === 'short-term' ? 'Short-term' : 'Long-term'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{property.address}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                      <span>Max {property.maxGuests} guests</span>
                    </div>

                    {property.maxStayDisplay && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700 font-medium">Maximum Stay</p>
                            <p className="text-blue-900">{property.maxStayDisplay}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.termClassification === 'short-term' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {property.termClassification === 'short-term' ? 'Short-term' : 'Long-term'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Rate per night</div>
                        <div className="font-semibold text-emerald-600">
                          ${getDisplayRate(property)}
                          {property.baseRate && property.finalRate && property.baseRate !== property.finalRate && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              Base: ${property.baseRate}
                            </span>
                          )}
                          {property.commissionPercentage && (
                            <div className="text-xs text-gray-500">
                              +{property.commissionPercentage}% commission
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      
                      {(property.status === 'approved' || property.status === 'rejected') && (
                        <button
                          onClick={() => setEditingProperty(property)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Property Submission Form Modal */}
      {showPropertyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Add New Property</h3>
                <button
                  onClick={() => setShowPropertyForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <PropertySubmissionForm 
                onSubmit={() => {
                  setShowPropertyForm(false);
                  alert('Property submitted successfully! It will be reviewed by our team.');
                }}
                onCancel={() => setShowPropertyForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Edit Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Edit Property</h3>
                  <p className="text-gray-600">Make changes to your property listing</p>
                </div>
                <button
                  onClick={() => setEditingProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <PropertyEditSystem 
                property={editingProperty}
                onEditSubmitted={() => {
                  setEditingProperty(null);
                  alert('Property updated successfully! It will be reviewed again before going live.');
                }}
                onCancel={() => setEditingProperty(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedProperty.title}</h3>
                  <p className="text-gray-600">{selectedProperty.address}</p>
                  <span className={`inline-flex items-center space-x-1 mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProperty.status)}`}>
                    {getStatusIcon(selectedProperty.status)}
                    <span>{selectedProperty.status.replace('_', ' ')}</span>
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
                            className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm"
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
                      <span className="text-sm font-medium text-gray-700">Your Proposed Rate:</span>
                      <p className="text-2xl font-bold text-gray-900">${selectedProperty.proposedRate}/night</p>
                    </div>
                    
                    {selectedProperty.finalRate && selectedProperty.finalRate !== selectedProperty.proposedRate && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Final Approved Rate:</span>
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

export default UnitOwnerDashboard;