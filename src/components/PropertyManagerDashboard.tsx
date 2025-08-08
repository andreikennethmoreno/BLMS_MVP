import React, { useState } from 'react';
import { Building, Users, CheckCircle, Clock, XCircle, DollarSign, FileText, Eye } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';
import bookingsData from '../data/bookings.json';
import contractsData from '../data/contracts.json';

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
}

const PropertyManagerDashboard: React.FC = () => {
  const [properties, setProperties] = useLocalStorage('properties', propertiesData.properties);
  const [contracts, setContracts] = useLocalStorage('contracts', contractsData.contracts);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);
  const [finalRate, setFinalRate] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');

  const users = usersData.users;
  const bookings = bookingsData.bookings;

  const pendingProperties = properties.filter((p: Property) => p.status === 'pending_review');
  const approvedProperties = properties.filter((p: Property) => p.status === 'approved');
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  const getOwnerName = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || 'Unknown Owner';
  };

  const handlePropertyAction = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property);
    setReviewMode(action);
    setFinalRate(property.proposedRate);
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (!selectedProperty || !reviewMode) return;

    const updatedProperties = properties.map((p: Property) => {
      if (p.id === selectedProperty.id) {
        if (reviewMode === 'approve') {
          return {
            ...p,
            status: 'pending_contract',
            finalRate: finalRate,
            approvedAt: new Date().toISOString()
          };
        } else {
          return {
            ...p,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason
          };
        }
      }
      return p;
    });

    setProperties(updatedProperties);

    if (reviewMode === 'approve') {
      // Send contract
      const newContract = {
        id: `contract-${Date.now()}`,
        propertyId: selectedProperty.id,
        ownerId: selectedProperty.ownerId,
        terms: `Standard property rental agreement with 15% platform commission. Final rate: $${finalRate}/night.`,
        finalRate: finalRate,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      
      setContracts([...contracts, newContract]);

      // Update property status to show contract was sent
      const propertiesWithContract = updatedProperties.map((p: Property) => {
        if (p.id === selectedProperty.id) {
          return { ...p, contractSentAt: new Date().toISOString() };
        }
        return p;
      });
      setProperties(propertiesWithContract);
    }

    setSelectedProperty(null);
    setReviewMode(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Property Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage properties, owners, and bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-orange-600">{pendingProperties.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Properties</p>
              <p className="text-3xl font-bold text-blue-600">{approvedProperties.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-emerald-600">{totalBookings}</p>
            </div>
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">${totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Pending Properties Review */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Properties Pending Review ({pendingProperties.length})
          </h2>
        </div>

        <div className="p-6">
          {pendingProperties.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No properties pending review</p>
          ) : (
            <div className="space-y-4">
              {pendingProperties.map((property: Property) => (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                          <p className="text-gray-600">{property.address}</p>
                          <p className="text-sm text-gray-500">Owner: {getOwnerName(property.ownerId)}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-600">
                              {property.bedrooms} bed, {property.bathrooms} bath
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              Proposed: ${property.proposedRate}/night
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handlePropertyAction(property, 'approve')}
                        className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handlePropertyAction(property, 'reject')}
                        className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedProperty && reviewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {reviewMode === 'approve' ? 'Approve Property' : 'Reject Property'}
            </h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{selectedProperty.title}</h4>
              <p className="text-gray-600">{selectedProperty.address}</p>
            </div>

            {reviewMode === 'approve' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Room Rate (per night)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={finalRate}
                      onChange={(e) => setFinalRate(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Owner proposed: ${selectedProperty.proposedRate}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedProperty(null);
                  setReviewMode(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={reviewMode === 'reject' && !rejectionReason.trim()}
                className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors ${
                  reviewMode === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {reviewMode === 'approve' ? 'Approve & Send Contract' : 'Reject Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && !reviewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">{selectedProperty.title}</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

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

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600 mt-1">{selectedProperty.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Details</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-sm text-gray-500">Bedrooms:</span>
                      <span className="ml-2 text-gray-900">{selectedProperty.bedrooms}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Bathrooms:</span>
                      <span className="ml-2 text-gray-900">{selectedProperty.bathrooms}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Max Guests:</span>
                      <span className="ml-2 text-gray-900">{selectedProperty.maxGuests}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Proposed Rate:</span>
                      <span className="ml-2 text-gray-900">${selectedProperty.proposedRate}/night</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Amenities</h4>
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

                <div>
                  <h4 className="font-medium text-gray-900">Owner</h4>
                  <p className="text-gray-600 mt-1">{getOwnerName(selectedProperty.ownerId)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagerDashboard;